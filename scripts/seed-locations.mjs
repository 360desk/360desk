import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dataDir = path.join(root, "src/data/turkey-locations");
const BATCH_SIZE = 500;

function deterministicLocationUuid(scope, sourceId) {
  const hash = createHash("sha256")
    .update(`360desk-location:${scope}:${sourceId}`)
    .digest("hex");

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join("-");
}

function loadEnvFile(filename) {
  const filePath = path.join(root, filename);
  if (!fs.existsSync(filePath)) return;

  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function chunk(items, size) {
  const batches = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

function readJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, filename), "utf8"));
}

function districtKey(cityId, name) {
  return `${cityId}::${name}`;
}

function neighborhoodKey(districtId, name) {
  return `${districtId}::${name}`;
}

async function main() {
  loadEnvFile(".env.local");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.");
  }

  const skipNeighborhoods = process.argv.includes("--no-neighborhoods");
  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const provinces = readJson("provinces.compact.json");
  const districts = readJson("districts.compact.json");
  const neighborhoods = skipNeighborhoods
    ? []
    : readJson("neighborhoods.compact.json");

  const startedAt = Date.now();
  console.log("Seeding Turkey locations from local dataset...");

  for (const batch of chunk(provinces, BATCH_SIZE)) {
    const { error } = await admin
      .from("cities")
      .upsert(
        batch.map((province) => ({ id: province.id, name: province.name })),
        { onConflict: "id" }
      );
    if (error) throw error;
  }

  const { data: existingDistricts, error: districtReadError } = await admin
    .from("districts")
    .select("city_id, name");
  if (districtReadError) throw districtReadError;

  const districtKeys = new Set(
    (existingDistricts ?? []).map((row) => districtKey(row.city_id, row.name))
  );

  const missingDistricts = districts
    .filter((district) => !districtKeys.has(districtKey(district.provinceId, district.name)))
    .map((district) => ({
      id: deterministicLocationUuid("district", district.id),
      name: district.name,
      city_id: district.provinceId,
    }));

  for (const batch of chunk(missingDistricts, BATCH_SIZE)) {
    if (!batch.length) continue;
    const { error } = await admin.from("districts").insert(batch);
    if (error) throw error;
  }

  let neighborhoodsInserted = 0;

  if (neighborhoods.length > 0) {
    const { data: allDistricts, error: allDistrictsError } = await admin
      .from("districts")
      .select("id, city_id, name");
    if (allDistrictsError) throw allDistrictsError;

    const districtByCityAndName = new Map(
      (allDistricts ?? []).map((row) => [districtKey(row.city_id, row.name), row.id])
    );

    const districtSourceMap = new Map();
    for (const district of districts) {
      const districtId = districtByCityAndName.get(
        districtKey(district.provinceId, district.name)
      );
      if (districtId) districtSourceMap.set(district.id, districtId);
    }

    const { data: existingNeighborhoods, error: neighborhoodReadError } = await admin
      .from("neighborhoods")
      .select("district_id, name");
    if (neighborhoodReadError) throw neighborhoodReadError;

    const neighborhoodKeys = new Set(
      (existingNeighborhoods ?? []).map((row) =>
        neighborhoodKey(row.district_id, row.name)
      )
    );

    const missingNeighborhoods = neighborhoods
      .map((neighborhood) => {
        const districtId = districtSourceMap.get(neighborhood.districtId);
        if (!districtId) return null;
        const key = neighborhoodKey(districtId, neighborhood.name);
        if (neighborhoodKeys.has(key)) return null;
        neighborhoodKeys.add(key);
        return {
          id: deterministicLocationUuid("neighborhood", neighborhood.id),
          name: neighborhood.name,
          district_id: districtId,
        };
      })
      .filter(Boolean);

    for (const batch of chunk(missingNeighborhoods, BATCH_SIZE)) {
      if (!batch.length) continue;
      const { error } = await admin.from("neighborhoods").insert(batch);
      if (error) throw error;
      neighborhoodsInserted += batch.length;
    }
  }

  const [cities, districtCount, neighborhoodCount] = await Promise.all([
    admin.from("cities").select("id", { count: "exact", head: true }),
    admin.from("districts").select("id", { count: "exact", head: true }),
    admin.from("neighborhoods").select("id", { count: "exact", head: true }),
  ]);

  const istanbulDistricts = districts.filter((d) => d.provinceId === 34);

  console.log(
    JSON.stringify(
      {
        duration_ms: Date.now() - startedAt,
        inserted_this_run: {
          districts: missingDistricts.length,
          neighborhoods: neighborhoodsInserted,
        },
        local_dataset: {
          provinces: provinces.length,
          districts: districts.length,
          neighborhoods: neighborhoods.length,
        },
        database_counts: {
          cities: cities.count ?? 0,
          districts: districtCount.count ?? 0,
          neighborhoods: neighborhoodCount.count ?? 0,
        },
        istanbul_districts_in_dataset: istanbulDistricts.length,
        ready:
          (cities.count ?? 0) >= 81 &&
          (districtCount.count ?? 0) >= 973 &&
          (neighborhoodCount.count ?? 0) >= 31900,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("Seed failed:", error.message ?? error);
  process.exit(1);
});
