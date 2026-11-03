import { Link } from 'react-router';
import { buttonClasses } from './buttonStyles';

/**
 * Enlace de navegación con apariencia de botón (mismas variantes que Button).
 * @param {import('./buttonStyles').ButtonStyleProps & import('react-router').LinkProps} props
 */
export function LinkButton({ variant, size, fullWidth, className, ...rest }) {
  return <Link className={buttonClasses({ variant, size, fullWidth, className })} {...rest} />;
}
