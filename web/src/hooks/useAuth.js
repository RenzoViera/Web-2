import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

/**
 * Sesión actual y acciones de autenticación.
 * @returns {import('@/context/AuthContext').AuthContextValue}
 */
export const useAuth = () => {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return auth;
};
