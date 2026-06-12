-- Premium human-readable listing reference ID

ALTER TABLE classified_ads
  ADD COLUMN IF NOT EXISTS custom_listing_id TEXT UNIQUE;

CREATE OR REPLACE FUNCTION public.generate_custom_listing_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.custom_listing_id IS NULL OR NEW.custom_listing_id = '' THEN
    NEW.custom_listing_id := '360-' || UPPER(SUBSTRING(REPLACE(NEW.id::text, '-', '') FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_custom_listing_id ON classified_ads;

CREATE TRIGGER set_custom_listing_id
  BEFORE INSERT ON classified_ads
  FOR EACH ROW EXECUTE FUNCTION public.generate_custom_listing_id();

-- Backfill existing rows
UPDATE classified_ads
SET custom_listing_id = '360-' || UPPER(SUBSTRING(REPLACE(id::text, '-', '') FROM 1 FOR 8))
WHERE custom_listing_id IS NULL;
