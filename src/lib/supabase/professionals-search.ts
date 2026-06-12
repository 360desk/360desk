import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { createClient } from "@/lib/supabase/server";
import { getProfileImageUrl } from "@/lib/profile-identity";
import { normalizeProfessionalLevel } from "@/lib/professional-level";
import { parseLocationIdParam } from "@/lib/location-params";
import type { ClassifiedAd, VisibilityMode } from "@/types/database";
import {
  PROFESSIONAL_ACCOUNT_TYPES,
  type ProfessionalAccountType,
  type ProfessionalDirectoryEntry,
  type ProfessionalsSearchFilters,
  type ProfessionalsSearchResponse,
} from "@/types/professionals-search";

const CORE_PROFILE_SELECT =
  "id, email, full_name, company_name, role, user_type, ttbs_no";

const EXTENDED_PROFILE_SELECT = `${CORE_PROFILE_SELECT}, professional_level, account_type, city_id, district_id, neighborhood_id, avatar_url, logo_url`;

interface RawProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  avatar_url?: string | null;
  logo_url?: string | null;
  professional_level?: string | null;
  account_type?: ProfessionalAccountType | null;
  city_id?: number | string | null;
  district_id?: string | null;
  neighborhood_id?: string | null;
  user_type?: string | null;
}

interface ListingCountRow {
  vendor_id: string;
  visibility_mode: VisibilityMode;
}

interface ListingCountBucket {
  total: number;
  system: number;
  public: number;
}

function parseAccountTypeParam(
  value: string | null
): ProfessionalAccountType | null {
  if (!value?.trim()) {
    return null;
  }

  const normalized = value.trim().toLowerCase() as ProfessionalAccountType;
  return PROFESSIONAL_ACCOUNT_TYPES.includes(normalized) ? normalized : null;
}

export function parseProfessionalsSearchParams(
  searchParams: URLSearchParams
): ProfessionalsSearchFilters {
  return {
    account_type: parseAccountTypeParam(searchParams.get("account_type")),
    city_id: parseLocationIdParam(searchParams.get("city_id")),
    district_id: parseLocationIdParam(searchParams.get("district_id")),
    neighborhood_id: parseLocationIdParam(searchParams.get("neighborhood_id")),
  };
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

function resolveDisplayName(profile: RawProfileRow): string {
  const accountType = profile.account_type ?? inferAccountType(profile);

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

function inferAccountType(
  profile: RawProfileRow
): ProfessionalAccountType | null {
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

function buildZeroListingCounts(
  profileIds: string[]
): Record<string, ListingCountBucket> {
  return Object.fromEntries(
    profileIds.map((id) => [id, { total: 0, system: 0, public: 0 }])
  );
}

function applyListingRows(
  counts: Record<string, ListingCountBucket>,
  rows: ListingCountRow[]
) {
  for (const row of rows) {
    const bucket = counts[row.vendor_id] ?? {
      total: 0,
      system: 0,
      public: 0,
    };

    bucket.total += 1;

    if (row.visibility_mode === "public") {
      bucket.public += 1;
    } else {
      bucket.system += 1;
    }

    counts[row.vendor_id] = bucket;
  }
}

async function fetchListingCountsByVendorIds(
  supabase: SupabaseClient,
  profileIds: string[]
): Promise<Record<string, ListingCountBucket>> {
  const counts = buildZeroListingCounts(profileIds);

  if (profileIds.length === 0) {
    return counts;
  }

  const { data, error } = await supabase
    .from("classified_ads")
    .select("vendor_id, visibility_mode")
    .in("vendor_id", profileIds)
    .eq("is_archived", false);

  if (error) {
    console.error("professionals-search listing counts:", error.message);
    return counts;
  }

  applyListingRows(counts, (data ?? []) as ListingCountRow[]);
  return counts;
}

async function fetchLocationMaps(
  supabase: SupabaseClient,
  profiles: RawProfileRow[]
) {
  const emptyMaps = {
    cityMap: new Map<string, string>(),
    districtMap: new Map<string, string>(),
    neighborhoodMap: new Map<string, string>(),
  };

  const cityIds = [
    ...new Set(
      profiles
        .map((profile) => profile.city_id)
        .filter((id): id is number | string => id != null)
        .map(String)
    ),
  ];
  const districtIds = [
    ...new Set(
      profiles
        .map((profile) => profile.district_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const neighborhoodIds = [
    ...new Set(
      profiles
        .map((profile) => profile.neighborhood_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  if (cityIds.length === 0 && districtIds.length === 0 && neighborhoodIds.length === 0) {
    return emptyMaps;
  }

  try {
    const [citiesResult, districtsResult, neighborhoodsResult] =
      await Promise.all([
        cityIds.length
          ? supabase.from("cities").select("id, name").in("id", cityIds)
          : Promise.resolve({ data: [], error: null }),
        districtIds.length
          ? supabase.from("districts").select("id, name").in("id", districtIds)
          : Promise.resolve({ data: [], error: null }),
        neighborhoodIds.length
          ? supabase
              .from("neighborhoods")
              .select("id, name")
              .in("id", neighborhoodIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

    if (citiesResult.error) {
      console.error(
        "professionals-search cities:",
        citiesResult.error.message
      );
    }

    if (districtsResult.error) {
      console.error(
        "professionals-search districts:",
        districtsResult.error.message
      );
    }

    if (neighborhoodsResult.error) {
      console.error(
        "professionals-search neighborhoods:",
        neighborhoodsResult.error.message
      );
    }

    return {
      cityMap: new Map(
        (citiesResult.data ?? []).map((row) => [
          String(row.id),
          row.name as string,
        ])
      ),
      districtMap: new Map(
        (districtsResult.data ?? []).map((row) => [
          row.id as string,
          row.name as string,
        ])
      ),
      neighborhoodMap: new Map(
        (neighborhoodsResult.data ?? []).map((row) => [
          row.id as string,
          row.name as string,
        ])
      ),
    };
  } catch (error) {
    console.error(
      "professionals-search location maps:",
      error instanceof Error ? error.message : "unknown error"
    );
    return emptyMaps;
  }
}

function mapProfileToEntry(
  profile: RawProfileRow,
  counts: Record<string, ListingCountBucket>,
  locationMaps: Awaited<ReturnType<typeof fetchLocationMaps>>
): ProfessionalDirectoryEntry {
  const listingCounts = counts[profile.id] ?? {
    total: 0,
    system: 0,
    public: 0,
  };

  const cityId = profile.city_id != null ? String(profile.city_id) : null;
  const districtId = profile.district_id ?? null;
  const neighborhoodId = profile.neighborhood_id ?? null;
  const accountType = profile.account_type ?? inferAccountType(profile);

  return {
    id: profile.id,
    display_name: resolveDisplayName(profile),
    full_name: profile.full_name,
    company_name: profile.company_name,
    email: profile.email,
    avatar_url: getProfileImageUrl(profile),
    professional_level:
      normalizeProfessionalLevel(profile.professional_level) || null,
    account_type: accountType,
    city_id: cityId,
    district_id: districtId,
    neighborhood_id: neighborhoodId,
    city_name: cityId ? (locationMaps.cityMap.get(cityId) ?? null) : null,
    district_name: districtId
      ? (locationMaps.districtMap.get(districtId) ?? null)
      : null,
    neighborhood_name: neighborhoodId
      ? (locationMaps.neighborhoodMap.get(neighborhoodId) ?? null)
      : null,
    total_listings: listingCounts.total,
    system_listings: listingCounts.system,
    public_listings: listingCounts.public,
  };
}

async function fetchDirectoryProfiles(
  supabase: SupabaseClient,
  filters: ProfessionalsSearchFilters,
  pagination: { limit: number; offset: number }
): Promise<{
  rows: RawProfileRow[];
  totalCount: number;
  error: string | null;
}> {
  let extendedQuery = supabase
    .from("profiles")
    .select(EXTENDED_PROFILE_SELECT, { count: "exact" })
    .eq("role", "vendor")
    .eq("is_profile_completed", true)
    .eq("is_suspended", false)
    .order("full_name", { ascending: true });

  if (filters.account_type) {
    extendedQuery = extendedQuery.eq("account_type", filters.account_type);
  }

  if (filters.city_id) {
    extendedQuery = extendedQuery.eq("city_id", filters.city_id);
  }

  if (filters.district_id) {
    extendedQuery = extendedQuery.eq("district_id", filters.district_id);
  }

  if (filters.neighborhood_id) {
    extendedQuery = extendedQuery.eq(
      "neighborhood_id",
      filters.neighborhood_id
    );
  }

  const extendedResult = await extendedQuery.range(
    pagination.offset,
    pagination.offset + pagination.limit - 1
  );

  if (!extendedResult.error) {
    return {
      rows: (extendedResult.data ?? []) as RawProfileRow[],
      totalCount: extendedResult.count ?? extendedResult.data?.length ?? 0,
      error: null,
    };
  }

  if (!isMissingColumnError(extendedResult.error)) {
    return {
      rows: [],
      totalCount: 0,
      error: extendedResult.error.message,
    };
  }

  console.warn(
    "professionals-search: falling back to core profile schema",
    extendedResult.error.message
  );

  const coreResult = await supabase
    .from("profiles")
    .select(CORE_PROFILE_SELECT, { count: "exact" })
    .eq("role", "vendor")
    .order("full_name", { ascending: true })
    .range(pagination.offset, pagination.offset + pagination.limit - 1);

  if (coreResult.error) {
    return {
      rows: [],
      totalCount: 0,
      error: coreResult.error.message,
    };
  }

  return {
    rows: (coreResult.data ?? []) as RawProfileRow[],
    totalCount: coreResult.count ?? coreResult.data?.length ?? 0,
    error: null,
  };
}

export async function searchProfessionals(
  filters: ProfessionalsSearchFilters,
  pagination: { limit: number; offset: number }
): Promise<{ data: ProfessionalsSearchResponse | null; error: string | null }> {
  const supabase = await resolveDirectoryClient();

  const { rows, totalCount, error: profilesError } = await fetchDirectoryProfiles(
    supabase,
    filters,
    pagination
  );

  if (profilesError) {
    return { data: null, error: profilesError };
  }

  if (rows.length === 0) {
    return {
      data: {
        results: [],
        total_count: totalCount,
        filters,
      },
      error: null,
    };
  }

  const profileIds = rows.map((profile) => profile.id);

  const [counts, locationMaps] = await Promise.all([
    fetchListingCountsByVendorIds(supabase, profileIds),
    fetchLocationMaps(supabase, rows),
  ]);

  const results = rows.map((profile) =>
    mapProfileToEntry(profile, counts, locationMaps)
  );

  return {
    data: {
      results,
      total_count: totalCount,
      filters,
    },
    error: null,
  };
}

export async function fetchProfessionalPublicListings(
  professionalId: string
): Promise<{ data: ClassifiedAd[]; error: string | null }> {
  const supabase = await resolveDirectoryClient();

  const { data, error } = await supabase
    .from("classified_ads")
    .select(
      "id, title, price, images, location, listing_tier, visibility_mode, status, created_at"
    )
    .eq("vendor_id", professionalId)
    .eq("visibility_mode", "public")
    .eq("status", "approved")
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: (data ?? []) as ClassifiedAd[], error: null };
}
