import { useLocation } from 'react-router';
import { AuthCard } from '@/components/layout/AuthCard';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { TextLink } from '@/components/ui/TextLink';
import { useAppForm } from '@/hooks/useAppForm';
import { useAuth } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { email, required } from '@/utils/validation';

const DEFAULT_VALUES = { email: '', password: '' };

/** @type {import('@/utils/validation').FormRules} */
const RULES = {
  email: [required('Ingresa tu email'), email('Ingresa un email válido')],
  password: [required('Ingresa tu contraseña')],
};

// Tras iniciar sesión, GuestRoute redirige a la página de origen o al inicio del rol.
export default function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const {
    register,
    submit,
    formError,
    formState: { errors, isSubmitting },
  } = useAppForm({ defaultValues: DEFAULT_VALUES, rules: RULES });

  return (
    <AuthCard
      title="Inicia sesión"
      description="Continúa con tus cursos donde los dejaste."
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <TextLink to={PATHS.registro} state={location.state}>
            Regístrate
          </TextLink>
        </>
      }
    >
      <title>Iniciar sesión · MiniAula</title>
      <form noValidate onSubmit={submit(login)} className="flex flex-col gap-4">
        {formError && <Alert variant="error">{formError}</Alert>}
        <Input
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="username"
          required
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordInput
          label="Contraseña"
          autoComplete="current-password"
          required
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" fullWidth loading={isSubmitting} className="mt-2">
          Iniciar sesión
        </Button>
      </form>
    </AuthCard>
  );
}
