"use client";

import { useState } from "react";
import Sidebar from "@/components/common/Navbar";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { MobileBlocker } from "@/components/common/MobileBlocker";
import { useCollaboratorUpdates } from "@/hooks/useCollaboratorUpdates";
import { NotificationProvider } from "@/components/notifications/notification-context";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useCollaboratorUpdates();

  return (
    <MobileBlocker>
      <NotificationProvider>
        <div className="flex h-screen overflow-hidden bg-gray-50">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

          <main className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto px-6 py-8">
              <ErrorBoundary>{children}</ErrorBoundary>
            </div>
          </main>
        </div>
      </NotificationProvider>
    </MobileBlocker>
  );
}
