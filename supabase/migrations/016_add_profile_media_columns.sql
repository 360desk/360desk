-- Profile photo / office logo media URLs for B2B directory identity

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS logo_url text;

UPDATE profiles
SET account_type = CASE
  WHEN account_type IS NOT NULL THEN account_type
  WHEN user_type = 'office_admin' THEN 'ofis'
  WHEN user_type = 'franchise_admin' THEN 'franchise'
  ELSE 'bireysel'
END
WHERE account_type IS NULL;
