-- Migration: Add images column + Storage policies for ad-images bucket
-- Run this in Supabase SQL Editor if you already created the base schema

-- ─────────────────────────────────────────────
-- 1. ADD IMAGES COLUMN
-- ─────────────────────────────────────────────

ALTER TABLE classified_ads
  ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}';

-- ─────────────────────────────────────────────
-- 2. STORAGE POLICIES (ad-images bucket)
-- ─────────────────────────────────────────────

-- Public read (bucket is public, but policy still needed for RLS)
CREATE POLICY "Anyone can view ad images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ad-images');

-- Vendors upload into their own folder: {user_id}/filename
CREATE POLICY "Vendors can upload ad images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ad-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Vendors can update own ad images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'ad-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Vendors can delete own ad images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'ad-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
