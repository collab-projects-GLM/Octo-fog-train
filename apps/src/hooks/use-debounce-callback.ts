import { useCallback, useEffect, useRef } from "react";

/**
 * @abstract A debounce function
 * @author Ayush Pradhan
 * @description Dont worry about this
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number,
): { run: (...args: Args) => void; cancel: () => void } {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(callback);

  useEffect(() => {
    latest.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => cancel, [cancel]);

  const run = (...args: Args) => {
    cancel();
    timer.current = setTimeout(() => {
      timer.current = null;
      latest.current(...args);
    }, delayMs);
  };

  return { run, cancel };
}
