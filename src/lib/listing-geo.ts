import { getCityCenterCoordinates } from "@/lib/turkey-locations/location-coordinates";
import { isLocationAllValue } from "@/lib/location-params";
import type { ListingGeoState, MapFocusTarget, ShareLocationPayload } from "@/types/listing-geo";
import type { ListingLocationIds } from "@/types/listing-location";

export const DEFAULT_MAP_CENTER = {
  latitude: 39.0,
  longitude: 35.0,
  zoom: 6,
};

export const TURKEY_BOUNDS = {
  south: 35.8,
  west: 25.9,
  north: 42.2,
  east: 44.8,
};

export const MAP_FOCUS_ZOOM = {
  city: 11,
} as const;

export function createEmptyListingGeo(): ListingGeoState {
  return {
    full_address: "",
    latitude: null,
    longitude: null,
  };
}

export function createListingGeoFromAd(ad?: {
  full_address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
} | null): ListingGeoState {
  if (!ad) {
    return createEmptyListingGeo();
  }

  return {
    full_address: ad.full_address?.trim() ?? "",
    latitude:
      typeof ad.latitude === "number" && Number.isFinite(ad.latitude)
        ? ad.latitude
        : null,
    longitude:
      typeof ad.longitude === "number" && Number.isFinite(ad.longitude)
        ? ad.longitude
        : null,
  };
}

function toMapFocusTarget(
  coordinates: { latitude: number; longitude: number } | null,
  zoom: number,
  label: string
): MapFocusTarget | null {
  if (!coordinates) {
    return null;
  }

  return {
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    zoom,
    label,
  };
}

export function resolveMapFocusTarget(
  locationIds: ListingLocationIds,
  names: {
    city_name: string;
  },
  explicitFocus?: MapFocusTarget | null
): MapFocusTarget | null {
  if (
    explicitFocus &&
    Number.isFinite(explicitFocus.latitude) &&
    Number.isFinite(explicitFocus.longitude)
  ) {
    return explicitFocus;
  }

  if (!isLocationAllValue(locationIds.city_id) && names.city_name) {
    return toMapFocusTarget(
      getCityCenterCoordinates(locationIds.city_id),
      MAP_FOCUS_ZOOM.city,
      names.city_name
    );
  }

  return null;
}

export function hasShareableCoordinates(
  payload: Pick<ShareLocationPayload, "latitude" | "longitude">
): boolean {
  return (
    payload.latitude != null &&
    payload.longitude != null &&
    Number.isFinite(payload.latitude) &&
    Number.isFinite(payload.longitude)
  );
}

export function resolveShareAddress(payload: ShareLocationPayload): string {
  return (
    payload.full_address?.trim() ||
    payload.location?.trim() ||
    "Adres bilgisi henüz eklenmemiş"
  );
}

export function buildGoogleMapsLink(latitude: number, longitude: number): string {
  return `https://maps.google.com/?q=${latitude},${longitude}`;
}

export function buildWhatsAppShareUrl(payload: ShareLocationPayload): string | null {
  if (!hasShareableCoordinates(payload)) {
    return null;
  }

  const mapsLink = buildGoogleMapsLink(payload.latitude!, payload.longitude!);
  const message = `*${payload.title}* mülkünün konumu ve kurumsal detay kartı: ${mapsLink}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function buildCrmClipboardText(payload: ShareLocationPayload): string {
  const address = resolveShareAddress(payload);
  const coordinateLine = hasShareableCoordinates(payload)
    ? `${payload.latitude}, ${payload.longitude}`
    : "Koordinat henüz işaretlenmedi";

  return [
    `İlan: ${payload.title}`,
    `Açık Adres: ${address}`,
    `Koordinat: ${coordinateLine}`,
    hasShareableCoordinates(payload)
      ? `Harita: ${buildGoogleMapsLink(payload.latitude!, payload.longitude!)}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function listingGeoToSharePayload(
  ad: ShareLocationPayload & { title: string }
): ShareLocationPayload {
  return {
    title: ad.title,
    full_address: ad.full_address ?? null,
    latitude: ad.latitude ?? null,
    longitude: ad.longitude ?? null,
    location: ad.location ?? null,
  };
}
