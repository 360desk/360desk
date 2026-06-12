export interface LocationNode {
  id: string;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
}

export type LocationTreeLevel = "cities" | "districts" | "neighborhoods";

export interface LocationTreeResponse {
  level: LocationTreeLevel;
  items: LocationNode[];
}

export const LOCATION_ALL_VALUE = "all";
