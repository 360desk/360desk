import { readFileSync } from "node:fs";
import path from "node:path";
import type {
  TurkiyeApiDistrict,
  TurkiyeApiNeighborhood,
  TurkiyeApiProvince,
} from "@/types/location-seed";

export const TURKEY_LOCATION_DATASET = {
  source: "turkiyeapi.dev",
  year: 2025,
  cities: 81,
  districts: 973,
  neighborhoods: 32254,
} as const;

const DATA_DIR = path.join(
  process.cwd(),
  "src",
  "data",
  "turkey-locations"
);

function readCompactJson<T>(filename: string): T {
  const filePath = path.join(DATA_DIR, filename);
  const raw = readFileSync(filePath, "utf8");
  return JSON.parse(raw) as T;
}

export function loadLocalProvinces(): TurkiyeApiProvince[] {
  return readCompactJson<TurkiyeApiProvince[]>("provinces.compact.json");
}

export function loadLocalDistricts(): TurkiyeApiDistrict[] {
  return readCompactJson<TurkiyeApiDistrict[]>("districts.compact.json");
}

export function loadLocalNeighborhoods(): TurkiyeApiNeighborhood[] {
  return readCompactJson<TurkiyeApiNeighborhood[]>(
    "neighborhoods.compact.json"
  );
}

export function loadLocalTurkeyLocationDataset(options?: {
  includeNeighborhoods?: boolean;
}): {
  provinces: TurkiyeApiProvince[];
  districts: TurkiyeApiDistrict[];
  neighborhoods: TurkiyeApiNeighborhood[];
} {
  const provinces = loadLocalProvinces();
  const districts = loadLocalDistricts();
  const neighborhoods =
    options?.includeNeighborhoods === false
      ? []
      : loadLocalNeighborhoods();

  return { provinces, districts, neighborhoods };
}
