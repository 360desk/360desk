-- Canonical public.team_invitations schema (single source of truth)

CREATE TABLE IF NOT EXISTS team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_email text NOT NULL,
  invitee_phone text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  invite_type text NOT NULL CHECK (invite_type IN ('agent', 'office')),
  target_role text NOT NULL CHECK (target_role IN ('office_agent', 'broker_owner')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_invitations_broker
  ON team_invitations(broker_id);

CREATE INDEX IF NOT EXISTS idx_team_invitations_invitee_email
  ON team_invitations(lower(invitee_email));

CREATE INDEX IF NOT EXISTS idx_team_invitations_pending_broker
  ON team_invitations(broker_id, status)
  WHERE status = 'pending';

COMMENT ON TABLE team_invitations IS
  'Corporate team invitations. Owner column is broker_id only.';

COMMENT ON COLUMN team_invitations.broker_id IS
  'Inviting franchise master or broker owner profile id';

COMMENT ON COLUMN team_invitations.invitee_phone IS
  'Optional invitee phone captured at send time';

COMMENT ON COLUMN team_invitations.invite_type IS
  'agent = danışman daveti, office = alt ofis/şube daveti';

COMMENT ON COLUMN team_invitations.target_role IS
  'Hierarchy role assigned after acceptance';
