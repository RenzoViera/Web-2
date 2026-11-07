import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '@/api/ApiError';
import { setUnauthorizedHandler } from '@/api/axiosClient';
import { useToast } from '@/hooks/useToast';
import * as authService from '@/services/authService';
import { clearStoredSession, readStoredSession, SESSION_KEY, storeSession } from '@/utils/authStorage';
import { setErrorReportUser } from '@/utils/errorReport';
import { AuthContext } from './AuthContext';

/** @typedef {import('@/services/authService').AuthSession} AuthSession */

/**
 * Sesión global. Arranca con la sesión guardada (sin esperar a la red) y la valida en segundo plano
 * con GET /users/me. Un 401 en cualquier request cierra la sesión y `ProtectedRoute` lleva a /login.
 * @param {{ children: import('react').ReactNode }} props
 */
export function AuthProvider({ children }) {
  const toast = useToast();
  const [session, setSession] = useState(readStoredSession);
  // Copia síncrona de la sesión: la leen callbacks que corren antes del próximo render.
  const sessionRef = useRef(session);

  /** Único punto que cambia la sesión: memoria, storage y estado en un solo paso. */
  const applySession = useCallback((/** @type {AuthSession | null} */ next) => {
    sessionRef.current = next;
    if (next) storeSession(next);
    else clearStoredSession();
    setSession(next);
  }, []);

  // El reporte de errores inesperados incluye al usuario en sesión.
  useEffect(() => {
    setErrorReportUser(session?.user ?? null);
  }, [session]);

  useEffect(() => {
    setUnauthorizedHandler((error) => {
      // Sin sesión (p. ej. login con credenciales incorrectas) el 401 lo maneja el formulario.
      if (!sessionRef.current) return;
      applySession(null);
      toast.warning(error.message);
    });
    return () => setUnauthorizedHandler(null);
  }, [applySession, toast]);

  // Al cargar la app: valida la sesión guardada y refresca los datos del usuario.
  useEffect(() => {
    const stored = sessionRef.current;
    if (!stored) return undefined;
    let ignore = false;

    authService.getMe().then(
      (user) => {
        if (!ignore && sessionRef.current?.token === stored.token) applySession({ token: stored.token, user });
      },
      (error) => {
        // 401: ya cerró la sesión el handler. Sin conexión u otro 4xx: se avisa y se mantiene la sesión guardada.
        if (ignore || (error instanceof ApiError && error.status === 401)) return;
        if (error instanceof ApiError && error.status < 500) {
          toast.error(error.message);
          return;
        }
        throw error;
      },
    );

    return () => {
      ignore = true;
    };
  }, [applySession, toast]);

  // Otra pestaña inició o cerró sesión: esta se sincroniza (el token del storage es el que viaja en cada request).
  useEffect(() => {
    /** @param {StorageEvent} event */
    const handleStorage = (event) => {
      if (event.key !== SESSION_KEY && event.key !== null) return;
      const next = readStoredSession();
      sessionRef.current = next;
      setSession(next);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = useCallback(
    async (/** @type {import('@/services/authService').LoginData} */ data) => {
      const next = await authService.login(data);
      applySession(next);
      return next.user;
    },
    [applySession],
  );

  const register = useCallback(
    async (/** @type {import('@/services/authService').RegisterData} */ data) => {
      const next = await authService.register(data);
      applySession(next);
      return next.user;
    },
    [applySession],
  );

  const logout = useCallback(() => applySession(null), [applySession]);

  const updateProfile = useCallback(
    async (/** @type {import('@/services/authService').UpdateMeData} */ changes) => {
      const user = await authService.updateMe(changes);
      const current = sessionRef.current;
      if (current) applySession({ ...current, user });
      return user;
    },
    [applySession],
  );

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      login,
      register,
      logout,
      updateProfile,
    }),
    [session, login, register, logout, updateProfile],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
