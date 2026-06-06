-- Fix RLS: allow authenticated users to insert own profile & ads
-- Run this in Supabase SQL Editor if you get "new row violates row-level security policy"

-- ─────────────────────────────────────────────
-- 1. PROFILES — allow users to create own profile
-- ─────────────────────────────────────────────

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Backfill profiles for existing auth users missing a row
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  'vendor'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- ─────────────────────────────────────────────
-- 2. CLASSIFIED_ADS — simplify insert policy
-- ─────────────────────────────────────────────

DROP POLICY IF EXISTS "Vendors can insert own ads" ON classified_ads;

CREATE POLICY "Vendors can insert own ads"
  ON classified_ads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = vendor_id);

-- ─────────────────────────────────────────────
-- 3. FINANCIAL_RECORDS — simplify insert policy
-- ─────────────────────────────────────────────

DROP POLICY IF EXISTS "Vendors can insert own financial records" ON financial_records;

CREATE POLICY "Vendors can insert own financial records"
  ON financial_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = vendor_id);
