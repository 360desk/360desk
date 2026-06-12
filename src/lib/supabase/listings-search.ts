import type { SupabaseClient } from "@supabase/supabase-js";
import { parseLocationIdParam } from "@/lib/location-params";
import type { ClassifiedAd, ListingTier } from "@/types/database";
import type {
  ListingsSearchFilters,
  ListingsSearchResponse,
} from "@/types/listings-search";

const LISTING_TIERS: ListingTier[] = ["luxury", "premium", "standard"];

const TIER_RANK: Record<ListingTier, number> = {
  luxury: 0,
  premium: 1,
  standard: 2,
};

const PUBLIC_LISTING_SELECT = `
  id,
  custom_listing_id,
  title,
  description,
  price,
  category,
  category_main,
  category_type,
  category_group,
  category_sub,
  location,
  city_id,
  district_id,
  neighborhood_id,
  images,
  room_count,
  sq_meters_gross,
  sq_meters_net,
  status,
  is_archived,
  visibility_mode,
  is_luxury_listing,
  listing_tier,
  property_segment,
  premium_highlight,
  virtual_tour_url,
  dynamic_properties,
  created_at,
  updated_at
`;

export function escapeIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

function parsePositiveInt(value: string | null): number | null {
  if (!value?.trim()) {
    return null;
  }

  const parsed = Number.parseInt(value.trim(), 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function parseListingTier(value: string | null): ListingTier | null {
  if (!value?.trim()) {
    return null;
  }

  const normalized = value.trim().toLowerCase() as ListingTier;
  return LISTING_TIERS.includes(normalized) ? normalized : null;
}

export function parseListingsSearchParams(
  searchParams: URLSearchParams
): ListingsSearchFilters {
  const search = searchParams.get("search")?.trim() || null;
  const cityId = parseLocationIdParam(searchParams.get("city_id"));
  const districtId = parseLocationIdParam(searchParams.get("district_id"));
  const neighborhoodId = parseLocationIdParam(
    searchParams.get("neighborhood_id")
  );
  const listingTier = parseListingTier(searchParams.get("listing_tier"));
  const propertySegment =
    searchParams.get("property_segment")?.trim() || null;

  let minPrice = parsePositiveInt(searchParams.get("min_price"));
  let maxPrice = parsePositiveInt(searchParams.get("max_price"));

  if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }

  return {
    search,
    city_id: cityId,
    district_id: districtId,
    neighborhood_id: neighborhoodId,
    listing_tier: listingTier,
    property_segment: propertySegment,
    min_price: minPrice,
    max_price: maxPrice,
  };
}

function normalizeListingRow(row: Record<string, unknown>): ClassifiedAd {
  return {
    ...(row as unknown as ClassifiedAd),
    is_luxury_listing: Boolean(row.is_luxury_listing ?? false),
    listing_tier:
      (row.listing_tier as ClassifiedAd["listing_tier"]) ?? "standard",
    property_segment: (row.property_segment as string | null) ?? null,
    premium_highlight: (row.premium_highlight as string | null) ?? null,
    virtual_tour_url: (row.virtual_tour_url as string | null) ?? null,
  };
}

function sortByTierThenDate(listings: ClassifiedAd[]): ClassifiedAd[] {
  return [...listings].sort((a, b) => {
    const tierA = TIER_RANK[a.listing_tier ?? "standard"];
    const tierB = TIER_RANK[b.listing_tier ?? "standard"];

    if (tierA !== tierB) {
      return tierA - tierB;
    }

    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });
}

export async function searchPublicListings(
  supabase: SupabaseClient,
  filters: ListingsSearchFilters,
  options?: { limit?: number; offset?: number }
): Promise<{ data: ListingsSearchResponse | null; error: string | null }> {
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
  const offset = Math.max(options?.offset ?? 0, 0);

  let query = supabase
    .from("classified_ads")
    .select(PUBLIC_LISTING_SELECT, { count: "exact" })
    .eq("status", "approved")
    .eq("is_archived", false)
    .eq("visibility_mode", "public");

  if (filters.search) {
    const term = escapeIlikePattern(filters.search);
    query = query.or(
      `title.ilike.%${term}%,description.ilike.%${term}%`
    );
  }

  if (filters.city_id) {
    query = query.eq("city_id", filters.city_id);
  }

  if (filters.district_id) {
    query = query.eq("district_id", filters.district_id);
  }

  if (filters.neighborhood_id) {
    query = query.eq("neighborhood_id", filters.neighborhood_id);
  }

  if (filters.listing_tier) {
    query = query.eq("listing_tier", filters.listing_tier);
  }

  if (filters.property_segment) {
    query = query.eq("property_segment", filters.property_segment);
  }

  if (filters.min_price != null) {
    query = query.gte("price", filters.min_price);
  }

  if (filters.max_price != null) {
    query = query.lte("price", filters.max_price);
  }

  query = query
    .order("listing_tier", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  const results = sortByTierThenDate(
    ((data ?? []) as Record<string, unknown>[]).map(normalizeListingRow)
  );

  return {
    data: {
      results,
      total_count: count ?? results.length,
      filters,
    },
    error: null,
  };
}
