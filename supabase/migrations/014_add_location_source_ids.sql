-- External source IDs for idempotent Turkey location seeding (TurkiyeAPI)

ALTER TABLE cities
  ADD COLUMN IF NOT EXISTS source_id INTEGER;

ALTER TABLE districts
  ADD COLUMN IF NOT EXISTS source_id INTEGER;

ALTER TABLE neighborhoods
  ADD COLUMN IF NOT EXISTS source_id INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cities_source_id
  ON cities(source_id)
  WHERE source_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_districts_source_id
  ON districts(source_id)
  WHERE source_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_neighborhoods_source_id
  ON neighborhoods(source_id)
  WHERE source_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cities_plate_code
  ON cities(plate_code)
  WHERE plate_code IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_districts_city_id_name
  ON districts(city_id, name);

CREATE UNIQUE INDEX IF NOT EXISTS idx_neighborhoods_district_id_name
  ON neighborhoods(district_id, name);
