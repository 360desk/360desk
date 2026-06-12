import cityCoordinates from "@/data/turkey-locations/city-coordinates.compact.json";

interface CityCoordinateRow {
  id: number;
  lat: number;
  lng: number;
}

const CITY_COORDINATE_MAP = new Map(
  (cityCoordinates as CityCoordinateRow[]).map((city) => [
    String(city.id),
    { lat: city.lat, lng: city.lng },
  ])
);

export function getCityCoordinates(
  cityId: string | null | undefined
): { lat: number; lng: number } | null {
  if (!cityId) {
    return null;
  }

  return CITY_COORDINATE_MAP.get(String(cityId)) ?? null;
}

function hashSeed(value: string): number {
  let hash = 0;

  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) % 1000;
  }

  return hash;
}

export function applyCoordinateOffset(
  base: { lat: number; lng: number },
  seed: string,
  scale: number
): { lat: number; lng: number } {
  const hash = hashSeed(seed);
  const latOffset = ((hash % 100) - 50) * scale;
  const lngOffset = ((Math.floor(hash / 100) % 100) - 50) * scale;

  return {
    lat: base.lat + latOffset,
    lng: base.lng + lngOffset,
  };
}
