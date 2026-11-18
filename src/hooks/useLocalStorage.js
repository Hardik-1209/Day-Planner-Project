import { useState, useEffect, useRef, useCallback } from 'react';

export const SCHEMA_VERSION = 3;

/**
 * useLocalStorage with 300ms debounce and schema versioning
 */
export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        // Schema version check
        if (parsed && typeof parsed === 'object' && parsed._schemaVersion === SCHEMA_VERSION) {
          return parsed.data;
        }
        // If data exists without schema version or older version, migrate
        if (parsed && parsed.data !== undefined) {
          return parsed.data;
        }
        return parsed;
      }
    } catch (err) {
      console.warn(`[useLocalStorage] Error reading key "${key}":`, err);
    }
    return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
  });

  const debounceTimerRef = useRef(null);

  const setStoredValue = useCallback((newValue) => {
    setValue((prev) => {
      const resolvedValue = typeof newValue === 'function' ? newValue(prev) : newValue;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        try {
          const payload = {
            _schemaVersion: SCHEMA_VERSION,
            updatedAt: Date.now(),
            data: resolvedValue,
          };
          localStorage.setItem(key, JSON.stringify(payload));
        } catch (err) {
          console.error(`[useLocalStorage] Error writing key "${key}":`, err);
        }
      }, 300);

      return resolvedValue;
    });
  }, [key]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return [value, setStoredValue];
}

