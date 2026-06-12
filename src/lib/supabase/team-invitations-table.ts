import type { TeamInviteRole } from "@/types/office-hierarchy";

/** Single source of truth: public.team_invitations */
export const TEAM_INVITATIONS_TABLE = "team_invitations";

export type TeamInvitationType = "agent" | "office";
export type TeamInvitationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "revoked"
  | "expired";

/** Keys sent on INSERT — must match Supabase public.team_invitations exactly. */
export const TEAM_INVITATION_INSERT_KEYS = [
  "broker_id",
  "invitee_email",
  "invitee_phone",
  "invite_type",
  "target_role",
] as const;

export type TeamInvitationInsertPayload = {
  broker_id: string;
  invitee_email: string;
  invitee_phone: string | null;
  invite_type: TeamInvitationType;
  target_role: TeamInviteRole;
};

/** @deprecated use TeamInvitationInsertPayload */
export type TeamInvitationInsert = TeamInvitationInsertPayload;

export function buildTeamInvitationInsert(input: {
  brokerId: string;
  inviteeEmail: string;
  inviteePhone?: string | null;
  inviteType: TeamInvitationType;
  targetRole: TeamInviteRole;
}): TeamInvitationInsertPayload {
  return {
    broker_id: input.brokerId,
    invitee_email: input.inviteeEmail.trim().toLowerCase(),
    invitee_phone: input.inviteePhone?.trim() || null,
    invite_type: input.inviteType,
    target_role: input.targetRole,
  };
}

export function buildTeamInvitationInsertFromRole(input: {
  brokerId: string;
  inviteeEmail: string;
  inviteePhone?: string | null;
  inviteRole: TeamInviteRole;
}): TeamInvitationInsertPayload {
  const inviteMeta = resolveInviteMeta(input.inviteRole);
  return buildTeamInvitationInsert({
    brokerId: input.brokerId,
    inviteeEmail: input.inviteeEmail,
    inviteePhone: input.inviteePhone,
    inviteType: inviteMeta.invite_type,
    targetRole: inviteMeta.target_role,
  });
}

export const TEAM_INVITATION_SELECT =
  "id, broker_id, invitee_email, invitee_phone, status, invite_type, target_role, created_at";

export const TEAM_INVITATION_SENT_SELECT =
  "id, invitee_email, invitee_phone, status, invite_type, target_role, created_at";

export const TEAM_INVITATION_INBOX_SELECT =
  "id, broker_id, invitee_email, invitee_phone, status, invite_type, target_role, created_at";

export interface TeamInvitationRecord {
  id: string;
  broker_id: string;
  invitee_email: string;
  invitee_phone: string | null;
  status: TeamInvitationStatus | string;
  invite_type: TeamInvitationType;
  target_role: TeamInviteRole;
  created_at?: string;
}

export function buildTestOnboardingLink(
  invitationId: string,
  email: string
): string {
  const params = new URLSearchParams({
    token: invitationId,
    invite_token: invitationId,
    email: email.trim().toLowerCase(),
  });
  return `/auth/signup?${params.toString()}`;
}

export function buildInvitationVerificationLink(invitationId: string): string {
  return `/panelim?invite=${invitationId}&contract=pending`;
}

export function buildNewMemberVerificationLink(email: string): string {
  return `/giris?next=${encodeURIComponent("/panelim")}&contract=pending&email=${encodeURIComponent(email)}`;
}

export function resolveInviteMeta(inviteRole: TeamInviteRole): {
  invite_type: TeamInvitationType;
  target_role: TeamInviteRole;
} {
  if (inviteRole === "broker_owner") {
    return {
      invite_type: "office",
      target_role: "broker_owner",
    };
  }

  return {
    invite_type: "agent",
    target_role: "office_agent",
  };
}

export function resolveInvitationTargetRole(
  invitation: Pick<TeamInvitationRecord, "target_role">
): TeamInviteRole {
  return invitation.target_role === "broker_owner"
    ? "broker_owner"
    : "office_agent";
}

export function toPublicInvitationSummary(
  invitation: TeamInvitationRecord
): {
  id: string;
  invitee_email: string;
  status: string;
  created_at: string;
} {
  return {
    id: invitation.id,
    invitee_email: invitation.invitee_email,
    status: invitation.status,
    created_at: invitation.created_at ?? new Date().toISOString(),
  };
}
