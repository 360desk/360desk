ALTER TABLE classified_ads
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
