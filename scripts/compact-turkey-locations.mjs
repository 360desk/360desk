import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, "../src/data/turkey-locations");

const provinces = JSON.parse(
  fs.readFileSync(path.join(dir, "provinces.json"), "utf8")
).map((province) => ({ id: province.id, name: province.name }));

const districts = JSON.parse(
  fs.readFileSync(path.join(dir, "districts.json"), "utf8")
).map((district) => ({
  id: district.id,
  name: district.name,
  provinceId: district.provinceId,
}));

const neighborhoods = JSON.parse(
  fs.readFileSync(path.join(dir, "neighborhoods.json"), "utf8")
).map((neighborhood) => ({
  id: neighborhood.id,
  name: neighborhood.name,
  districtId: neighborhood.districtId,
}));

fs.writeFileSync(
  path.join(dir, "provinces.compact.json"),
  JSON.stringify(provinces)
);
fs.writeFileSync(
  path.join(dir, "districts.compact.json"),
  JSON.stringify(districts)
);
fs.writeFileSync(
  path.join(dir, "neighborhoods.compact.json"),
  JSON.stringify(neighborhoods)
);

console.log("Compact datasets written:", {
  provinces: provinces.length,
  districts: districts.length,
  neighborhoods: neighborhoods.length,
});
