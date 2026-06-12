-- Office team management: account origin, invitations, dismiss RPC

DO $$ BEGIN
  CREATE TYPE account_origin AS ENUM ('self', 'created_by_office');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS account_origin account_origin NOT NULL DEFAULT 'self',
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS office_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_email text NOT NULL,
  invitee_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_office_invitations_office
  ON office_invitations(office_id);

CREATE INDEX IF NOT EXISTS idx_office_invitations_invitee_email
  ON office_invitations(lower(invitee_email));

CREATE INDEX IF NOT EXISTS idx_profiles_parent_office
  ON profiles(parent_office_id)
  WHERE parent_office_id IS NOT NULL;

CREATE OR REPLACE FUNCTION dismiss_office_staff(
  p_staff_id uuid,
  p_transfer_to_id uuid,
  p_broker_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff profiles%ROWTYPE;
  v_transferred_count integer := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = p_broker_id
      AND organization_role = 'office_admin'
  ) THEN
    RAISE EXCEPTION 'UNAUTHORIZED_BROKER';
  END IF;

  SELECT *
  INTO v_staff
  FROM profiles
  WHERE id = p_staff_id
    AND parent_office_id = p_broker_id
    AND organization_role = 'office_staff'
    AND is_suspended = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'STAFF_NOT_FOUND';
  END IF;

  IF p_transfer_to_id <> p_broker_id AND NOT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = p_transfer_to_id
      AND parent_office_id = p_broker_id
      AND organization_role = 'office_staff'
      AND is_suspended = false
      AND id <> p_staff_id
  ) THEN
    RAISE EXCEPTION 'INVALID_TRANSFER_TARGET';
  END IF;

  IF v_staff.account_origin = 'created_by_office' THEN
    UPDATE classified_ads
    SET managed_by_id = p_transfer_to_id,
        updated_at = now()
    WHERE managed_by_id = p_staff_id;

    GET DIAGNOSTICS v_transferred_count = ROW_COUNT;

    UPDATE profiles
    SET organization_role = 'individual',
        parent_office_id = NULL,
        is_suspended = true,
        updated_at = now()
    WHERE id = p_staff_id;
  ELSE
    UPDATE classified_ads
    SET managed_by_id = p_transfer_to_id,
        updated_at = now()
    WHERE managed_by_id = p_staff_id
      AND owner_id = p_broker_id;

    GET DIAGNOSTICS v_transferred_count = ROW_COUNT;

    UPDATE profiles
    SET organization_role = 'individual',
        parent_office_id = NULL,
        updated_at = now()
    WHERE id = p_staff_id;
  END IF;

  RETURN jsonb_build_object(
    'staff_id', p_staff_id,
    'transfer_to_id', p_transfer_to_id,
    'account_origin', v_staff.account_origin,
    'transferred_ads', v_transferred_count,
    'suspended', v_staff.account_origin = 'created_by_office'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION dismiss_office_staff(uuid, uuid, uuid) TO authenticated;
