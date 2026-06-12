import type { LocationNode } from "@/types/location";
import type { MapFocusTarget } from "@/types/listing-geo";

export function normalizeLocationNodes(
  items: Array<{
    id: string | number;
    name: string;
    latitude?: number | null;
    longitude?: number | null;
  }>
): LocationNode[] {
  return items.map((item) => ({
    id: String(item.id),
    name: item.name,
    latitude:
      typeof item.latitude === "number" && Number.isFinite(item.latitude)
        ? item.latitude
        : null,
    longitude:
      typeof item.longitude === "number" && Number.isFinite(item.longitude)
        ? item.longitude
        : null,
  }));
}

export interface LocationCoordinateFallback {
  latitude: number | null;
  longitude: number | null;
}

export function locationNodeToMapFocus(
  node: Pick<LocationNode, "name" | "latitude" | "longitude">,
  zoom: number,
  fallbackCenter?: LocationCoordinateFallback | null
): MapFocusTarget | null {
  const latitude =
    typeof node.latitude === "number" && Number.isFinite(node.latitude)
      ? node.latitude
      : fallbackCenter?.latitude;
  const longitude =
    typeof node.longitude === "number" && Number.isFinite(node.longitude)
      ? node.longitude
      : fallbackCenter?.longitude;

  if (
    latitude == null ||
    longitude == null ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
    zoom,
    label: node.name,
  };
}

export function getLocationNodeCoordinateFallback(
  cityId: string,
  cities: LocationNode[]
): LocationCoordinateFallback | null {
  const city = cities.find((item) => item.id === cityId);

  if (!city) {
    return null;
  }

  return {
    latitude: city.latitude ?? null,
    longitude: city.longitude ?? null,
  };
}
