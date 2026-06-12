import type { User } from "@supabase/supabase-js";
import type { Profile, UserRole } from "@/types/database";

export const PRIMARY_ADMIN_EMAIL = "tolgaborasahin@gmail.com";

function normalizeEmail(email: string | null | undefined): string {
  return email?.trim().toLowerCase() ?? "";
}

export function isPrimaryAdminEmail(email: string | null | undefined): boolean {
  return normalizeEmail(email) === PRIMARY_ADMIN_EMAIL;
}

export function resolveIsAdmin(
  profile: Profile | null,
  user: User | null
): boolean {
  if (!user) {
    return false;
  }

  // Layer 2 — hardcoded primary administrator safeguard
  if (isPrimaryAdminEmail(user.email)) {
    return true;
  }

  // Layer 1 — database profile role
  if (profile?.role === "admin") {
    return true;
  }

  // Layer 1 — auth metadata fallbacks
  const metadataRole =
    user.user_metadata?.role ?? user.app_metadata?.role ?? null;

  return metadataRole === "admin";
}

export function resolveUserRole(
  profile: Profile | null,
  user: User | null
): UserRole {
  if (!user) {
    return "guest";
  }

  if (resolveIsAdmin(profile, user)) {
    return "admin";
  }

  if (profile?.role === "vendor") {
    return "vendor";
  }

  return "vendor";
}
