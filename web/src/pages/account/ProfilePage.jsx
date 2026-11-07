import { Alert } from '@/components/ui/Alert';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useAppForm } from '@/hooks/useAppForm';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/utils/format';
import { ROLE_LABELS } from '@/utils/roles';
import { email, maxLength, minLength, required } from '@/utils/validation';

/** @typedef {import('@/services/authService').Usuario} Usuario */

/** @type {import('@/utils/validation').FormRules} */
const PROFILE_RULES = {
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
};

const PASSWORD_DEFAULTS = { passwordActual: '', password: '' };

/** @type {import('@/utils/validation').FormRules} */
const PASSWORD_RULES = {
  passwordActual: [required('Ingresa tu contraseña actual')],
  password: [
    required('Ingresa la nueva contraseña'),
    minLength(8, 'La contraseña debe tener al menos 8 caracteres'),
    maxLength(72, 'La contraseña no puede superar los 72 caracteres'),
  ],
};

// RF-03. Los datos salen de la sesión (validada con GET /users/me al cargar la app): no se piden de nuevo.
export default function ProfilePage() {
  const { user } = useAuth();
  // ProtectedRoute garantiza la sesión; si se cierra, redirige antes de llegar aquí.
  if (!user) return null;

  return (
    <div className="mx-auto flex max-w-2xl animate-fade-in flex-col gap-6">
      <title>Mi perfil · MiniAula</title>
      <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">Mi perfil</h1>

      <Card className="flex items-center gap-4">
        <Avatar name={user.nombre} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-fg">{user.nombre}</p>
          <p className="truncate text-sm text-fg-muted">{user.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <Badge variant="primary">{ROLE_LABELS[user.rol]}</Badge>
            <span className="text-xs text-fg-subtle">Miembro desde el {formatDate(user.createdAt)}</span>
          </div>
        </div>
      </Card>

      {/* Si cambian los datos de la sesión (al guardar o al validarla), el formulario se reinicia con los nuevos. */}
      <ProfileForm key={JSON.stringify([user.nombre, user.email])} user={user} />
      <PasswordForm />
    </div>
  );
}

/** @param {{ user: Usuario }} props */
function ProfileForm({ user }) {
  const { updateProfile } = useAuth();
  const toast = useToast();
  const {
    register,
    submit,
    reset,
    formError,
    formState: { errors, isSubmitting, isDirty },
  } = useAppForm({ defaultValues: { nombre: user.nombre, email: user.email }, rules: PROFILE_RULES });

  const onSubmit = submit(async (/** @type {{ nombre: string, email: string }} */ values) => {
    // Solo viajan los campos que cambiaron (la API normaliza: recorta espacios y pasa el email a minúsculas).
    /** @type {import('@/services/authService').UpdateMeData} */
    const changes = {};
    if (values.nombre.trim() !== user.nombre) changes.nombre = values.nombre;
    if (values.email.trim().toLowerCase() !== user.email) changes.email = values.email;

    if (Object.keys(changes).length === 0) {
      reset({ nombre: user.nombre, email: user.email });
      toast.info('No hay cambios para guardar.');
      return;
    }

    await updateProfile(changes);
    toast.success('Tus datos se actualizaron.');
  });

  return (
    <Card as="section" aria-labelledby="perfil-datos">
      <h2 id="perfil-datos" className="text-lg font-semibold text-fg">
        Datos personales
      </h2>
      <p className="mt-1 text-sm text-fg-muted">El rol no se puede cambiar.</p>
      <form noValidate onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
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
        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting} disabled={!isDirty} className="w-full sm:w-auto">
            Guardar cambios
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PasswordForm() {
  const { updateProfile } = useAuth();
  const toast = useToast();
  const {
    register,
    submit,
    reset,
    formError,
    formState: { errors, isSubmitting },
  } = useAppForm({ defaultValues: PASSWORD_DEFAULTS, rules: PASSWORD_RULES });

  const onSubmit = submit(async (/** @type {typeof PASSWORD_DEFAULTS} */ values) => {
    await updateProfile(values);
    reset();
    toast.success('Tu contraseña se actualizó.');
  });

  return (
    <Card as="section" aria-labelledby="perfil-password">
      <h2 id="perfil-password" className="text-lg font-semibold text-fg">
        Cambiar contraseña
      </h2>
      <p className="mt-1 text-sm text-fg-muted">Por seguridad, confirma tu contraseña actual.</p>
      <form noValidate onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
        {formError && <Alert variant="error">{formError}</Alert>}
        <PasswordInput
          label="Contraseña actual"
          autoComplete="current-password"
          required
          error={errors.passwordActual?.message}
          {...register('passwordActual')}
        />
        <PasswordInput
          label="Nueva contraseña"
          autoComplete="new-password"
          hint="Mínimo 8 caracteres."
          required
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">
            Actualizar contraseña
          </Button>
        </div>
      </form>
    </Card>
  );
}
