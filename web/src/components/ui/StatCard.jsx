import { Card } from './Card';

/**
 * Tarjeta de métrica (KPI): etiqueta con ícono, valor grande y detalle opcional.
 * @param {{
 *   label: string,
 *   value: import('react').ReactNode,
 *   icon: import('react').ReactNode,
 *   children?: import('react').ReactNode,
 * }} props `children`: detalle bajo el valor (texto o, p. ej., una `ProgressBar`).
 */
export function StatCard({ label, value, icon, children }) {
  return (
    <Card padding="sm" className="flex min-w-0 flex-col gap-1">
      <div className="flex items-center justify-between gap-2 text-fg-subtle">
        <span className="truncate text-xs font-medium tracking-wider uppercase">{label}</span>
        {icon}
      </div>
      <span className="text-2xl font-bold text-fg sm:text-3xl">{value}</span>
      {children && <div className="text-xs text-fg-muted">{children}</div>}
    </Card>
  );
}
