import { useEffect, useState } from "react";

export function useDebounce<T>(value: T): T {
  const [debounced, setDebounced] = useState(value);
  const delay = 400;

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
