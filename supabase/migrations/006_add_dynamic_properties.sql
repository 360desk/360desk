-- Partitioned JSONB for category-specific ad characteristics

ALTER TABLE classified_ads
  ADD COLUMN IF NOT EXISTS dynamic_properties JSONB NOT NULL DEFAULT '{
    "property_specs": {},
    "community_specs": {},
    "location_specs": {}
  }'::jsonb;

CREATE INDEX IF NOT EXISTS idx_classified_ads_dynamic_properties
  ON classified_ads USING GIN (dynamic_properties);
