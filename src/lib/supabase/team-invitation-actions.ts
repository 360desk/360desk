import type { SupabaseClient } from "@supabase/supabase-js";
import { sendTeamInvitationEmail } from "@/lib/email/team-invite-mail";
import {
  buildInvitationVerificationLink,
  buildNewMemberVerificationLink,
  buildTestOnboardingLink,
  TEAM_INVITATION_SELECT,
  TEAM_INVITATIONS_TABLE,
  type TeamInvitationRecord,
} from "@/lib/supabase/team-invitations-table";

export { buildTestOnboardingLink };

export type { TeamInvitationRecord };

export {
  buildInvitationVerificationLink,
  buildNewMemberVerificationLink,
} from "@/lib/supabase/team-invitations-table";

function memberBelongsToBroker(
  member: {
    company_leader_id?: string | null;
    parent_office_id?: string | null;
  },
  brokerId: string
): boolean {
  return (
    member.company_leader_id === brokerId ||
    member.parent_office_id === brokerId
  );
}

export async function assertManagedTeamMember(
  admin: SupabaseClient,
  memberId: string,
  leaderId: string
): Promise<{
  id: string;
  email: string;
  contract_accepted: boolean | null;
  account_origin: string | null;
  company_leader_id: string | null;
  parent_office_id: string | null;
}> {
  const { data: member, error } = await admin
    .from("profiles")
    .select(
      "id, email, contract_accepted, account_origin, company_leader_id, parent_office_id"
    )
    .eq("id", memberId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!member) {
    throw new Error("Ekip üyesi bulunamadı.");
  }

  if (memberBelongsToBroker(member, leaderId)) {
    return member as {
      id: string;
      email: string;
      contract_accepted: boolean | null;
      account_origin: string | null;
      company_leader_id: string | null;
      parent_office_id: string | null;
    };
  }

  const branchLeaderId = member.company_leader_id ?? member.parent_office_id;

  if (branchLeaderId) {
    const { data: branchLeader } = await admin
      .from("profiles")
      .select("company_leader_id, parent_office_id")
      .eq("id", branchLeaderId)
      .maybeSingle();

    if (branchLeader && memberBelongsToBroker(branchLeader, leaderId)) {
      return member as {
        id: string;
        email: string;
        contract_accepted: boolean | null;
        account_origin: string | null;
        company_leader_id: string | null;
        parent_office_id: string | null;
      };
    }
  }

  throw new Error("Bu ekip üyesi üzerinde işlem yapma yetkiniz yok.");
}

export async function findPendingInvitationForMember(
  admin: SupabaseClient,
  brokerId: string,
  member: { email: string }
): Promise<TeamInvitationRecord | null> {
  const email = member.email.trim().toLowerCase();

  const { data, error } = await admin
    .from(TEAM_INVITATIONS_TABLE)
    .select(TEAM_INVITATION_SELECT)
    .eq("broker_id", brokerId)
    .eq("invitee_email", email)
    .eq("status", "pending")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as TeamInvitationRecord | null) ?? null;
}

async function findPendingInvitationForResend(
  admin: SupabaseClient,
  sessionBrokerId: string,
  params: {
    invitationId?: string;
    email?: string;
  }
): Promise<TeamInvitationRecord> {
  const attempts: string[] = [];

  if (params.invitationId) {
    attempts.push(`team_invitations.id='${params.invitationId}'`);
    const byId = await lookupManagedInvitationById(
      admin,
      params.invitationId,
      sessionBrokerId
    );

    if (byId) {
      if (byId.status !== "pending") {
        throw new Error(
          `Davet bulundu ancak durumu '${byId.status}' — yalnızca 'pending' davetler yeniden gönderilebilir.`
        );
      }

      return byId;
    }
  }

  const email = params.email?.trim().toLowerCase();
  if (email) {
    attempts.push(
      `team_invitations.broker_id='${sessionBrokerId}' AND invitee_email='${email}' AND status='pending'`
    );
    const byEmail = await lookupManagedInvitationByEmail(
      admin,
      email,
      sessionBrokerId
    );

    if (byEmail) {
      return byEmail;
    }
  }

  throw new Error(
    `Bekleyen davet bulunamadı. Denenen sorgular: ${attempts.join(" | ")}`
  );
}

async function executeInvitationResend(
  admin: SupabaseClient,
  invitation: TeamInvitationRecord
): Promise<{
  invitation_id: string;
  invitee_email: string;
  verification_link: string;
  test_onboarding_link: string;
  email_sent: boolean;
  email_transport: "supabase_auth" | "resend";
}> {
  const refreshed = await touchInvitationResentAt(admin, invitation.id);
  const emailResult = await sendTeamInvitationEmail(admin, refreshed);
  const links = buildResendResult(refreshed);

  return {
    ...links,
    email_sent: emailResult.email_sent,
    email_transport: emailResult.transport,
  };
}

function isRevocablePendingProfile(
  profile: {
    account_origin: string | null;
    contract_accepted?: boolean | null;
    company_leader_id?: string | null;
    parent_office_id?: string | null;
  },
  brokerId: string
): boolean {
  if (profile.contract_accepted) {
    return false;
  }

  return (
    profile.company_leader_id === brokerId ||
    profile.parent_office_id === brokerId
  );
}

export async function fetchOwnedPendingInvitation(
  admin: SupabaseClient,
  invitationId: string,
  brokerId: string
): Promise<TeamInvitationRecord | null> {
  return lookupManagedInvitationById(admin, invitationId, brokerId);
}

async function lookupManagedInvitationById(
  admin: SupabaseClient,
  invitationId: string,
  brokerId: string
): Promise<TeamInvitationRecord | null> {
  const { data, error } = await admin
    .from(TEAM_INVITATIONS_TABLE)
    .select(TEAM_INVITATION_SELECT)
    .eq("id", invitationId)
    .maybeSingle();

  if (error) {
    throw new Error(`Davet sorgusu başarısız: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  if (data.broker_id !== brokerId) {
    throw new Error(
      `Bu davet oturumunuzdaki ofise ait değil (davet broker_id=${data.broker_id}, oturum broker_id=${brokerId}).`
    );
  }

  return data as TeamInvitationRecord;
}

async function lookupManagedInvitationByEmail(
  admin: SupabaseClient,
  email: string,
  brokerId: string
): Promise<TeamInvitationRecord | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await admin
    .from(TEAM_INVITATIONS_TABLE)
    .select(TEAM_INVITATION_SELECT)
    .eq("broker_id", brokerId)
    .eq("invitee_email", normalizedEmail)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`E-posta ile davet sorgusu başarısız: ${error.message}`);
  }

  return (data as TeamInvitationRecord | null) ?? null;
}

async function deleteInvitationRecord(
  admin: SupabaseClient,
  invitation: TeamInvitationRecord
): Promise<void> {
  const { error: deleteInviteError, count } = await admin
    .from(TEAM_INVITATIONS_TABLE)
    .delete({ count: "exact" })
    .eq("id", invitation.id);

  if (deleteInviteError) {
    throw new Error(`Davet silinemedi: ${deleteInviteError.message}`);
  }

  if ((count ?? 0) === 0) {
    throw new Error(
      `Davet kaydı silinemedi (team_invitations.id=${invitation.id}, etkilenen satır=0).`
    );
  }
}

async function deleteInvitationAndOptionalProfile(
  admin: SupabaseClient,
  invitation: TeamInvitationRecord
): Promise<{
  invitation_id: string;
  invitee_email: string;
  profile_removed: boolean;
}> {
  if (invitation.status !== "pending") {
    throw new Error(
      `Davet bulundu ancak durumu '${invitation.status}' — yalnızca 'pending' davetler iptal edilebilir.`
    );
  }

  const profileId = await resolveRevocableProfileId(admin, invitation);
  await deleteInvitationRecord(admin, invitation);

  let profileRemoved = false;

  if (profileId) {
    const { error: deleteProfileError } = await admin
      .from("profiles")
      .delete()
      .eq("id", profileId);

    if (deleteProfileError) {
      throw new Error(`Profil silinemedi: ${deleteProfileError.message}`);
    }

    await admin.auth.admin.deleteUser(profileId).catch(() => undefined);
    profileRemoved = true;
  }

  return {
    invitation_id: invitation.id,
    invitee_email: invitation.invitee_email,
    profile_removed: profileRemoved,
  };
}

export interface RevokeTeamInviteParams {
  invitationId?: string;
  memberId?: string;
  email?: string;
}

export interface RevokeTeamInviteResult {
  invitation_id: string | null;
  invitee_email: string;
  profile_removed: boolean;
  invitation_removed: boolean;
  member_id?: string;
}

export async function revokeTeamInvite(
  admin: SupabaseClient,
  brokerId: string,
  params: RevokeTeamInviteParams
): Promise<RevokeTeamInviteResult> {
  const invitationId = params.invitationId?.trim();
  const memberId = params.memberId?.trim();
  const email = params.email?.trim().toLowerCase();
  const attempts: string[] = [];

  if (invitationId) {
    attempts.push(`team_invitations.id='${invitationId}'`);
    const invitation = await lookupManagedInvitationById(
      admin,
      invitationId,
      brokerId
    );

    if (invitation) {
      const result = await deleteInvitationAndOptionalProfile(admin, invitation);
      return {
        ...result,
        invitation_removed: true,
      };
    }
  }

  if (email) {
    attempts.push(
      `team_invitations.invitee_email='${email}' AND broker_id='${brokerId}' AND status='pending'`
    );
    const invitation = await lookupManagedInvitationByEmail(
      admin,
      email,
      brokerId
    );

    if (invitation) {
      const result = await deleteInvitationAndOptionalProfile(admin, invitation);
      return {
        ...result,
        invitation_removed: true,
      };
    }
  }

  const profileTargetId = memberId || invitationId;
  if (profileTargetId) {
    attempts.push(`profiles.id='${profileTargetId}' (bekleyen üye iptali)`);
    try {
      const memberResult = await revokePendingMemberInvite(
        admin,
        profileTargetId,
        brokerId
      );

      return {
        invitation_id: memberResult.invitation_id,
        invitee_email: memberResult.invitee_email,
        profile_removed: memberResult.profile_removed,
        invitation_removed: memberResult.invitation_removed,
        member_id: memberResult.member_id,
      };
    } catch (memberError) {
      const message =
        memberError instanceof Error
          ? memberError.message
          : "Bekleyen üye iptali başarısız.";

      if (
        !message.includes("Ekip üyesi bulunamadı") &&
        !message.includes("üzerinde işlem yapma yetkiniz yok")
      ) {
        throw memberError;
      }

      attempts.push(`profiles.id='${profileTargetId}' → ${message}`);
    }
  }

  throw new Error(
    `Bekleyen davet bulunamadı. Denenen sorgular: ${attempts.join(" | ")}`
  );
}

function buildResendResult(invitation: Pick<TeamInvitationRecord, "id" | "invitee_email">) {
  const testOnboardingLink = buildTestOnboardingLink(
    invitation.id,
    invitation.invitee_email
  );

  return {
    invitation_id: invitation.id,
    invitee_email: invitation.invitee_email,
    verification_link: testOnboardingLink,
    test_onboarding_link: testOnboardingLink,
  };
}

async function touchInvitationResentAt(
  admin: SupabaseClient,
  invitationId: string
): Promise<TeamInvitationRecord> {
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from(TEAM_INVITATIONS_TABLE)
    .update({ created_at: now })
    .eq("id", invitationId)
    .select(TEAM_INVITATION_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Davet yenileme zaman damgası güncellenemedi.");
  }

  return data as TeamInvitationRecord;
}

export async function resendOfficeInvitation(
  admin: SupabaseClient,
  invitationId: string,
  brokerId: string
): Promise<{
  invitation_id: string;
  invitee_email: string;
  verification_link: string;
  test_onboarding_link: string;
  email_sent: boolean;
  email_transport: "supabase_auth" | "resend";
}> {
  const invitation = await findPendingInvitationForResend(admin, brokerId, {
    invitationId,
  });

  return executeInvitationResend(admin, invitation);
}

export async function resendTeamInvitation(
  admin: SupabaseClient,
  brokerId: string,
  params: {
    invitationId?: string;
    memberId?: string;
    email?: string;
  }
): Promise<{
  invitation_id: string;
  invitee_email: string;
  verification_link: string;
  test_onboarding_link: string;
  email_sent: boolean;
  email_transport: "supabase_auth" | "resend";
  member_id?: string;
}> {
  if (params.memberId) {
    const member = await assertManagedTeamMember(admin, params.memberId, brokerId);

    if (member.contract_accepted) {
      throw new Error("Aktif ekip üyeleri için davet yeniden gönderilemez.");
    }

    const invitation = await findPendingInvitationForResend(admin, brokerId, {
      invitationId: params.invitationId,
      email: params.email ?? member.email,
    });
    const result = await executeInvitationResend(admin, invitation);

    return {
      ...result,
      member_id: member.id,
    };
  }

  const invitation = await findPendingInvitationForResend(admin, brokerId, {
    invitationId: params.invitationId,
    email: params.email,
  });

  return executeInvitationResend(admin, invitation);
}

async function resolveRevocableProfileId(
  admin: SupabaseClient,
  invitation: TeamInvitationRecord
): Promise<string | null> {
  const email = invitation.invitee_email.trim().toLowerCase();
  const { data: profile } = await admin
    .from("profiles")
    .select(
      "id, email, account_origin, contract_accepted, company_leader_id, parent_office_id"
    )
    .eq("email", email)
    .maybeSingle();

  if (!profile) {
    return null;
  }

  if (isRevocablePendingProfile(profile, invitation.broker_id)) {
    return profile.id as string;
  }

  if (
    profile.account_origin === "created_by_office" &&
    !profile.contract_accepted &&
    !profile.company_leader_id &&
    !profile.parent_office_id
  ) {
    return profile.id as string;
  }

  return null;
}

export async function revokeOfficeInvitation(
  admin: SupabaseClient,
  invitationId: string,
  brokerId: string
): Promise<{
  invitation_id: string;
  invitee_email: string;
  profile_removed: boolean;
}> {
  const result = await revokeTeamInvite(admin, brokerId, {
    invitationId,
  });

  if (!result.invitation_removed || !result.invitation_id) {
    throw new Error("Bekleyen davet bulunamadı.");
  }

  return {
    invitation_id: result.invitation_id,
    invitee_email: result.invitee_email,
    profile_removed: result.profile_removed,
  };
}

export async function revokePendingInvitationByEmail(
  admin: SupabaseClient,
  brokerId: string,
  email: string
): Promise<{
  invitation_id: string;
  invitee_email: string;
  profile_removed: boolean;
}> {
  const result = await revokeTeamInvite(admin, brokerId, { email });

  if (!result.invitation_removed || !result.invitation_id) {
    throw new Error(
      `Bekleyen davet bulunamadı (invitee_email='${email.trim().toLowerCase()}', broker_id='${brokerId}').`
    );
  }

  return {
    invitation_id: result.invitation_id,
    invitee_email: result.invitee_email,
    profile_removed: result.profile_removed,
  };
}

export async function resendPendingMemberInvite(
  admin: SupabaseClient,
  memberId: string,
  leaderId: string
): Promise<{
  member_id: string;
  invitee_email: string;
  verification_link: string;
  test_onboarding_link: string;
  email_sent: boolean;
  email_transport: "supabase_auth" | "resend";
}> {
  const result = await resendTeamInvitation(admin, leaderId, {
    memberId,
  });

  return {
    member_id: result.member_id ?? memberId,
    invitee_email: result.invitee_email,
    verification_link: result.verification_link,
    test_onboarding_link: result.test_onboarding_link,
    email_sent: result.email_sent,
    email_transport: result.email_transport,
  };
}

export async function revokePendingMemberInvite(
  admin: SupabaseClient,
  memberId: string,
  leaderId: string
): Promise<{
  member_id: string;
  invitation_id: string | null;
  invitee_email: string;
  profile_removed: boolean;
  invitation_removed: boolean;
}> {
  const member = await assertManagedTeamMember(admin, memberId, leaderId);

  if (member.contract_accepted) {
    throw new Error("Aktif ekip üyeleri davet iptali ile kaldırılamaz.");
  }

  const email = member.email.trim().toLowerCase();
  let invitation = await findPendingInvitationForMember(
    admin,
    leaderId,
    member
  );

  if (!invitation && member.company_leader_id && member.company_leader_id !== leaderId) {
    invitation = await findPendingInvitationForMember(
      admin,
      member.company_leader_id,
      member
    );
  }

  let invitationRemoved = false;

  if (invitation) {
    const { error, count } = await admin
      .from(TEAM_INVITATIONS_TABLE)
      .delete({ count: "exact" })
      .eq("id", invitation.id);

    if (error) {
      throw new Error(`Davet silinemedi: ${error.message}`);
    }

    invitationRemoved = (count ?? 0) > 0;
  } else {
    const { error, count } = await admin
      .from(TEAM_INVITATIONS_TABLE)
      .delete({ count: "exact" })
      .eq("broker_id", leaderId)
      .eq("invitee_email", email)
      .eq("status", "pending");

    if (error) {
      throw new Error(`Davet silinemedi: ${error.message}`);
    }

    invitationRemoved = (count ?? 0) > 0;
  }

  const brokerScopeId = member.company_leader_id ?? leaderId;
  let profileRemoved = false;

  if (isRevocablePendingProfile(member, brokerScopeId)) {
    const { error: deleteProfileError } = await admin
      .from("profiles")
      .delete()
      .eq("id", member.id);

    if (deleteProfileError) {
      throw new Error(deleteProfileError.message);
    }

    await admin.auth.admin.deleteUser(member.id);
    profileRemoved = true;
  }

  if (!invitationRemoved && !profileRemoved) {
    throw new Error(
      `Bekleyen üye iptal edilemedi (profiles.id='${member.id}', davet veya profil silinemedi).`
    );
  }

  return {
    member_id: member.id,
    invitation_id: invitation?.id ?? null,
    invitee_email: member.email,
    profile_removed: profileRemoved,
    invitation_removed: invitationRemoved,
  };
}