import { isLocationAllValue } from "@/lib/location-params";
import type { ListingTier } from "@/types/database";
import { LOCATION_ALL_VALUE } from "@/types/location";

export const SEGMENT_OPTIONS = ["1+1 Loft", "1+1 Standart"] as const;

export type SegmentOption = (typeof SEGMENT_OPTIONS)[number];

export interface CatalogFilterState {
  search: string;
  cityId: string;
  districtId: string;
  neighborhoodId: string;
  propertySegment: SegmentOption | null;
  luxuryTier: boolean;
  premiumTier: boolean;
  minPrice: string;
  maxPrice: string;
}

export const DEFAULT_CATALOG_FILTERS: CatalogFilterState = {
  search: "",
  cityId: LOCATION_ALL_VALUE,
  districtId: LOCATION_ALL_VALUE,
  neighborhoodId: LOCATION_ALL_VALUE,
  propertySegment: null,
  luxuryTier: false,
  premiumTier: false,
  minPrice: "",
  maxPrice: "",
};

function parseLocationFilterParam(
  params: URLSearchParams,
  key: "city_id" | "district_id" | "neighborhood_id"
): string {
  const value = params.get(key)?.trim();
  return value && !isLocationAllValue(value) ? value : LOCATION_ALL_VALUE;
}

export function parseCatalogFiltersFromParams(
  params: URLSearchParams
): CatalogFilterState {
  const segment = params.get("segment")?.trim() || null;
  const propertySegment = SEGMENT_OPTIONS.includes(segment as SegmentOption)
    ? (segment as SegmentOption)
    : null;

  return {
    search: params.get("search")?.trim() ?? "",
    cityId: parseLocationFilterParam(params, "city_id"),
    districtId: parseLocationFilterParam(params, "district_id"),
    neighborhoodId: parseLocationFilterParam(params, "neighborhood_id"),
    propertySegment,
    luxuryTier: params.get("luxury") === "1",
    premiumTier: params.get("premium") === "1",
    minPrice: params.get("min_price")?.trim() ?? "",
    maxPrice: params.get("max_price")?.trim() ?? "",
  };
}

function appendLocationParam(
  params: URLSearchParams,
  key: "city_id" | "district_id" | "neighborhood_id",
  value: string
) {
  if (!isLocationAllValue(value)) {
    params.set(key, value);
  }
}

export function catalogFiltersToSearchParams(
  filters: CatalogFilterState
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set("search", filters.search);
  }

  appendLocationParam(params, "city_id", filters.cityId);
  appendLocationParam(params, "district_id", filters.districtId);
  appendLocationParam(params, "neighborhood_id", filters.neighborhoodId);

  if (filters.propertySegment) {
    params.set("segment", filters.propertySegment);
  }

  if (filters.luxuryTier) {
    params.set("luxury", "1");
  }

  if (filters.premiumTier) {
    params.set("premium", "1");
  }

  if (filters.minPrice) {
    params.set("min_price", filters.minPrice);
  }

  if (filters.maxPrice) {
    params.set("max_price", filters.maxPrice);
  }

  return params;
}

export function catalogFiltersToApiQuery(
  filters: CatalogFilterState
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.search.trim()) {
    params.set("search", filters.search.trim());
  }

  appendLocationParam(params, "city_id", filters.cityId);
  appendLocationParam(params, "district_id", filters.districtId);
  appendLocationParam(params, "neighborhood_id", filters.neighborhoodId);

  if (filters.propertySegment) {
    params.set("property_segment", filters.propertySegment);
  }

  const tierParam = resolveApiListingTier(filters);
  if (tierParam) {
    params.set("listing_tier", tierParam);
  }

  if (filters.minPrice.trim()) {
    params.set("min_price", filters.minPrice.trim());
  }

  if (filters.maxPrice.trim()) {
    params.set("max_price", filters.maxPrice.trim());
  }

  params.set("limit", "60");

  return params;
}

function resolveApiListingTier(
  filters: CatalogFilterState
): ListingTier | null {
  if (filters.luxuryTier && !filters.premiumTier) {
    return "luxury";
  }

  if (filters.premiumTier && !filters.luxuryTier) {
    return "premium";
  }

  return null;
}

export function applyClientTierFilter<T extends { listing_tier?: ListingTier }>(
  listings: T[],
  filters: CatalogFilterState
): T[] {
  if (filters.luxuryTier && filters.premiumTier) {
    return listings.filter(
      (listing) =>
        listing.listing_tier === "luxury" || listing.listing_tier === "premium"
    );
  }

  return listings;
}
