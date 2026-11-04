import { cn } from '@/utils/cn';

/**
 * Base de íconos SVG (trazo, 24×24, decorativos por defecto).
 * @param {import('react').SVGProps<SVGSVGElement>} props
 */
export function Icon({ className, children, ...rest }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn('size-5 shrink-0', className)}
      {...rest}
    >
      {children}
    </svg>
  );
}

/** @param {import('react').SVGProps<SVGSVGElement>} props */
export const MenuIcon = (props) => (
  <Icon {...props}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Icon>
);

/** @param {import('react').SVGProps<SVGSVGElement>} props */
export const CloseIcon = (props) => (
  <Icon {...props}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icon>
);

/** @param {import('react').SVGProps<SVGSVGElement>} props */
export const AlertTriangleIcon = (props) => (
  <Icon {...props}>
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <path d="M12 9v4M12 17h.01" />
  </Icon>
);

/** @param {import('react').SVGProps<SVGSVGElement>} props */
export const InboxIcon = (props) => (
  <Icon {...props}>
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </Icon>
);

/** @param {import('react').SVGProps<SVGSVGElement>} props */
export const CheckCircleIcon = (props) => (
  <Icon {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </Icon>
);

/** @param {import('react').SVGProps<SVGSVGElement>} props */
export const InfoIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </Icon>
);
