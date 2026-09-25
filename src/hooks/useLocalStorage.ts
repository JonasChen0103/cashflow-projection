import { useEffect, useState } from 'react';

/** State mirrored to localStorage; unreadable data falls back to `initial`. */
export function useLocalStorage<T>(key: string, initial: () => T, migrate: (v: T) => T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? migrate({ ...initial(), ...JSON.parse(raw) }) : initial();
    } catch {
      return initial();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* Private mode or quota exceeded: not worth interrupting the user over. */
    }
  }, [key, value]);

  return [value, setValue] as const;
}
