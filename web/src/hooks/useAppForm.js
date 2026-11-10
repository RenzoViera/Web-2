import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ApiError } from '@/api/ApiError';
import { createResolver, validateField } from '@/utils/validation';

/**
 * @template {import('react-hook-form').FieldValues} T
 * @typedef {Omit<import('react-hook-form').UseFormReturn<T>, 'register'> & {
 *   register: import('react-hook-form').UseFormRegister<T>,
 *   submit: (onValid: (values: T) => unknown) => (event?: import('react').BaseSyntheticEvent) => Promise<void>,
 *   formError: string | null,
 *   setApiErrors: (error: unknown) => void,
 * }} AppForm
 */

/**
 * Único hook de formularios (REGLAS C.39), sobre React Hook Form:
 * - Valida cada campo al salir (blur), nunca mientras se escribe.
 * - Si un campo ya muestra un error, al escribir se revalida solo para limpiarlo.
 * - El submit valida todo y enfoca el primer campo inválido.
 * - `submit(fn)` captura los errores de la API: los de campo van debajo de cada input y el resto a `formError`.
 *
 * @template {import('react-hook-form').FieldValues} T
 * @param {{ defaultValues: T, rules: import('@/utils/validation').FormRules }} options
 *   `rules` debe ser una constante (fuera del componente).
 * @returns {AppForm<T>}
 */
export const useAppForm = ({ defaultValues, rules }) => {
  const [resolver] = useState(() => createResolver(rules));
  const [fieldNames] = useState(() => new Set(Object.keys(defaultValues)));
  const [formError, setFormError] = useState(/** @type {string | null} */ (null));

  /** @type {import('react-hook-form').UseFormReturn<T>} */
  const form = useForm({
    defaultValues: /** @type {import('react-hook-form').DefaultValues<T>} */ (defaultValues),
    resolver,
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });
  const { register: registerField, getFieldState, getValues, clearErrors, setError, handleSubmit } = form;

  /** @type {import('react-hook-form').UseFormRegister<T>} */
  const register = useCallback(
    (name, options) => {
      const field = registerField(name, options);
      return {
        ...field,
        onChange: async (event) => {
          const result = await field.onChange(event);
          if (getFieldState(name).error && !validateField(rules, name, getValues())) clearErrors(name);
          return result;
        },
      };
    },
    [registerField, getFieldState, getValues, clearErrors, rules],
  );

  /**
   * Errores esperados de la API → campos (`details`) o mensaje general. Lo inesperado (5xx, bugs) se relanza
   * para que lo muestre el manejador global con el detalle para reportar.
   */
  const setApiErrors = useCallback(
    (/** @type {unknown} */ error) => {
      if (!(error instanceof ApiError) || error.status >= 500) throw error;

      /** @type {Map<string, string>} */
      const fieldMessages = new Map();
      for (const { field, message } of error.details ?? []) {
        // Campos anidados (`opciones.1`) se muestran en su campo raíz (`opciones`).
        const name = field && (fieldNames.has(field) ? field : field.split('.')[0]);
        if (name && fieldNames.has(name) && !fieldMessages.has(name)) fieldMessages.set(name, message);
      }
      if (fieldMessages.size === 0) {
        setFormError(error.message);
        return;
      }

      let shouldFocus = true;
      for (const [field, message] of fieldMessages) {
        const name = /** @type {import('react-hook-form').Path<T>} */ (field);
        setError(name, { type: 'server', message }, { shouldFocus });
        shouldFocus = false;
      }
    },
    [fieldNames, setError],
  );

  const submit = useCallback(
    (/** @type {(values: T) => unknown} */ onValid) => {
      const handle = handleSubmit(async (values) => {
        try {
          await onValid(values);
        } catch (error) {
          setApiErrors(error);
        }
      });
      return (/** @type {import('react').BaseSyntheticEvent | undefined} */ event) => {
        setFormError(null);
        return handle(event);
      };
    },
    [handleSubmit, setApiErrors],
  );

  return { ...form, register, submit, formError, setApiErrors };
};
