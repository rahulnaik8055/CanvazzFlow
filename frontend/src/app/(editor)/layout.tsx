"use client";

import { NotificationProvider } from "@/components/notifications/notification-context";
import { MobileBlocker } from "@/components/common/MobileBlocker";

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MobileBlocker>
      <NotificationProvider>{children}</NotificationProvider>
    </MobileBlocker>
  );
}
