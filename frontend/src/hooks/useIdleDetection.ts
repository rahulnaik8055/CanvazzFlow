import { useEffect, useRef, useCallback } from "react";

const IDLE_THRESHOLD_MS = 60_000;

export function useIdleDetection(
  onIdleChange: (isIdle: boolean) => void,
  onActive: () => void,
) {
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isIdleRef = useRef(false);

  const resetIdle = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (isIdleRef.current) {
      isIdleRef.current = false;
      onIdleChange(false);
    }
    onActive();
    idleTimerRef.current = setTimeout(() => {
      isIdleRef.current = true;
      onIdleChange(true);
    }, IDLE_THRESHOLD_MS);
  }, [onIdleChange, onActive]);

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];

    const handler = () => resetIdle();

    events.forEach((event) => window.addEventListener(event, handler));
    resetIdle();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handler));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdle]);
}
