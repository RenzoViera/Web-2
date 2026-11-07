import { Card } from '@/components/ui/Card';

/**
 * Marco de las páginas de acceso (login y registro): título, tarjeta con el formulario y pie con enlace.
 * @param {{
 *   title: string,
 *   description?: string,
 *   footer?: import('react').ReactNode,
 *   children: import('react').ReactNode,
 * }} props
 */
export function AuthCard({ title, description, footer, children }) {
  return (
    <div className="mx-auto w-full max-w-md animate-fade-in py-2 sm:py-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 text-sm text-fg-muted">{description}</p>}
      </div>
      <Card>{children}</Card>
      {footer && <p className="mt-6 text-center text-sm text-fg-muted">{footer}</p>}
    </div>
  );
}
