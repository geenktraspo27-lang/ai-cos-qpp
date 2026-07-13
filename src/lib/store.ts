/**
 * Thin persistence abstraction. Today it's backed by localStorage (key prefix
 * `aicos_`, matching the design prototype). Swap `localStoragePersistence`
 * for a real API-backed implementation later without touching call sites.
 */
export interface Persistence {
  load<T>(key: string, fallback: T): T;
  save<T>(key: string, value: T): void;
}

const PREFIX = 'aicos_';

export const localStoragePersistence: Persistence = {
  load<T>(key: string, fallback: T): T {
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      return raw == null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  },
  save<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // best-effort persistence; ignore quota/serialization errors
    }
  },
};

export const store: Persistence = localStoragePersistence;
