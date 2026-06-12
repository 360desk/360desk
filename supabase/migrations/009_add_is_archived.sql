ALTER TABLE classified_ads
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_classified_ads_is_archived ON classified_ads(is_archived);

DROP POLICY IF EXISTS "Anyone can view approved ads" ON classified_ads;

CREATE POLICY "Anyone can view approved active ads"
  ON classified_ads FOR SELECT
  USING (status = 'approved' AND is_archived = false);

DROP POLICY IF EXISTS "Vendors can update own pending ads" ON classified_ads;

CREATE POLICY "Vendors can update own ads"
  ON classified_ads FOR UPDATE
  USING (auth.uid() = vendor_id)
  WITH CHECK (auth.uid() = vendor_id);

DROP POLICY IF EXISTS "Vendors can delete own pending ads" ON classified_ads;

CREATE POLICY "Vendors can delete own ads"
  ON classified_ads FOR DELETE
  USING (auth.uid() = vendor_id);
