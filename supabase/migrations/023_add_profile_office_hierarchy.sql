-- Phase 2 office hierarchy columns on profiles

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS company_leader_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS office_user_role TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_company_leader
  ON profiles(company_leader_id)
  WHERE company_leader_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_office_user_role
  ON profiles(office_user_role)
  WHERE office_user_role IS NOT NULL;
