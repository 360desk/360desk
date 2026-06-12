import type { ClassifiedAd, ListingTier } from "@/types/database";

export interface ListingsSearchFilters {
  search: string | null;
  city_id: string | null;
  district_id: string | null;
  neighborhood_id: string | null;
  listing_tier: ListingTier | null;
  property_segment: string | null;
  min_price: number | null;
  max_price: number | null;
}

export interface ListingsSearchResponse {
  results: ClassifiedAd[];
  total_count: number;
  filters: ListingsSearchFilters;
}
