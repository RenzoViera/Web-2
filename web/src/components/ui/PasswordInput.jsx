import { useId, useState } from 'react';
import { EyeIcon, EyeOffIcon } from '@/components/icons';
import { Button } from './Button';
import { Input } from './Input';

/**
 * Campo de contraseña con botón para mostrarla u ocultarla. Mismas props que `Input` (sin `type` ni `end`).
 * @param {Omit<import('react').ComponentProps<typeof Input>, 'type' | 'end'>} props
 */
export function PasswordInput({ id, ...rest }) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <Input
      {...rest}
      id={inputId}
      type={visible ? 'text' : 'password'}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      end={
        <Button
          variant="ghost"
          size="iconSm"
          aria-label="Mostrar contraseña"
          aria-pressed={visible}
          aria-controls={inputId}
          // Con el mouse, el foco se queda en el campo: no dispara la validación al salir.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
        </Button>
      }
    />
  );
}
