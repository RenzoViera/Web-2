import { useEffect, useEffectEvent } from 'react';

/**
 * Cierra un elemento flotante (menú, desplegable, popover) con clic afuera o Escape.
 * El motivo permite devolver el foco al botón que lo abrió solo con Escape (con clic afuera, el foco va adonde
 * hizo clic el usuario).
 * @param {import('react').RefObject<HTMLElement | null>} ref Contenedor que NO dispara el cierre.
 * @param {(reason: 'outside' | 'escape') => void} onDismiss
 * @param {boolean} enabled Solo escucha mientras está abierto.
 */
export const useDismiss = (ref, onDismiss, enabled) => {
  const dismiss = useEffectEvent(onDismiss);

  useEffect(() => {
    if (!enabled) return undefined;

    /** @param {PointerEvent} event */
    const handlePointerDown = (event) => {
      if (ref.current && !ref.current.contains(/** @type {Node} */ (event.target))) dismiss('outside');
    };
    /** @param {KeyboardEvent} event */
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      // Evita que el Escape cierre también un modal padre.
      event.stopPropagation();
      dismiss('escape');
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref, enabled]);
};
