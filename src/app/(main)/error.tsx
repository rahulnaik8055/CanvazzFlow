"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import Sidebar from "@/components/common/Navbar";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    console.error("Main layout error:", error);
  }, [error]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center justify-center py-32 px-6">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <AlertTriangle size={24} className="text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-400 text-center max-w-sm mb-6">
            We encountered an error loading this page. Please try again.
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <RefreshCw size={14} />
            Try again
          </button>
        </div>
      </main>
    </div>
  );
}
