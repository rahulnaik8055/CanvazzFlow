"use client";

import { type ReactNode } from "react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
