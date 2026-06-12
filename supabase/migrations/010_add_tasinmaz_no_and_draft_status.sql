DO $$
BEGIN
  ALTER TYPE ad_status ADD VALUE 'draft';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE classified_ads
  ADD COLUMN IF NOT EXISTS tasinmaz_no TEXT;

CREATE INDEX IF NOT EXISTS idx_classified_ads_tasinmaz_no
  ON classified_ads(tasinmaz_no)
  WHERE tasinmaz_no IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_classified_ads_tasinmaz_active
  ON classified_ads(tasinmaz_no)
  WHERE tasinmaz_no IS NOT NULL
    AND status IN ('pending', 'approved')
    AND is_archived = false;
