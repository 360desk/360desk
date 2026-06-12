-- Canonical hierarchy role column on profiles (franchise_master | broker_owner | office_agent)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS user_role TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_user_role
  ON profiles(user_role)
  WHERE user_role IS NOT NULL;

ALTER TABLE office_invitations
  ADD COLUMN IF NOT EXISTS invite_role TEXT;

COMMENT ON COLUMN profiles.user_role IS
  'Corporate hierarchy role: franchise_master, broker_owner, or office_agent';

COMMENT ON COLUMN office_invitations.invite_role IS
  'Invitation target role: broker_owner (office/branch) or office_agent (single agent)';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'office_user_role'
  ) THEN
    UPDATE profiles
    SET user_role = office_user_role
    WHERE (user_role IS NULL OR user_role = '')
      AND office_user_role IS NOT NULL
      AND office_user_role <> '';
  END IF;
END $$;
