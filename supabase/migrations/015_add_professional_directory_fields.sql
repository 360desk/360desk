-- B2B Professionals Directory fields on profiles

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS professional_level integer
    CHECK (professional_level IS NULL OR (professional_level >= 1 AND professional_level <= 10)),
  ADD COLUMN IF NOT EXISTS account_type text
    CHECK (account_type IS NULL OR account_type IN ('bireysel', 'ofis', 'franchise')),
  ADD COLUMN IF NOT EXISTS city_id integer REFERENCES cities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS district_id uuid REFERENCES districts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS neighborhood_id uuid REFERENCES neighborhoods(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS logo_url text;

CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON profiles(account_type)
  WHERE account_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_city_id ON profiles(city_id)
  WHERE city_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_district_id ON profiles(district_id)
  WHERE district_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_neighborhood_id ON profiles(neighborhood_id)
  WHERE neighborhood_id IS NOT NULL;

DROP POLICY IF EXISTS "Public can view directory professionals" ON profiles;

CREATE POLICY "Public can view directory professionals"
  ON profiles FOR SELECT
  USING (
    role = 'vendor'
    AND is_profile_completed = true
    AND is_suspended = false
  );
