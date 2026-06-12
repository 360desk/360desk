-- Phase 2 franchise hierarchy role documentation and backfill

COMMENT ON COLUMN profiles.office_user_role IS
  'Corporate hierarchy role: franchise_master | broker_owner | office_agent';

UPDATE profiles
SET office_user_role = 'franchise_master'
WHERE subscription_tier = 'enterprise_franchise'
  AND (company_leader_id IS NULL OR company_leader_id = id)
  AND (office_user_role IS NULL OR office_user_role = '');

UPDATE profiles
SET office_user_role = 'broker_owner'
WHERE subscription_tier = 'bagimsiz_ofis'
  AND (company_leader_id IS NULL OR company_leader_id = id)
  AND (office_user_role IS NULL OR office_user_role = '');
