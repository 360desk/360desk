import type { SupabaseClient } from "@supabase/supabase-js";
import type { TeamInvitationRecord } from "@/lib/supabase/team-invitations-table";

export type PendingInvitationRow = TeamInvitationRecord;

export async function cascadeFranchiseOfficeLink(
  admin: SupabaseClient,
  franchiseMasterId: string,
  acceptingBrokerId: string
): Promise<{ linked_agent_count: number }> {
  const { data: agents, error } = await admin
    .from("profiles")
    .select("id")
    .eq("company_leader_id", acceptingBrokerId)
    .eq("user_role", "office_agent");

  if (error && !error.message.includes("does not exist")) {
    throw new Error(error.message);
  }

  return {
    linked_agent_count: agents?.length ?? 0,
  };
}

export async function acceptAgentOfficeInvitation(
  admin: SupabaseClient,
  invitation: PendingInvitationRow,
  userId: string
): Promise<void> {
  const profilePayload: Record<string, unknown> = {
    user_type: "office_staff",
    parent_office_id: invitation.broker_id,
    company_leader_id: invitation.broker_id,
    user_role: "office_agent",
    account_origin: "self",
    contract_accepted: false,
    contract_accepted_at: null,
    updated_at: new Date().toISOString(),
  };

  let { error: profileError } = await admin
    .from("profiles")
    .update(profilePayload)
    .eq("id", userId);

  if (
    profileError &&
    (profileError.message.includes("company_leader_id") ||
      profileError.message.includes("user_role"))
  ) {
    const {
      company_leader_id: _leader,
      user_role: _role,
      ...legacyPayload
    } = profilePayload;

    const retry = await admin
      .from("profiles")
      .update(legacyPayload)
      .eq("id", userId);

    profileError = retry.error;
  }

  if (profileError) {
    throw new Error(profileError.message);
  }
}

export async function acceptFranchiseOfficeInvitation(
  admin: SupabaseClient,
  invitation: PendingInvitationRow,
  userId: string
): Promise<{ linked_agent_count: number }> {
  const profilePayload: Record<string, unknown> = {
    user_type: "office_admin",
    parent_office_id: invitation.broker_id,
    company_leader_id: invitation.broker_id,
    user_role: "broker_owner",
    account_origin: "self",
    contract_accepted: false,
    contract_accepted_at: null,
    updated_at: new Date().toISOString(),
  };

  let { error: profileError } = await admin
    .from("profiles")
    .update(profilePayload)
    .eq("id", userId);

  if (
    profileError &&
    (profileError.message.includes("company_leader_id") ||
      profileError.message.includes("user_role"))
  ) {
    const {
      company_leader_id: _leader,
      user_role: _role,
      ...legacyPayload
    } = profilePayload;

    const retry = await admin
      .from("profiles")
      .update(legacyPayload)
      .eq("id", userId);

    profileError = retry.error;
  }

  if (profileError) {
    throw new Error(profileError.message);
  }

  return cascadeFranchiseOfficeLink(admin, invitation.broker_id, userId);
}

export { resolveInvitationTargetRole } from "@/lib/supabase/team-invitations-table";
