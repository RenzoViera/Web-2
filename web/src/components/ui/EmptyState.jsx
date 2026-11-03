import { InboxIcon } from '@/components/icons';
import { cn } from '@/utils/cn';

/**
 * Estado vacío de una vista o sección.
 * @param {{
 *   title: string,
 *   description?: string,
 *   action?: import('react').ReactNode,
 *   icon?: import('react').ReactNode,
 *   className?: string,
 * }} props
 */
export function EmptyState({ title, description, action, icon, className }) {
  return (
    <div
      className={cn(
        'flex animate-fade-in flex-col items-center gap-3 rounded-xl border border-dashed border-border-strong px-4 py-12 text-center',
        className,
      )}
    >
      <span className="text-fg-subtle">{icon ?? <InboxIcon className="size-10" />}</span>
      <div className="max-w-md">
        <p className="font-semibold text-fg">{title}</p>
        {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
