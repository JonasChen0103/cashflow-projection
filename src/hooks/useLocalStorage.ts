import { useEffect, useState } from 'react';

/** state + debounce 500ms 寫回 localStorage */
export function useLocalStorage<T>(key: string, initial: () => T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? { ...initial(), ...JSON.parse(raw) } : initial();
    } catch {
      return initial(); // 壞資料或無 localStorage → 退回空白狀態
    }
  });

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* 隱私模式或超出配額：不影響使用 */
      }
    }, 500);
    return () => clearTimeout(id);
  }, [key, value]);

  return [value, setValue] as const;
}
