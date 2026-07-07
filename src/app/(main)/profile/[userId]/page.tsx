"use client";

import { useParams } from "next/navigation";
import { ProfileView } from "@/components/profile/ProfileView";

export default function UserProfilePage() {
  const params = useParams();
  return <ProfileView userId={params.userId as string} />;
}
