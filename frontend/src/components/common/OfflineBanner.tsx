"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineBanner() {
  const { online } = useOnlineStatus();

  if (online) return null;

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white text-sm font-medium">
      <WifiOff size={14} />
      You are offline. Some features may be unavailable.
    </div>
  );
}
