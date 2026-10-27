import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

function readValue<T>(key: string, fallback: T, normalize?: (value: unknown) => T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return normalize ? normalize(parsed) : (parsed as T);
  } catch {
    return fallback;
  }
}

export function usePersistentState<T>(
  key: string,
  fallback: T,
  normalize?: (value: unknown) => T,
): [T, Dispatch<SetStateAction<T>>, () => void] {
  const fallbackRef = useRef(fallback);
  const [value, setValue] = useState<T>(() => readValue(key, fallback, normalize));

  useEffect(() => {
    fallbackRef.current = fallback;
  }, [fallback]);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage can be unavailable in private browsing or when the quota is full.
    }
  }, [key, value]);

  const reset = useCallback(() => {
    setValue(fallbackRef.current);
  }, []);

  return [value, setValue, reset];
}
