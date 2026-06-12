export interface TurkiyeApiProvince {
  id: number;
  name: string;
}

export interface TurkiyeApiDistrict {
  id: number;
  name: string;
  provinceId: number;
}

export interface TurkiyeApiNeighborhood {
  id: number;
  name: string;
  districtId: number;
  provinceId?: number;
}

export interface LocationSeedResult {
  source: "local:turkey-locations" | "turkiyeapi.dev";
  dataset_year: 2025;
  cities_upserted: number;
  districts_upserted: number;
  neighborhoods_upserted: number;
  skipped_neighborhoods: number;
  duration_ms: number;
  already_seeded: boolean;
}
