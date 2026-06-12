import { isLocationAllValue } from "@/lib/location-params";

export interface ListingLocationColumnInput {
  city_id?: string | null;
  district_id?: string | null;
  neighborhood_id?: string | null;
  full_address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ListingLocationColumns {
  city_id: string | null;
  district_id: string | null;
  neighborhood_id: string | null;
  full_address: string | null;
  latitude: number | null;
  longitude: number | null;
}

export function normalizeLocationIdForDb(
  value: string | null | undefined
): string | null {
  if (!value || isLocationAllValue(value)) {
    return null;
  }

  return value.trim();
}

export function normalizeGeoCoordinate(
  value: number | null | undefined
): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function buildListingLocationColumns(
  input: ListingLocationColumnInput
): ListingLocationColumns {
  return {
    city_id: normalizeLocationIdForDb(input.city_id),
    district_id: normalizeLocationIdForDb(input.district_id),
    neighborhood_id: normalizeLocationIdForDb(input.neighborhood_id),
    full_address: input.full_address?.trim() || null,
    latitude: normalizeGeoCoordinate(input.latitude),
    longitude: normalizeGeoCoordinate(input.longitude),
  };
}

export function isMissingGeoColumnError(error: {
  message?: string;
  code?: string;
}): boolean {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    message.includes("full_address") ||
    message.includes("latitude") ||
    message.includes("longitude")
  );
}
