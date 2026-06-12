-- 360desk Database Schema
-- Run this entire script in the Supabase SQL Editor

-- ─────────────────────────────────────────────
-- 1. ENUM TYPES
-- ─────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('guest', 'vendor', 'admin');
CREATE TYPE ad_status AS ENUM ('draft', 'pending', 'approved', 'rejected');
CREATE TYPE visibility_mode AS ENUM ('private', 'internal_mls', 'public');
CREATE TYPE record_type AS ENUM ('income', 'expense');

-- ─────────────────────────────────────────────
-- 2. TABLES
-- ─────────────────────────────────────────────

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'vendor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Classified Ads (Sahibinden model)
CREATE TABLE classified_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_listing_id TEXT UNIQUE,
  tasinmaz_no TEXT,
  vendor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  category TEXT NOT NULL,
  category_main TEXT,
  category_type TEXT,
  category_group TEXT,
  category_sub TEXT,
  location TEXT,
  contact_phone TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  sq_meters_gross INTEGER CHECK (sq_meters_gross IS NULL OR sq_meters_gross > 0),
  sq_meters_net INTEGER CHECK (sq_meters_net IS NULL OR sq_meters_net > 0),
  room_count TEXT,
  floor_number TEXT,
  total_floors INTEGER CHECK (total_floors IS NULL OR total_floors > 0),
  heating_type TEXT,
  building_age INTEGER CHECK (building_age IS NULL OR building_age >= 0),
  dynamic_properties JSONB NOT NULL DEFAULT '{
    "property_specs": {},
    "community_specs": {},
    "location_specs": {}
  }'::jsonb,
  status ad_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  visibility_mode visibility_mode NOT NULL DEFAULT 'private',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Financial Records (Parasut model)
CREATE TABLE financial_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type record_type NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  description TEXT,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 3. INDEXES
-- ─────────────────────────────────────────────

CREATE INDEX idx_classified_ads_vendor_id ON classified_ads(vendor_id);
CREATE INDEX idx_classified_ads_status ON classified_ads(status);
CREATE INDEX idx_classified_ads_is_archived ON classified_ads(is_archived);
CREATE INDEX idx_classified_ads_tasinmaz_no ON classified_ads(tasinmaz_no)
  WHERE tasinmaz_no IS NOT NULL;
CREATE UNIQUE INDEX idx_classified_ads_tasinmaz_active ON classified_ads(tasinmaz_no)
  WHERE tasinmaz_no IS NOT NULL
    AND status IN ('pending', 'approved')
    AND is_archived = false;
CREATE INDEX idx_classified_ads_category ON classified_ads(category);
CREATE INDEX idx_classified_ads_category_main ON classified_ads(category_main);
CREATE INDEX idx_classified_ads_category_type ON classified_ads(category_type);
CREATE INDEX idx_classified_ads_category_group ON classified_ads(category_group);
CREATE INDEX idx_classified_ads_dynamic_properties ON classified_ads USING GIN (dynamic_properties);
CREATE INDEX idx_classified_ads_room_count ON classified_ads(room_count);
CREATE INDEX idx_classified_ads_heating_type ON classified_ads(heating_type);
CREATE INDEX idx_financial_records_vendor_id ON financial_records(vendor_id);
CREATE INDEX idx_financial_records_record_date ON financial_records(record_date);

-- ─────────────────────────────────────────────
-- 4. HELPER FUNCTIONS
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_vendor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('vendor', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'vendor'
  );
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────
-- 5. TRIGGERS
-- ─────────────────────────────────────────────

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER classified_ads_updated_at
  BEFORE UPDATE ON classified_ads
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.generate_custom_listing_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.custom_listing_id IS NULL OR NEW.custom_listing_id = '' THEN
    NEW.custom_listing_id := '360-' || UPPER(SUBSTRING(REPLACE(NEW.id::text, '-', '') FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_custom_listing_id
  BEFORE INSERT ON classified_ads
  FOR EACH ROW EXECUTE FUNCTION public.generate_custom_listing_id();

-- ─────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classified_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by owner"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Public can view vendor profiles for approved ads"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classified_ads
      WHERE classified_ads.vendor_id = profiles.id
        AND classified_ads.status = 'approved'
    )
  );

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile role"
  ON profiles FOR UPDATE
  USING (public.is_admin());

-- Classified ads policies
CREATE POLICY "Anyone can view approved active public ads"
  ON classified_ads FOR SELECT
  USING (
    status = 'approved'
    AND is_archived = false
    AND visibility_mode = 'public'
  );

CREATE POLICY "Vendors can view own ads"
  ON classified_ads FOR SELECT
  USING (auth.uid() = vendor_id);

CREATE POLICY "Admins can view all ads"
  ON classified_ads FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Vendors can insert own ads"
  ON classified_ads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Vendors can update own ads"
  ON classified_ads FOR UPDATE
  USING (auth.uid() = vendor_id)
  WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Admins can update any ad status"
  ON classified_ads FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Vendors can delete own ads"
  ON classified_ads FOR DELETE
  USING (auth.uid() = vendor_id);

-- Financial records policies
CREATE POLICY "Vendors can view own financial records"
  ON financial_records FOR SELECT
  USING (auth.uid() = vendor_id);

CREATE POLICY "Admins can view all financial records"
  ON financial_records FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Vendors can insert own financial records"
  ON financial_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Vendors can update own financial records"
  ON financial_records FOR UPDATE
  USING (auth.uid() = vendor_id)
  WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Vendors can delete own financial records"
  ON financial_records FOR DELETE
  USING (auth.uid() = vendor_id);

-- ─────────────────────────────────────────────
-- 7. STORAGE POLICIES (ad-images bucket)
-- ─────────────────────────────────────────────

CREATE POLICY "Anyone can view ad images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ad-images');

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
