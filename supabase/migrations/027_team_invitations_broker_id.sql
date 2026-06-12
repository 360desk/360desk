-- Align legacy migration column name with production schema

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

CREATE INDEX IF NOT EXISTS idx_team_invitations_broker
  ON team_invitations(broker_id);

COMMENT ON COLUMN team_invitations.broker_id IS
  'Inviting franchise master or broker owner profile id';
