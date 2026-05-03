// app/sync/page.tsx — hits once after signup, never again
"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useApi } from "@/lib/api";

export default function SyncPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const api = useApi();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const createUser = async () => {
      const token = await getToken();

      await api.post("/users/sync", null);

      router.replace("/editor");
    };

    createUser();
  }, [isLoaded, isSignedIn]);

  return <p>Setting up your account...</p>;
}
