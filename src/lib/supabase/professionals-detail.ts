import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { getProfileImageUrl } from "@/lib/profile-identity";
import { normalizeProfessionalLevel } from "@/lib/professional-level";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { createClient } from "@/lib/supabase/server";
import type { ProfessionalProfileDetail } from "@/types/professionals-search";
import type { VisibilityMode } from "@/types/database";

const CORE_PROFILE_SELECT =
  "id, email, full_name, company_name, role, user_type, ttbs_no";

const EXTENDED_PROFILE_SELECT = `${CORE_PROFILE_SELECT}, avatar_url, logo_url, professional_level, account_type, city_id, district_id, neighborhood_id`;

interface RawProfileDetailRow {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  avatar_url?: string | null;
  logo_url?: string | null;
  professional_level?: string | null;
  account_type?: ProfessionalProfileDetail["account_type"];
  city_id?: number | string | null;
  district_id?: string | null;
  neighborhood_id?: string | null;
  ttbs_no: string | null;
  user_type?: string | null;
}

interface ListingCountRow {
  visibility_mode: VisibilityMode;
}

async function resolveDirectoryClient(): Promise<SupabaseClient> {
  try {
    return createAdminClient();
  } catch {
    return createClient();
  }
}

function isMissingColumnError(error: PostgrestError | null): boolean {
  if (!error) {
    return false;
  }

  return (
    error.code === "42703" ||
    error.message.toLowerCase().includes("does not exist")
  );
}

function inferAccountType(
  profile: RawProfileDetailRow
): ProfessionalProfileDetail["account_type"] {
  if (profile.account_type) {
    return profile.account_type;
  }

  if (profile.user_type === "office_admin") {
    return "ofis";
  }

  if (profile.user_type === "franchise_admin") {
    return "franchise";
  }

  return profile.user_type ? "bireysel" : null;
}

function resolveDisplayName(profile: RawProfileDetailRow): string {
  const accountType = inferAccountType(profile);

  if (accountType === "ofis" || accountType === "franchise") {
    return (
      profile.company_name?.trim() ||
      profile.full_name?.trim() ||
      profile.email
    );
  }

  return (
    profile.full_name?.trim() ||
    profile.company_name?.trim() ||
    profile.email
  );
}

async function resolveLocationNamesForProfile(
  supabase: SupabaseClient,
  profile: RawProfileDetailRow
) {
  const cityId = profile.city_id != null ? String(profile.city_id) : null;
  const districtId = profile.district_id ?? null;
  const neighborhoodId = profile.neighborhood_id ?? null;

  try {
    const [cityResult, districtResult, neighborhoodResult] = await Promise.all([
      cityId
        ? supabase.from("cities").select("name").eq("id", cityId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      districtId
        ? supabase
            .from("districts")
            .select("name")
            .eq("id", districtId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      neighborhoodId
        ? supabase
            .from("neighborhoods")
            .select("name")
            .eq("id", neighborhoodId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    return {
      city_name: (cityResult.data?.name as string | undefined) ?? null,
      district_name: (districtResult.data?.name as string | undefined) ?? null,
      neighborhood_name:
        (neighborhoodResult.data?.name as string | undefined) ?? null,
    };
  } catch {
    return {
      city_name: null,
      district_name: null,
      neighborhood_name: null,
    };
  }
}

function aggregateCounts(rows: ListingCountRow[]) {
  return rows.reduce(
    (acc, row) => {
      acc.total += 1;

      if (row.visibility_mode === "public") {
        acc.public += 1;
      } else {
        acc.system += 1;
      }

      return acc;
    },
    { total: 0, system: 0, public: 0 }
  );
}

async function fetchProfileRow(
  supabase: SupabaseClient,
  id: string
): Promise<{ row: RawProfileDetailRow | null; error: string | null }> {
  const extendedResult = await supabase
    .from("profiles")
    .select(EXTENDED_PROFILE_SELECT)
    .eq("id", id)
    .eq("role", "vendor")
    .eq("is_profile_completed", true)
    .eq("is_suspended", false)
    .maybeSingle();

  if (!extendedResult.error && extendedResult.data) {
    return {
      row: extendedResult.data as RawProfileDetailRow,
      error: null,
    };
  }

  if (extendedResult.error && !isMissingColumnError(extendedResult.error)) {
    return { row: null, error: extendedResult.error.message };
  }

  const coreResult = await supabase
    .from("profiles")
    .select(CORE_PROFILE_SELECT)
    .eq("id", id)
    .eq("role", "vendor")
    .maybeSingle();

  if (coreResult.error) {
    return { row: null, error: coreResult.error.message };
  }

  return {
    row: (coreResult.data as RawProfileDetailRow | null) ?? null,
    error: null,
  };
}

export async function fetchProfessionalById(
  id: string
): Promise<{ data: ProfessionalProfileDetail | null; error: string | null }> {
  const supabase = await resolveDirectoryClient();
  const { row, error } = await fetchProfileRow(supabase, id);

  if (error) {
    return { data: null, error };
  }

  if (!row) {
    return { data: null, error: null };
  }

  const { data: listingRows } = await supabase
    .from("classified_ads")
    .select("visibility_mode")
    .eq("vendor_id", id)
    .eq("is_archived", false);

  const counts = aggregateCounts((listingRows ?? []) as ListingCountRow[]);
  const locationNames = await resolveLocationNamesForProfile(supabase, row);
  const accountType = inferAccountType(row);

  return {
    data: {
      id: row.id,
      display_name: resolveDisplayName(row),
      full_name: row.full_name,
      company_name: row.company_name,
      email: row.email,
      phone: null,
      ttbs_no: row.ttbs_no,
      avatar_url: getProfileImageUrl(row),
      professional_level:
        normalizeProfessionalLevel(row.professional_level) || null,
      account_type: accountType,
      city_name: locationNames.city_name,
      district_name: locationNames.district_name,
      neighborhood_name: locationNames.neighborhood_name,
      total_listings: counts.total,
      system_listings: counts.system,
      public_listings: counts.public,
    },
    error: null,
  };
}
