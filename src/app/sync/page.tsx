// app/sync/page.tsx — hits once after signup, never again
"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useApi } from "@/lib/api";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function SyncPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const api = useApi();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const createUser = async () => {
      await api.post("users/sync", {});
      router.replace("/project");
    };

    createUser();
  }, [isLoaded, isSignedIn]);

  return <LoadingOverlay isLoading={true} text="Syncing your account..." />;
}
