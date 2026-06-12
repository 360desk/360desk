export interface ListingGeoState {
  full_address: string;
  latitude: number | null;
  longitude: number | null;
}

export interface MapFocusTarget {
  latitude: number;
  longitude: number;
  zoom: number;
  label: string;
}

export interface ShareLocationPayload {
  title: string;
  full_address: string | null;
  latitude: number | null;
  longitude: number | null;
  location?: string | null;
}
