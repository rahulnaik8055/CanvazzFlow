
"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useApi } from "@/lib/api";
import LoadingOverlay from "@/components/LoadingOverlay";
import { toast } from "sonner";

export default function SyncPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const api = useApi();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const createUser = async () => {
      try {
        await api.post("users/sync", {});
        router.replace("/dashboard");
      } catch (err) {
        console.error(err);
        toast.error("Failed to sync account. Please try refreshing.");
      }
    };

    createUser();
  }, [isLoaded, isSignedIn]);

  return <LoadingOverlay isLoading={true} text="Syncing your account..." />;
}
