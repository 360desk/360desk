import type { ClassifiedAd } from "@/types/database";
import type { MapFocusTarget } from "@/types/listing-geo";

export const LOCATION_PLACEHOLDER_VALUE = "";

export interface ListingLocationIds {
  city_id: string;
  district_id: string;
  neighborhood_id: string;
}

export interface ListingLocationSelection extends ListingLocationIds {
  city_name: string;
  district_name: string;
  neighborhood_name: string;
  map_focus?: MapFocusTarget | null;
}

export function createEmptyListingLocation(): ListingLocationIds {
  return {
    city_id: LOCATION_PLACEHOLDER_VALUE,
    district_id: LOCATION_PLACEHOLDER_VALUE,
    neighborhood_id: LOCATION_PLACEHOLDER_VALUE,
  };
}

export function createListingLocationFromAd(
  ad?: ClassifiedAd | null
): ListingLocationIds {
  if (!ad) {
    return createEmptyListingLocation();
  }

  return {
    city_id: ad.city_id != null ? String(ad.city_id) : LOCATION_PLACEHOLDER_VALUE,
    district_id:
      ad.district_id != null ? String(ad.district_id) : LOCATION_PLACEHOLDER_VALUE,
    neighborhood_id:
      ad.neighborhood_id != null
        ? String(ad.neighborhood_id)
        : LOCATION_PLACEHOLDER_VALUE,
  };
}

export function isListingLocationComplete(
  location: ListingLocationIds
): boolean {
  return Boolean(
    location.city_id && location.district_id && location.neighborhood_id
  );
}

export function validateListingLocation(
  location: ListingLocationIds
): string | null {
  if (!location.city_id) {
    return "Lütfen il seçiniz.";
  }

  if (!location.district_id) {
    return "Lütfen ilçe seçiniz.";
  }

  if (!location.neighborhood_id) {
    return "Lütfen mahalle seçiniz.";
  }

  return null;
}
