-- Hierarchical real estate category columns

ALTER TABLE classified_ads
  ADD COLUMN IF NOT EXISTS category_main TEXT,
  ADD COLUMN IF NOT EXISTS category_type TEXT,
  ADD COLUMN IF NOT EXISTS category_group TEXT,
  ADD COLUMN IF NOT EXISTS category_sub TEXT;

CREATE INDEX IF NOT EXISTS idx_classified_ads_category_main ON classified_ads(category_main);
CREATE INDEX IF NOT EXISTS idx_classified_ads_category_type ON classified_ads(category_type);
CREATE INDEX IF NOT EXISTS idx_classified_ads_category_group ON classified_ads(category_group);

-- Backfill legacy category column from hierarchy where possible
UPDATE classified_ads
SET
  category_main = COALESCE(category_main, 'GAYRİMENKUL'),
  category_type = COALESCE(category_type, SPLIT_PART(category, ' › ', 2)),
  category_group = COALESCE(category_group, SPLIT_PART(category, ' › ', 3)),
  category_sub = COALESCE(category_sub, NULLIF(SPLIT_PART(category, ' › ', 4), ''))
WHERE category_main IS NULL AND category IS NOT NULL;
