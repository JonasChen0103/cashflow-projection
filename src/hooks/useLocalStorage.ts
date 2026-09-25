import { useEffect, useState } from 'react';

/** State mirrored to localStorage, debounced 500ms; unreadable data falls back to `initial`. */
export function useLocalStorage<T>(key: string, initial: () => T, migrate: (v: T) => T = (v) => v) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? migrate({ ...initial(), ...JSON.parse(raw) }) : initial();
    } catch {
      return initial();
    }
  });

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* Private mode or quota exceeded: not worth interrupting the user over. */
      }
    }, 500);
    return () => clearTimeout(id);
  }, [key, value]);

  return [value, setValue] as const;
}
