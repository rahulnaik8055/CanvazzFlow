// app/sync/page.tsx
"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SyncPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const createUser = async () => {
      // prevent duplicate calls
      const alreadySynced = sessionStorage.getItem("user_synced");
      if (alreadySynced) {
        router.replace("/");
        return;
      }

      const token = await getToken();
      if (!token) {
        router.replace("/sign-in");
        return;
      }

      try {
        const res = await fetch("http://localhost:5001/users", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          sessionStorage.setItem("user_synced", "true"); // ← mark as synced
          router.replace("/");
        }
      } catch (err) {
        console.error("Sync failed:", err);
        router.replace("/");
      }
    };

    if (isSignedIn) createUser();
    else router.replace("/sign-in");
  }, [isLoaded, isSignedIn]);

  return <p>Setting up your account...</p>;
}
