-- Real Estate pivot: add sahibinden-style property columns

ALTER TABLE classified_ads
  ADD COLUMN IF NOT EXISTS sq_meters_gross INTEGER CHECK (sq_meters_gross IS NULL OR sq_meters_gross > 0),
  ADD COLUMN IF NOT EXISTS sq_meters_net INTEGER CHECK (sq_meters_net IS NULL OR sq_meters_net > 0),
  ADD COLUMN IF NOT EXISTS room_count TEXT,
  ADD COLUMN IF NOT EXISTS floor_number TEXT,
  ADD COLUMN IF NOT EXISTS total_floors INTEGER CHECK (total_floors IS NULL OR total_floors > 0),
  ADD COLUMN IF NOT EXISTS heating_type TEXT,
  ADD COLUMN IF NOT EXISTS building_age INTEGER CHECK (building_age IS NULL OR building_age >= 0);

CREATE INDEX IF NOT EXISTS idx_classified_ads_room_count ON classified_ads(room_count);
CREATE INDEX IF NOT EXISTS idx_classified_ads_heating_type ON classified_ads(heating_type);
