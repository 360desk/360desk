-- Store mesleki yeterlilik seviyesi as governed string labels

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_professional_level_check;

ALTER TABLE profiles
  ALTER COLUMN professional_level DROP DEFAULT;

ALTER TABLE profiles
  ALTER COLUMN professional_level TYPE text
  USING (
    CASE
      WHEN professional_level IS NULL THEN NULL
      WHEN professional_level::text = '4' THEN '4. Seviye'
      WHEN professional_level::text = '5' THEN '5. Seviye'
      ELSE professional_level::text
    END
  );

ALTER TABLE profiles
  ADD CONSTRAINT profiles_professional_level_check
  CHECK (
    professional_level IS NULL
    OR professional_level IN (
      'Yetki Belgesi Yok',
      '4. Seviye',
      '5. Seviye'
    )
  );
