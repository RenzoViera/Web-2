import { useLocation } from 'react-router';
import { BookOpenIcon, PresentationIcon } from '@/components/icons';
import { AuthCard } from '@/components/layout/AuthCard';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { RadioCardGroup } from '@/components/ui/RadioCardGroup';
import { TextLink } from '@/components/ui/TextLink';
import { useAppForm } from '@/hooks/useAppForm';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { PATHS } from '@/routes/paths';
import { ROLES } from '@/utils/roles';
import { email, maxLength, minLength, required } from '@/utils/validation';

/** @type {import('@/services/authService').RegisterData} */
const DEFAULT_VALUES = { nombre: '', email: '', password: '', rol: ROLES.ESTUDIANTE };

/** @type {import('@/utils/validation').FormRules} */
const RULES = {
  nombre: [
    required('Ingresa tu nombre'),
    minLength(2, 'El nombre debe tener al menos 2 caracteres'),
    maxLength(100, 'El nombre no puede superar los 100 caracteres'),
  ],
  email: [
    required('Ingresa tu email'),
    email('Ingresa un email válido'),
    maxLength(255, 'El email no puede superar los 255 caracteres'),
  ],
  password: [
    required('Crea una contraseña'),
    minLength(8, 'La contraseña debe tener al menos 8 caracteres'),
    maxLength(72, 'La contraseña no puede superar los 72 caracteres'),
  ],
  rol: [required('Elige cómo vas a usar MiniAula')],
};

/** @type {import('@/components/ui/RadioCardGroup').RadioCardOption[]} */
const ROLE_OPTIONS = [
  {
    value: ROLES.ESTUDIANTE,
    label: 'Estudiante',
    description: 'Me inscribo en cursos y avanzo lección por lección.',
    icon: <BookOpenIcon />,
  },
  {
    value: ROLES.INSTRUCTOR,
    label: 'Instructor',
    description: 'Creo cursos con lecciones y cuestionarios.',
    icon: <PresentationIcon />,
  },
];

// Tras registrarse, GuestRoute redirige a la página de origen o al inicio del rol.
export default function RegisterPage() {
  const { register: createAccount } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const {
    register,
    submit,
    formError,
    formState: { errors, isSubmitting },
  } = useAppForm({ defaultValues: DEFAULT_VALUES, rules: RULES });

  const onSubmit = submit(async (/** @type {import('@/services/authService').RegisterData} */ values) => {
    await createAccount(values);
    toast.success('Tu cuenta está lista. ¡Te damos la bienvenida a MiniAula!');
  });

  return (
    <AuthCard
      title="Crea tu cuenta"
      description="Aprende o enseña: elige tu rol y empieza en un minuto."
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <TextLink to={PATHS.login} state={location.state}>
            Inicia sesión
          </TextLink>
        </>
      }
    >
      <title>Crear cuenta · MiniAula</title>
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        {formError && <Alert variant="error">{formError}</Alert>}
        <Input label="Nombre" autoComplete="name" required error={errors.nombre?.message} {...register('nombre')} />
        <Input
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordInput
          label="Contraseña"
          autoComplete="new-password"
          hint="Mínimo 8 caracteres."
          required
          error={errors.password?.message}
          {...register('password')}
        />
        <RadioCardGroup
          legend="¿Cómo vas a usar MiniAula?"
          options={ROLE_OPTIONS}
          hint="El rol no se puede cambiar después."
          error={errors.rol?.message}
          {...register('rol')}
        />
        <Button type="submit" fullWidth loading={isSubmitting} className="mt-2">
          Crear cuenta
        </Button>
      </form>
    </AuthCard>
  );
}
