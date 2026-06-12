-- Default new profiles to Free Trial tier quotas

ALTER TABLE profiles
  ALTER COLUMN subscription_tier SET DEFAULT 'free_trial',
  ALTER COLUMN max_image_per_listing SET DEFAULT 10;
