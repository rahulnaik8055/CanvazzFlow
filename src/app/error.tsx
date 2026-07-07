"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-gray-50">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-5">
        <AlertTriangle size={28} className="text-red-400" />
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">
        Something went wrong
      </h1>
      <p className="text-sm text-gray-400 text-center max-w-md mb-8">
        An unexpected error occurred. This has been logged and we will look into it.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <RefreshCw size={14} />
          Try again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Home size={14} />
          Go home
        </Link>
      </div>
    </div>
  );
}
