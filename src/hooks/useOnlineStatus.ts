"use client";

import { useEffect, useRef, useState } from "react";

export function useOnlineStatus() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  const hasBeenOffline = useRef(false);

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      if (hasBeenOffline.current) {
        setWasOffline(true);
        setTimeout(() => setWasOffline(false), 4000);
      }
    };
    const goOffline = () => {
      hasBeenOffline.current = true;
      setOnline(false);
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return { online, wasOffline };
}
