-- Align listing ownership columns and UPDATE/SELECT RLS with office/broker model.

ALTER TABLE classified_ads
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS managed_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_classified_ads_owner_id
  ON classified_ads(owner_id)
  WHERE owner_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_classified_ads_managed_by_id
  ON classified_ads(managed_by_id)
  WHERE managed_by_id IS NOT NULL;

UPDATE classified_ads
SET
  owner_id = COALESCE(owner_id, vendor_id),
  managed_by_id = COALESCE(managed_by_id, vendor_id)
WHERE owner_id IS NULL OR managed_by_id IS NULL;

DROP POLICY IF EXISTS "Vendors can view own ads" ON classified_ads;
CREATE POLICY "Vendors can view own ads"
  ON classified_ads FOR SELECT
  USING (
    auth.uid() = vendor_id
    OR auth.uid() = owner_id
    OR auth.uid() = managed_by_id
  );

DROP POLICY IF EXISTS "Vendors can update own ads" ON classified_ads;
CREATE POLICY "Vendors can update own ads"
  ON classified_ads FOR UPDATE
  USING (
    auth.uid() = vendor_id
    OR auth.uid() = owner_id
    OR auth.uid() = managed_by_id
  )
  WITH CHECK (
    auth.uid() = vendor_id
    OR auth.uid() = owner_id
    OR auth.uid() = managed_by_id
  );
