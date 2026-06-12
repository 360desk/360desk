-- Sync production team_invitations to canonical column contract

ALTER TABLE team_invitations
  ADD COLUMN IF NOT EXISTS invitee_phone text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'team_invitations'
      AND column_name = 'office_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'team_invitations'
      AND column_name = 'broker_id'
  ) THEN
    ALTER TABLE team_invitations
      RENAME COLUMN office_id TO broker_id;
  END IF;
END $$;

ALTER TABLE team_invitations
  DROP COLUMN IF EXISTS invitee_id,
  DROP COLUMN IF EXISTS token,
  DROP COLUMN IF EXISTS expires_at,
  DROP COLUMN IF EXISTS accepted_at;

CREATE INDEX IF NOT EXISTS idx_team_invitations_broker
  ON team_invitations(broker_id);

CREATE INDEX IF NOT EXISTS idx_team_invitations_pending_broker
  ON team_invitations(broker_id, status)
  WHERE status = 'pending';
