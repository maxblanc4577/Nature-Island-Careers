import { useState, useEffect } from 'react';

/**
 * Generic useDebounce hook to delay updating a value until after
 * the specified delay (in milliseconds) has elapsed since the last change.
 * Useful for search inputs to prevent excessive re-renders or API calls.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
