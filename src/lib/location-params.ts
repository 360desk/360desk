import { LOCATION_ALL_VALUE } from "@/types/location";

export function parseLocationIdParam(value: string | null): string | null {
  if (!value?.trim()) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (
    normalized === LOCATION_ALL_VALUE ||
    normalized === "null" ||
    normalized === "undefined"
  ) {
    return null;
  }

  return value.trim();
}

export function isLocationAllValue(value: string | null | undefined): boolean {
  if (!value?.trim()) {
    return true;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === LOCATION_ALL_VALUE || normalized === "null";
}
