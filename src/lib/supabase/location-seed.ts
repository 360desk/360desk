import type { SupabaseClient } from "@supabase/supabase-js";
import { deterministicLocationUuid } from "@/lib/turkey-locations/deterministic-id";
import { loadLocalTurkeyLocationDataset } from "@/lib/turkey-locations/load-local-dataset";
import type {
  TurkiyeApiDistrict,
  TurkiyeApiNeighborhood,
  TurkiyeApiProvince,
  LocationSeedResult,
} from "@/types/location-seed";

const BATCH_SIZE = 500;

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

function districtKey(cityId: number, name: string): string {
  return `${cityId}::${name}`;
}

function neighborhoodKey(districtId: string, name: string): string {
  return `${districtId}::${name}`;
}

async function buildDistrictSourceMap(
  admin: SupabaseClient,
  districts: TurkiyeApiDistrict[]
): Promise<Map<number, string>> {
  const { data: rows, error } = await admin
    .from("districts")
    .select("id, city_id, name");

  if (error) {
    throw new Error(`İlçe eşlemesi okunamadı: ${error.message}`);
  }

  const byCityAndName = new Map(
    (rows ?? []).map((row) => [
      districtKey(row.city_id as number, row.name as string),
      row.id as string,
    ])
  );

  const map = new Map<number, string>();

  for (const district of districts) {
    const districtId = byCityAndName.get(
      districtKey(district.provinceId, district.name)
    );

    if (districtId) {
      map.set(district.id, districtId);
    }
  }

  return map;
}

async function seedCities(
  admin: SupabaseClient,
  provinces: TurkiyeApiProvince[]
): Promise<void> {
  for (const batch of chunk(provinces, BATCH_SIZE)) {
    const rows = batch.map((province) => ({
      id: province.id,
      name: province.name,
    }));

    const { error } = await admin.from("cities").upsert(rows, { onConflict: "id" });

    if (error) {
      throw new Error(`İl kayıtları eklenemedi: ${error.message}`);
    }
  }
}

async function seedDistricts(
  admin: SupabaseClient,
  districts: TurkiyeApiDistrict[]
): Promise<number> {
  const { data: existing, error } = await admin
    .from("districts")
    .select("city_id, name");

  if (error) {
    throw new Error(`İlçe kayıtları okunamadı: ${error.message}`);
  }

  const existingKeys = new Set(
    (existing ?? []).map((row) =>
      districtKey(row.city_id as number, row.name as string)
    )
  );

  const missing = districts
    .filter(
      (district) =>
        !existingKeys.has(districtKey(district.provinceId, district.name))
    )
    .map((district) => ({
      id: deterministicLocationUuid("district", district.id),
      name: district.name,
      city_id: district.provinceId,
    }));

  let inserted = 0;

  for (const batch of chunk(missing, BATCH_SIZE)) {
    if (!batch.length) continue;

    const { error: insertError } = await admin.from("districts").insert(batch);

    if (insertError) {
      throw new Error(`İlçe kayıtları eklenemedi: ${insertError.message}`);
    }

    inserted += batch.length;
  }

  return inserted;
}

async function seedNeighborhoods(
  admin: SupabaseClient,
  neighborhoods: TurkiyeApiNeighborhood[],
  districtIdBySource: Map<number, string>
): Promise<number> {
  const { data: existing, error } = await admin
    .from("neighborhoods")
    .select("district_id, name");

  if (error) {
    throw new Error(`Mahalle kayıtları okunamadı: ${error.message}`);
  }

  const existingKeys = new Set(
    (existing ?? []).map((row) =>
      neighborhoodKey(row.district_id as string, row.name as string)
    )
  );

  const missing = neighborhoods
    .map((neighborhood) => {
      const districtId = districtIdBySource.get(neighborhood.districtId);

      if (!districtId) {
        return null;
      }

      const key = neighborhoodKey(districtId, neighborhood.name);

      if (existingKeys.has(key)) {
        return null;
      }

      existingKeys.add(key);

      return {
        id: deterministicLocationUuid("neighborhood", neighborhood.id),
        name: neighborhood.name,
        district_id: districtId,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    name: string;
    district_id: string;
  }>;

  let inserted = 0;

  for (const batch of chunk(missing, BATCH_SIZE)) {
    if (!batch.length) continue;

    const { error: insertError } = await admin.from("neighborhoods").insert(batch);

    if (insertError) {
      throw new Error(`Mahalle kayıtları eklenemedi: ${insertError.message}`);
    }

    inserted += batch.length;
  }

  return inserted;
}

export async function getLocationSeedCounts(
  admin: SupabaseClient
): Promise<{ cities: number; districts: number; neighborhoods: number }> {
  const [cities, districts, neighborhoods] = await Promise.all([
    admin.from("cities").select("id", { count: "exact", head: true }),
    admin.from("districts").select("id", { count: "exact", head: true }),
    admin.from("neighborhoods").select("id", { count: "exact", head: true }),
  ]);

  return {
    cities: cities.count ?? 0,
    districts: districts.count ?? 0,
    neighborhoods: neighborhoods.count ?? 0,
  };
}

function isDatasetComplete(counts: {
  cities: number;
  districts: number;
  neighborhoods: number;
}): boolean {
  return (
    counts.cities >= 81 &&
    counts.districts >= 973 &&
    counts.neighborhoods >= 31900
  );
}

export async function seedTurkeyLocations(
  admin: SupabaseClient,
  options?: { force?: boolean; includeNeighborhoods?: boolean }
): Promise<LocationSeedResult> {
  const startedAt = Date.now();
  const existing = await getLocationSeedCounts(admin);

  if (isDatasetComplete(existing) && !options?.force) {
    return {
      source: "local:turkey-locations",
      dataset_year: 2025,
      cities_upserted: existing.cities,
      districts_upserted: existing.districts,
      neighborhoods_upserted: existing.neighborhoods,
      skipped_neighborhoods: 0,
      duration_ms: Date.now() - startedAt,
      already_seeded: true,
    };
  }

  const { provinces, districts, neighborhoods } = loadLocalTurkeyLocationDataset({
    includeNeighborhoods: options?.includeNeighborhoods !== false,
  });

  await seedCities(admin, provinces);
  await seedDistricts(admin, districts);
  const districtIdBySource = await buildDistrictSourceMap(admin, districts);

  let neighborhoodInserted = 0;

  if (options?.includeNeighborhoods !== false && neighborhoods.length > 0) {
    neighborhoodInserted = await seedNeighborhoods(
      admin,
      neighborhoods,
      districtIdBySource
    );
  }

  const finalCounts = await getLocationSeedCounts(admin);

  return {
    source: "local:turkey-locations",
    dataset_year: 2025,
    cities_upserted: finalCounts.cities,
    districts_upserted: finalCounts.districts,
    neighborhoods_upserted: finalCounts.neighborhoods,
    skipped_neighborhoods: neighborhoods.length - neighborhoodInserted,
    duration_ms: Date.now() - startedAt,
    already_seeded: false,
  };
}
