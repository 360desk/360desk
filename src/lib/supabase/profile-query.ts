import type { SupabaseClient, User } from "@supabase/supabase-js";
import { normalizeProfessionalLevel } from "@/lib/professional-level";
import { normalizeSubscriptionTier } from "@/lib/subscription-packages";
import type { Profile } from "@/types/database";

/** Verified columns on the corporate profiles table. */
export const CORE_PROFILE_SELECT =
  "id, email, full_name, role, user_type, ttbs_no, company_name, parent_office_id, account_origin, is_profile_completed, created_at, updated_at";

export const SUBSCRIPTION_PROFILE_SELECT = `${CORE_PROFILE_SELECT}, account_type, professional_level, avatar_url, logo_url, subscription_tier, max_listing_limit, max_image_per_listing, contract_accepted`;

export const SESSION_PROFILE_SELECT = `${SUBSCRIPTION_PROFILE_SELECT}, contract_accepted_at, company_leader_id, user_role`;

export const PROFILE_SELECT_COLUMNS = SESSION_PROFILE_SELECT;

const PROFILE_SELECT_FALLBACKS = [
  SESSION_PROFILE_SELECT,
  `${SUBSCRIPTION_PROFILE_SELECT}, company_leader_id, user_role`,
  SUBSCRIPTION_PROFILE_SELECT,
  `${CORE_PROFILE_SELECT}, account_type, professional_level, avatar_url, logo_url`,
  CORE_PROFILE_SELECT,
] as const;

export function isMissingProfileColumnError(message: string): boolean {
  return (
    message.includes("does not exist") || message.toLowerCase().includes("42703")
  );
}

function readMetadataString(
  metadata: Record<string, unknown> | undefined,
  key: string
): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function fetchProfileRowSafely(
  supabase: SupabaseClient,
  userId: string
): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
  let lastError: string | null = null;

  for (const select of PROFILE_SELECT_FALLBACKS) {
    const { data, error } = await supabase
      .from("profiles")
      .select(select)
      .eq("id", userId)
      .maybeSingle();

    if (!error) {
      return {
        data: (data as Record<string, unknown> | null) ?? null,
        error: null,
      };
    }

    lastError = error.message;

    if (!isMissingProfileColumnError(error.message)) {
      break;
    }
  }

  return { data: null, error: lastError };
}

/** Maps a DB row to Profile; optional auth metadata fills legacy-only fields. */
export function enrichProfileFromAuth(
  row: Record<string, unknown>,
  user?: User | null
): Profile {
  const metadata = user?.user_metadata;
  const metadataUserType = metadata?.user_type;
  const userType =
    (row.user_type as Profile["organization_role"]) ??
    (typeof metadataUserType === "string"
      ? (metadataUserType as Profile["organization_role"])
      : "individual");
  const role = (row.role as Profile["role"]) ?? "vendor";

  return {
    id: row.id as string,
    email: row.email as string,
    full_name: (row.full_name as string | null) ?? null,
    role,
    organization_role: userType,
    parent_office_id: (row.parent_office_id as string | null) ?? null,
    account_origin:
      (row.account_origin as Profile["account_origin"]) ?? "self",
    is_suspended: false,
    is_admin: role === "admin",
    is_profile_completed: Boolean(row.is_profile_completed ?? false),
    created_at: (row.created_at as string) ?? new Date().toISOString(),
    updated_at: (row.updated_at as string) ?? new Date().toISOString(),
    phone: readMetadataString(metadata, "phone"),
    ttbs_no:
      (row.ttbs_no as string | null) ?? readMetadataString(metadata, "ttbs_no"),
    is_independent_office:
      userType === "office_admin" ||
      Boolean(metadata?.is_independent_office),
    company_name:
      (row.company_name as string | null) ??
      readMetadataString(metadata, "company_name"),
    company_ttbs_no:
      userType === "office_admin"
        ? ((row.ttbs_no as string | null) ??
          readMetadataString(metadata, "company_ttbs_no"))
        : readMetadataString(metadata, "company_ttbs_no"),
    account_type: (row.account_type as Profile["account_type"]) ?? null,
    professional_level:
      normalizeProfessionalLevel(row.professional_level) || null,
    avatar_url: (row.avatar_url as string | null) ?? null,
    logo_url: (row.logo_url as string | null) ?? null,
    subscription_tier: normalizeSubscriptionTier(
      row.subscription_tier as string | null | undefined
    ),
    max_listing_limit:
      typeof row.max_listing_limit === "number"
        ? row.max_listing_limit
        : null,
    max_image_per_listing:
      typeof row.max_image_per_listing === "number"
        ? row.max_image_per_listing
        : null,
    contract_accepted: Boolean(row.contract_accepted ?? false),
    contract_accepted_at: (row.contract_accepted_at as string | null) ?? null,
    company_leader_id: (row.company_leader_id as string | null) ?? null,
    user_role: (row.user_role as string | null) ?? null,
  };
}
