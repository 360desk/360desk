-- Live map integration: open address and precise coordinates on listings

ALTER TABLE classified_ads
  ADD COLUMN IF NOT EXISTS full_address text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

CREATE INDEX IF NOT EXISTS idx_classified_ads_coordinates
  ON classified_ads(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
