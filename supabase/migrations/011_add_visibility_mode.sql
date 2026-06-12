DO $$
BEGIN
  CREATE TYPE visibility_mode AS ENUM ('private', 'internal_mls', 'public');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE classified_ads
  ADD COLUMN IF NOT EXISTS visibility_mode visibility_mode NOT NULL DEFAULT 'private';

UPDATE classified_ads
SET visibility_mode = 'public'
WHERE status = 'approved'
  AND is_archived = false
  AND visibility_mode = 'private';

DROP POLICY IF EXISTS "Anyone can view approved active ads" ON classified_ads;

CREATE POLICY "Anyone can view approved active public ads"
  ON classified_ads FOR SELECT
  USING (
    status = 'approved'
    AND is_archived = false
    AND visibility_mode = 'public'
  );
