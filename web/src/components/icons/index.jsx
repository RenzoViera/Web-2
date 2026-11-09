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

/** @param {import('react').SVGProps<SVGSVGElement>} props */
export const AlertCircleIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </Icon>
);

/** @param {import('react').SVGProps<SVGSVGElement>} props */
export const EyeIcon = (props) => (
  <Icon {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);

/** @param {import('react').SVGProps<SVGSVGElement>} props */
export const EyeOffIcon = (props) => (
  <Icon {...props}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <path d="M1 1l22 22" />
  </Icon>
);

/** @param {import('react').SVGProps<SVGSVGElement>} props */
export const ChevronDownIcon = (props) => (
  <Icon {...props}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);

/** @param {import('react').SVGProps<SVGSVGElement>} props */
export const BookOpenIcon = (props) => (
  <Icon {...props}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </Icon>
);

/** @param {import('react').SVGProps<SVGSVGElement>} props */
export const PresentationIcon = (props) => (
  <Icon {...props}>
    <path d="M2 3h20" />
    <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" />
    <path d="m7 21 5-5 5 5" />
  </Icon>
);

/** @param {import('react').SVGProps<SVGSVGElement>} props */
export const ClockIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </Icon>
);

/** @param {import('react').SVGProps<SVGSVGElement>} props */
export const LogOutIcon = (props) => (
  <Icon {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </Icon>
);

/** @param {import('react').SVGProps<SVGSVGElement>} props */
export const PlusIcon = (props) => (
  <Icon {...props}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

/** @param {import('react').SVGProps<SVGSVGElement>} props */
export const TrashIcon = (props) => (
  <Icon {...props}>
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Icon>
);

/** @param {import('react').SVGProps<SVGSVGElement>} props */
export const EditIcon = (props) => (
  <Icon {...props}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Icon>
);

/** @param {import('react').SVGProps<SVGSVGElement>} props */
export const ArrowLeftIcon = (props) => (
  <Icon {...props}>
    <path d="m12 19-7-7 7-7M5 12h14" />
  </Icon>
);

/** @param {import('react').SVGProps<SVGSVGElement>} props */
export const UsersIcon = (props) => (
  <Icon {...props}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </Icon>
);

/** @param {import('react').SVGProps<SVGSVGElement>} props */
export const CheckIcon = (props) => (
  <Icon {...props}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);


/** @param {import('react').SVGProps<SVGSVGElement>} props */
export const ArrowUpIcon = (props) => (
  <Icon {...props}>
    <path d="m5 12 7-7 7 7M12 19V5" />
  </Icon>
);

/** @param {import('react').SVGProps<SVGSVGElement>} props */
export const ArrowDownIcon = (props) => (
  <Icon {...props}>
    <path d="M12 5v14M19 12l-7 7-7-7" />
  </Icon>
);

/** @param {import('react').SVGProps<SVGSVGElement>} props */
export const ListChecksIcon = (props) => (
  <Icon {...props}>
    <path d="m3 7 2 2 4-4M3 17l2 2 4-4M13 6h8M13 12h8M13 18h8" />
  </Icon>
);
