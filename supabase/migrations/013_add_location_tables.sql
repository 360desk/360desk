-- Turkey-wide location hierarchy: cities → districts → neighborhoods

CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plate_code SMALLINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_districts_city_id ON districts(city_id);
CREATE INDEX IF NOT EXISTS idx_neighborhoods_district_id ON neighborhoods(district_id);

ALTER TABLE classified_ads
  ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES districts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_classified_ads_city_id ON classified_ads(city_id);
CREATE INDEX IF NOT EXISTS idx_classified_ads_district_id ON classified_ads(district_id);
CREATE INDEX IF NOT EXISTS idx_classified_ads_neighborhood_id ON classified_ads(neighborhood_id);

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read cities" ON cities;
CREATE POLICY "Anyone can read cities"
  ON cities FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can read districts" ON districts;
CREATE POLICY "Anyone can read districts"
  ON districts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can read neighborhoods" ON neighborhoods;
CREATE POLICY "Anyone can read neighborhoods"
  ON neighborhoods FOR SELECT
  USING (true);
