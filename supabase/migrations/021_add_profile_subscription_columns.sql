-- Phase 2 SaaS subscription quotas on profiles

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'pro_professional',
  ADD COLUMN IF NOT EXISTS max_listing_limit INTEGER NOT NULL DEFAULT 5 CHECK (max_listing_limit > 0),
  ADD COLUMN IF NOT EXISTS max_image_per_listing INTEGER NOT NULL DEFAULT 8 CHECK (max_image_per_listing > 0),
  ADD COLUMN IF NOT EXISTS contract_accepted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contract_accepted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier
  ON profiles(subscription_tier);
