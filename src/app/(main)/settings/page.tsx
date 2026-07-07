"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Loader2,
  User,
  AtSign,
  AlignLeft,
  Eye,
  Globe,
  Lock,
  Mail,
  Check,
  X,
  Camera,
  Shield,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function getInitials(firstName?: string | null, lastName?: string | null): string {
  return [firstName, lastName].filter(Boolean).map((s) => (s as string)[0]).join("").toUpperCase().slice(0, 2);
}

export default function SettingsPage() {
  const router = useRouter();
  const { profile, loading, updateProfile, updatePrivacy, checkUsername } = useProfile();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profileVisibility, setProfileVisibility] = useState<"public" | "private">("public");
  const [showEmail, setShowEmail] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setProfileVisibility(profile.profileVisibility);
      setShowEmail(profile.showEmail);
    }
  }, [profile]);

  const handleUsernameChange = useCallback((val: string) => {
    const cleaned = val.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
    setUsername(cleaned);
    setDirty(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!cleaned || cleaned === profile?.username) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    debounceRef.current = setTimeout(async () => {
      const available = await checkUsername(cleaned);
      setUsernameAvailable(available);
      setCheckingUsername(false);
    }, 500);
  }, [checkUsername, profile?.username]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile({ displayName: displayName || undefined, username: username || undefined, bio: bio || undefined });
      toast.success("Profile updated");
      setDirty(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePrivacy = async () => {
    setSavingPrivacy(true);
    try {
      await updatePrivacy({ profileVisibility, showEmail });
      toast.success("Privacy settings updated");
    } catch {
      toast.error("Failed to update privacy");
    } finally {
      setSavingPrivacy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-gray-300" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-sm text-gray-400">Could not load profile.</p>
      </div>
    );
  }

  const initials = getInitials(profile.firstName, profile.lastName);
  const usernameChanged = username !== (profile.username || "");
  const canSave = dirty && (!usernameChanged || usernameAvailable !== false);

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your profile and privacy</p>
      </div>

      {/* Profile section */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
          <User size={16} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Profile</h2>
        </div>

        <div className="p-6 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                {profile.imageUrl ? (
                  <img src={profile.imageUrl} alt="" className="w-full h-full object-vert" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-400">{initials}</span>
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-xl flex items-center justify-center transition-all cursor-pointer">
                <Camera size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {profile.firstName} {profile.lastName}
              </p>
              <p className="text-xs text-gray-400">Avatar is managed by your account provider</p>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5">
              <User size={12} />
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); setDirty(true); }}
              placeholder="Your display name"
              maxLength={50}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
            />
          </div>

          {/* Username */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5">
              <AtSign size={12} />
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="username"
                maxLength={30}
                className="w-full px-3 py-2 pr-8 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checkingUsername && <Loader2 size={14} className="animate-spin text-gray-300" />}
                {!checkingUsername && usernameAvailable === true && (
                  <Check size={14} className="text-green-500" />
                )}
                {!checkingUsername && usernameAvailable === false && (
                  <X size={14} className="text-red-400" />
                )}
              </div>
            </div>
            {usernameAvailable === false && (
              <p className="text-[11px] text-red-400 mt-1">This username is taken</p>
            )}
            {username && usernameAvailable === true && (
              <p className="text-[11px] text-green-500 mt-1">Available</p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5">
              <AlignLeft size={12} />
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => { setBio(e.target.value); setDirty(true); }}
              placeholder="Tell us about yourself..."
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white resize-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">{bio.length}/500</p>
          </div>

          <div className="pt-2">
            <Button
              onClick={handleSaveProfile}
              disabled={savingProfile || !canSave}
            >
              {savingProfile ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {savingProfile ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
      </div>

      {/* Privacy section */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
          <Shield size={16} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Privacy</h2>
        </div>

        <div className="p-6 space-y-5">
          {/* Profile visibility */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
              <Eye size={12} />
              Profile Visibility
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setProfileVisibility("public")}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-xl border transition-all ${
                  profileVisibility === "public"
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
              >
                <Globe size={14} />
                Public
              </button>
              <button
                onClick={() => setProfileVisibility("private")}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-xl border transition-all ${
                  profileVisibility === "private"
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
              >
                <Lock size={14} />
                Private
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              {profileVisibility === "public"
                ? "Anyone can see your avatar, display name, username, and bio."
                : "Only you can see your profile information."}
            </p>
          </div>

          {/* Show email */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Mail size={16} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Show email on profile</p>
                <p className="text-xs text-gray-400">
                  Display your email address on your public profile
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowEmail(!showEmail)}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                showEmail ? "bg-gray-900" : "bg-gray-200"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                  showEmail ? "translate-x-[18px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="pt-2">
            <Button
              onClick={handleSavePrivacy}
              disabled={savingPrivacy}
              variant="outline"
            >
              {savingPrivacy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {savingPrivacy ? "Saving..." : "Save privacy"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
