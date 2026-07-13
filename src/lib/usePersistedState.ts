import { useCallback, useState } from 'react';
import { store } from './store';

/** useState that mirrors every update into the persistence layer under `key`. */
export function usePersistedState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => store.load(key, fallback));

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (prev: T) => T)(prev) : next;
        store.save(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  return [value, update] as const;
}
