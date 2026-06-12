import districtsDataset from "@/data/turkey-locations/districts.compact.json";
import {
  applyCoordinateOffset,
  getCityCoordinates,
} from "@/lib/turkey-locations/city-coordinates";
import { deterministicLocationUuid } from "@/lib/turkey-locations/deterministic-id";

interface DistrictSeedRow {
  id: number;
  name: string;
  provinceId: number;
}

export interface LocationCoordinate {
  latitude: number;
  longitude: number;
}

const TURKISH_COLLATOR = new Intl.Collator("tr-TR", {
  sensitivity: "base",
  numeric: true,
});

const districtCoordinateByUuid = new Map<string, LocationCoordinate>();

function computeRadialOffset(
  center: { lat: number; lng: number },
  index: number,
  total: number,
  radius: number
): LocationCoordinate {
  if (total <= 1) {
    return { latitude: center.lat, longitude: center.lng };
  }

  const angle = (2 * Math.PI * index) / total;

  return {
    latitude: center.lat + radius * Math.sin(angle),
    longitude: center.lng + radius * Math.cos(angle) * 1.15,
  };
}

function buildDistrictCoordinateIndex(): void {
  const districtsByProvince = new Map<number, DistrictSeedRow[]>();

  for (const district of districtsDataset as DistrictSeedRow[]) {
    const bucket = districtsByProvince.get(district.provinceId) ?? [];
    bucket.push(district);
    districtsByProvince.set(district.provinceId, bucket);
  }

  for (const [provinceId, districts] of districtsByProvince) {
    const cityCenter = getCityCoordinates(String(provinceId));

    if (!cityCenter) {
      continue;
    }

    const sorted = [...districts].sort((a, b) =>
      TURKISH_COLLATOR.compare(a.name, b.name)
    );

    const count = sorted.length;
    const radius = Math.min(0.14, 0.03 + count * 0.0035);

    sorted.forEach((district, index) => {
      const offset = computeRadialOffset(cityCenter, index, count, radius);

      districtCoordinateByUuid.set(
        deterministicLocationUuid("district", district.id),
        offset
      );
    });
  }
}

buildDistrictCoordinateIndex();

export function getCityCenterCoordinates(
  cityId: string | null | undefined
): LocationCoordinate | null {
  const center = getCityCoordinates(cityId);

  if (!center) {
    return null;
  }

  return { latitude: center.lat, longitude: center.lng };
}

export function getDistrictCoordinates(
  districtUuid: string | null | undefined
): LocationCoordinate | null {
  if (!districtUuid) {
    return null;
  }

  return districtCoordinateByUuid.get(districtUuid) ?? null;
}

export function getNeighborhoodCoordinates(
  neighborhoodUuid: string | null | undefined,
  districtUuid: string | null | undefined
): LocationCoordinate | null {
  if (!neighborhoodUuid || !districtUuid) {
    return null;
  }

  const districtCenter = getDistrictCoordinates(districtUuid);

  if (!districtCenter) {
    return null;
  }

  const offset = applyCoordinateOffset(
    { lat: districtCenter.latitude, lng: districtCenter.longitude },
    neighborhoodUuid,
    0.004
  );

  return {
    latitude: offset.lat,
    longitude: offset.lng,
  };
}

export function enrichLocationNodeCoordinates(
  node: { id: string; name: string },
  level: "cities" | "districts" | "neighborhoods",
  parentIds?: { cityId?: string | null; districtId?: string | null }
): LocationCoordinate | null {
  if (level === "cities") {
    return getCityCenterCoordinates(node.id);
  }

  if (level === "districts") {
    return getDistrictCoordinates(node.id);
  }

  return getNeighborhoodCoordinates(node.id, parentIds?.districtId ?? null);
}
