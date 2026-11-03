import { Link } from 'react-router';
import { PATHS } from '@/routes/paths';

/** @param {{ onNavigate?: () => void }} props */
export function Logo({ onNavigate }) {
  return (
    <Link to={PATHS.home} onClick={onNavigate} className="flex items-center gap-2 rounded-lg text-lg font-bold text-fg">
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden="true" focusable="false">
        <rect width="32" height="32" rx="8" className="fill-primary" />
        <path
          d="M8 22V10l8 6 8-6v12"
          fill="none"
          className="stroke-primary-fg"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      MiniAula
    </Link>
  );
}
