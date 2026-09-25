import { useEffect, useState } from 'react';

/** State mirrored to localStorage; `parse` turns whatever is stored — or nothing — into a usable value. */
export function useLocalStorage<T>(key: string, parse: (raw: unknown) => T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return parse(raw === null ? null : JSON.parse(raw));
    } catch {
      return parse(null);
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
