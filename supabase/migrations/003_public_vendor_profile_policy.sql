-- Allow public read of vendor profiles for approved listings
-- Required for /ilan/[id] detail page vendor contact widget

CREATE POLICY "Public can view vendor profiles for approved ads"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classified_ads
      WHERE classified_ads.vendor_id = profiles.id
        AND classified_ads.status = 'approved'
    )
  );
