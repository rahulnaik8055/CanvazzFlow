"use client";

import { NotificationProvider } from "@/components/notifications/notification-context";

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NotificationProvider>{children}</NotificationProvider>;
}
