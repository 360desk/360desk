-- Enterprise listing ownership transfer governance

DO $$ BEGIN
  CREATE TYPE listing_transfer_status AS ENUM (
    'none',
    'pending',
    'approved',
    'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE classified_ads
  ADD COLUMN IF NOT EXISTS transfer_status listing_transfer_status NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS target_owner_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_classified_ads_transfer_status
  ON classified_ads(transfer_status)
  WHERE transfer_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_classified_ads_target_owner_id
  ON classified_ads(target_owner_id)
  WHERE target_owner_id IS NOT NULL;
