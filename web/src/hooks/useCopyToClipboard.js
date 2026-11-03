import { useCallback, useEffect, useRef, useState } from 'react';

const RESET_MS = 2000;

/**
 * @returns {{ copy: (text: string) => Promise<void>, status: 'idle' | 'copied' | 'error' }}
 */
export const useCopyToClipboard = () => {
  const [status, setStatus] = useState(/** @type {'idle' | 'copied' | 'error'} */ ('idle'));
  const timer = useRef(/** @type {ReturnType<typeof setTimeout> | undefined} */ (undefined));

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(async (/** @type {string} */ text) => {
    clearTimeout(timer.current);
    try {
      // navigator.clipboard solo existe en contextos seguros (https o localhost).
      if (!navigator.clipboard) throw new Error('Portapapeles no disponible');
      await navigator.clipboard.writeText(text);
      setStatus('copied');
    } catch {
      setStatus('error');
    }
    timer.current = setTimeout(() => setStatus('idle'), RESET_MS);
  }, []);

  return { copy, status };
};
