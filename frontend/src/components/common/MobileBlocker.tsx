"use client";

import { useState, useEffect } from "react";
import { Monitor } from "lucide-react";

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;
}

export function MobileBlocker({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
          <Monitor size={28} className="text-gray-400" />
        </div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">
          Desktop Only
        </h1>
        <p className="text-sm text-gray-500 max-w-sm">
          CanvazzFlow is a design tool that requires a desktop screen. Please visit on a computer to get started.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
