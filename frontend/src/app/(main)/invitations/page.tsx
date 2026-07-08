"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InvitationsPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/access"); }, [router]);
  return null;
}
