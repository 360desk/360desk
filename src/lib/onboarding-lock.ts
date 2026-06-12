import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeOfficeUserRole } from "@/lib/office-hierarchy";
import {
  TEAM_INVITATIONS_TABLE,
  type TeamInvitationRecord,
} from "@/lib/supabase/team-invitations-table";
import type { Profile } from "@/types/database";

const INVITED_HIERARCHY_ROLES = new Set(["office_agent", "broker_owner"]);

export const REVOKED_INVITE_ERROR =
  "Bu davet bağlantısı iptal edilmiş veya geçersiz kılınmıştır.";

export const ONBOARDING_LOCK_REDIRECT = "/panelim?onboarding=locked";

export const ONBOARDING_ALLOWED_PATH_PREFIXES = [
  "/panelim",
  "/api/profile/accept-contract",
  "/api/team/onboarding-lock",
  "/api/team/accept-invite",
  "/api/team/reject-invite",
  "/api/team/invitations",
  "/giris",
  "/auth/signup",
  "/kayit",
] as const;

export function isOnboardingAllowedPath(pathname: string): boolean {
  if (pathname === "/panelim") {
    return true;
  }

  return ONBOARDING_ALLOWED_PATH_PREFIXES.some(
    (prefix) => prefix !== "/panelim" && pathname.startsWith(prefix)
  );
}

export function isProtectedPanelPath(pathname: string): boolean {
  if (pathname.startsWith("/panel/")) {
    return true;
  }

  if (pathname.startsWith("/panelim/")) {
    return true;
  }

  return pathname === "/profil";
}

export function profileHasInvitedHierarchyRole(
  profile: Pick<Profile, "user_role"> | null | undefined
): boolean {
  if (!profile?.user_role) {
    return false;
  }

  const role = normalizeOfficeUserRole(profile.user_role);
  return Boolean(role && INVITED_HIERARCHY_ROLES.has(role));
}

export async function findAcceptedInvitationForEmail(
  supabase: SupabaseClient,
  email: string
): Promise<TeamInvitationRecord | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from(TEAM_INVITATIONS_TABLE)
    .select(
      "id, broker_id, invitee_email, invitee_phone, status, invite_type, target_role, created_at"
    )
    .eq("invitee_email", normalizedEmail)
    .eq("status", "accepted")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as TeamInvitationRecord | null) ?? null;
}

export async function resolveOnboardingLockState(
  supabase: SupabaseClient,
  profile: Pick<
    Profile,
    "contract_accepted" | "user_role" | "email"
  > | null,
  email: string
): Promise<{ locked: boolean; reason: "contract" | "invite" | null }> {
  if (!profile || profile.contract_accepted) {
    return { locked: false, reason: null };
  }

  if (profileHasInvitedHierarchyRole(profile)) {
    return { locked: true, reason: "contract" };
  }

  const acceptedInvite = await findAcceptedInvitationForEmail(supabase, email);
  if (acceptedInvite) {
    return { locked: true, reason: "invite" };
  }

  return { locked: false, reason: null };
}

export function requiresOnboardingContract(
  profile: Profile | null | undefined,
  hasAcceptedInvite = false
): boolean {
  if (!profile || profile.contract_accepted) {
    return false;
  }

  if (hasAcceptedInvite) {
    return true;
  }

  return profileHasInvitedHierarchyRole(profile);
}
