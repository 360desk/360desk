import { createClient } from "@/lib/supabase/server";
import {
  enrichProfileFromAuth,
  fetchProfileRowSafely,
} from "@/lib/supabase/profile-query";
import type { Profile } from "@/types/database";

export async function getSessionProfile(): Promise<{
  user: { id: string; email?: string } | null;
  profile: Profile | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profileRow, error } = await fetchProfileRowSafely(
    supabase,
    user.id
  );

  if (error) {
    console.error("getSessionProfile:", error);
  }

  return {
    user: { id: user.id, email: user.email },
    profile: profileRow
      ? enrichProfileFromAuth(profileRow, user)
      : null,
  };
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const { profile } = await getSessionProfile();
  return profile?.role === "admin";
}
