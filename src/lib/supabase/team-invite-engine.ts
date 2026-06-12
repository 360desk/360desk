import type { SupabaseClient } from "@supabase/supabase-js";
import { sendTeamInvitationEmail } from "@/lib/email/team-invite-mail";
import {
  inferOfficeUserRole,
  isTeamInviteRoleAllowed,
} from "@/lib/office-hierarchy";
import { validateTeamMemberQuota } from "@/lib/supabase/team-quota";
import {
  buildInvitationVerificationLink,
  buildTeamInvitationInsert,
  TEAM_INVITATION_SELECT,
  TEAM_INVITATIONS_TABLE,
  toPublicInvitationSummary,
  type TeamInvitationInsertPayload,
  type TeamInvitationRecord,
  type TeamInvitationType,
} from "@/lib/supabase/team-invitations-table";
import type { TeamInviteRole } from "@/types/office-hierarchy";
import type { Profile } from "@/types/database";

export type TeamInviteFlow =
  | "external_agent"
  | "internal_agent"
  | "office_branch";

export type TeamInviteMode =
  | "external_invited"
  | "internal_invited"
  | "office_invited";

export interface TeamInviteSuccess {
  success: true;
  mode: TeamInviteMode;
  flow: TeamInviteFlow;
  invitation: {
    id: string;
    invitee_email: string;
    status: string;
    created_at: string;
  };
  accept_path: string;
  verification_link: string;
  contract_pending: boolean;
}

export interface ExistingInviteeProfile {
  id: string;
  email: string;
  full_name: string | null;
  user_type: string | null;
  parent_office_id: string | null;
  company_leader_id: string | null;
  user_role: string | null;
  account_origin: string | null;
  contract_accepted?: boolean | null;
}

function buildInviteVerificationLink(invitationId: string): string {
  return buildInvitationVerificationLink(invitationId);
}

export function normalizeContactPhone(value: string | null | undefined): string {
  if (!value?.trim()) {
    return "";
  }

  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length >= 12) {
    return digits.slice(2);
  }

  if (digits.startsWith("0") && digits.length >= 11) {
    return digits.slice(1);
  }

  return digits;
}

function phonesMatch(
  left: string | null | undefined,
  right: string | null | undefined
): boolean {
  const normalizedLeft = normalizeContactPhone(left);
  const normalizedRight = normalizeContactPhone(right);

  return Boolean(
    normalizedLeft &&
      normalizedRight &&
      normalizedLeft === normalizedRight
  );
}

export async function findExistingInviteeProfile(
  admin: SupabaseClient,
  email: string,
  phone: string | null
): Promise<ExistingInviteeProfile | null> {
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail) {
    const { data: byEmail, error: emailError } = await admin
      .from("profiles")
      .select(
        "id, email, full_name, user_type, parent_office_id, company_leader_id, user_role, account_origin, contract_accepted"
      )
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (emailError) {
      throw new Error(emailError.message);
    }

    if (byEmail) {
      return byEmail as ExistingInviteeProfile;
    }
  }

  const normalizedPhone = normalizeContactPhone(phone);
  if (!normalizedPhone) {
    return null;
  }

  for (let page = 1; page <= 5; page += 1) {
    const { data: listData, error: listError } =
      await admin.auth.admin.listUsers({
        page,
        perPage: 200,
      });

    if (listError) {
      throw new Error(listError.message);
    }

    const users = listData?.users ?? [];
    const matchedUser = users.find((user) =>
      phonesMatch(
        typeof user.user_metadata?.phone === "string"
          ? user.user_metadata.phone
          : null,
        normalizedPhone
      )
    );

    if (matchedUser) {
      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select(
          "id, email, full_name, user_type, parent_office_id, company_leader_id, user_role, account_origin, contract_accepted"
        )
        .eq("id", matchedUser.id)
        .maybeSingle();

      if (profileError) {
        throw new Error(profileError.message);
      }

      if (profile) {
        return profile as ExistingInviteeProfile;
      }

      return {
        id: matchedUser.id,
        email: matchedUser.email ?? normalizedEmail,
        full_name:
          typeof matchedUser.user_metadata?.full_name === "string"
            ? matchedUser.user_metadata.full_name
            : null,
        user_type: "individual",
        parent_office_id: null,
        company_leader_id: null,
        user_role: null,
        account_origin: "self",
      };
    }

    if (users.length < 200) {
      break;
    }
  }

  return null;
}

async function findAuthUserByEmail(
  admin: SupabaseClient,
  email: string
): Promise<{ id: string; email: string } | null> {
  const normalizedEmail = email.trim().toLowerCase();

  for (let page = 1; page <= 5; page += 1) {
    const { data: listData, error: listError } =
      await admin.auth.admin.listUsers({
        page,
        perPage: 200,
      });

    if (listError) {
      throw new Error(listError.message);
    }

    const users = listData?.users ?? [];
    const matchedUser = users.find(
      (user) => user.email?.trim().toLowerCase() === normalizedEmail
    );

    if (matchedUser) {
      return {
        id: matchedUser.id,
        email: matchedUser.email ?? normalizedEmail,
      };
    }

    if (users.length < 200) {
      break;
    }
  }

  return null;
}

async function platformAccountExists(
  admin: SupabaseClient,
  email: string,
  phone: string | null
): Promise<boolean> {
  const profile = await findExistingInviteeProfile(admin, email, phone);
  if (profile) {
    return true;
  }

  const authUser = await findAuthUserByEmail(admin, email);
  return Boolean(authUser);
}

function validateExistingInviteeEligibility(
  invitee: ExistingInviteeProfile,
  brokerId: string
): { ok: true } | { ok: false; error: string } {
  if (invitee.id === brokerId) {
    return { ok: false, error: "Kendi hesabınıza davet gönderemezsiniz." };
  }

  const belongsToThisBroker =
    invitee.company_leader_id === brokerId ||
    invitee.parent_office_id === brokerId;

  if (belongsToThisBroker && invitee.contract_accepted) {
    return { ok: false, error: "Bu danışman zaten ekibinize bağlı." };
  }

  return { ok: true };
}

async function insertTeamInvitation(
  admin: SupabaseClient,
  payload: TeamInvitationInsertPayload
): Promise<TeamInvitationRecord> {
  const { data: existingInvite } = await admin
    .from(TEAM_INVITATIONS_TABLE)
    .select(TEAM_INVITATION_SELECT)
    .eq("broker_id", payload.broker_id)
    .eq("invitee_email", payload.invitee_email)
    .eq("status", "pending")
    .maybeSingle();

  if (existingInvite) {
    await sendTeamInvitationEmail(admin, existingInvite as TeamInvitationRecord);
    return existingInvite as TeamInvitationRecord;
  }

  const { data: invitation, error } = await admin
    .from(TEAM_INVITATIONS_TABLE)
    .insert(payload)
    .select(TEAM_INVITATION_SELECT)
    .single();

  if (error || !invitation) {
    throw new Error(error?.message ?? "Davet kaydı oluşturulamadı.");
  }

  const record = invitation as TeamInvitationRecord;
  await sendTeamInvitationEmail(admin, record);

  return record;
}

function buildInviteSuccess(
  flow: TeamInviteFlow,
  mode: TeamInviteMode,
  invitation: TeamInvitationRecord
): TeamInviteSuccess {
  return {
    success: true,
    flow,
    mode,
    invitation: toPublicInvitationSummary(invitation),
    accept_path: buildInviteVerificationLink(invitation.id),
    verification_link: buildInviteVerificationLink(invitation.id),
    contract_pending: true,
  };
}

async function createExternalAgentInvitation(
  admin: SupabaseClient,
  params: {
    brokerId: string;
    email: string;
    phone: string | null;
  }
): Promise<TeamInviteSuccess> {
  const exists = await platformAccountExists(
    admin,
    params.email,
    params.phone
  );

  if (exists) {
    throw new Error(
      "Bu e-posta veya telefon sistemde kayıtlı. Lütfen “Mevcut Kayıtlı Danışmanı Ofise Davet Et” akışını kullanın."
    );
  }

  const invitation = await insertTeamInvitation(
    admin,
    buildTeamInvitationInsert({
      brokerId: params.brokerId,
      inviteeEmail: params.email,
      inviteePhone: params.phone,
      inviteType: "agent",
      targetRole: "office_agent",
    })
  );

  return buildInviteSuccess("external_agent", "external_invited", invitation);
}

async function createInternalAgentInvitation(
  admin: SupabaseClient,
  params: {
    brokerId: string;
    email: string;
    phone: string | null;
  }
): Promise<TeamInviteSuccess> {
  const invitee = await findExistingInviteeProfile(
    admin,
    params.email,
    params.phone
  );

  if (!invitee) {
    throw new Error(
      "Bu e-posta veya telefon ile kayıtlı danışman bulunamadı. Sistem dışı davet akışını kullanın."
    );
  }

  const eligibility = validateExistingInviteeEligibility(
    invitee,
    params.brokerId
  );

  if (!eligibility.ok) {
    throw new Error(eligibility.error);
  }

  const invitation = await insertTeamInvitation(
    admin,
    buildTeamInvitationInsert({
      brokerId: params.brokerId,
      inviteeEmail: invitee.email,
      inviteePhone: params.phone ?? null,
      inviteType: "agent",
      targetRole: "office_agent",
    })
  );

  return buildInviteSuccess("internal_agent", "internal_invited", invitation);
}

async function createOfficeBranchInvitation(
  admin: SupabaseClient,
  params: {
    brokerId: string;
    email: string;
    phone: string | null;
  }
): Promise<TeamInviteSuccess> {
  const exists = await platformAccountExists(
    admin,
    params.email,
    params.phone
  );

  if (exists) {
    throw new Error(
      "Bu e-posta veya telefon zaten platformda kayıtlı. Alt ofis daveti yalnızca yeni broker adayları içindir."
    );
  }

  const invitation = await insertTeamInvitation(
    admin,
    buildTeamInvitationInsert({
      brokerId: params.brokerId,
      inviteeEmail: params.email,
      inviteePhone: params.phone,
      inviteType: "office",
      targetRole: "broker_owner",
    })
  );

  return buildInviteSuccess("office_branch", "office_invited", invitation);
}

function resolveFlowTargetRole(flow: TeamInviteFlow): TeamInviteRole {
  return flow === "office_branch" ? "broker_owner" : "office_agent";
}

function assertFlowAllowed(profile: Profile, flow: TeamInviteFlow): void {
  const targetRole = resolveFlowTargetRole(flow);

  if (!isTeamInviteRoleAllowed(profile, targetRole)) {
    const leaderRole = inferOfficeUserRole(profile);
    throw new Error(
      leaderRole === "franchise_master"
        ? "Franchise master hesapları danışman ve alt ofis daveti oluşturabilir."
        : "Broker hesapları yalnızca danışman daveti oluşturabilir."
    );
  }

  if (flow === "office_branch" && inferOfficeUserRole(profile) !== "franchise_master") {
    throw new Error(
      "Alt ofis / şube daveti yalnızca franchise master hesapları tarafından gönderilebilir."
    );
  }
}

export async function processSegmentedTeamInvite(input: {
  admin: SupabaseClient;
  brokerId: string;
  profile: Profile;
  flow: TeamInviteFlow;
  email: string;
  fullName: string;
  phone: string | null;
}): Promise<TeamInviteSuccess> {
  void input.fullName;

  assertFlowAllowed(input.profile, input.flow);

  const targetRole = resolveFlowTargetRole(input.flow);
  const quotaValidation = await validateTeamMemberQuota(
    input.admin,
    input.profile,
    input.brokerId,
    targetRole
  );

  if (!quotaValidation.ok) {
    throw new Error(quotaValidation.error);
  }

  const normalizedEmail = input.email.trim().toLowerCase();

  switch (input.flow) {
    case "external_agent":
      return createExternalAgentInvitation(input.admin, {
        brokerId: input.brokerId,
        email: normalizedEmail,
        phone: input.phone,
      });
    case "internal_agent":
      return createInternalAgentInvitation(input.admin, {
        brokerId: input.brokerId,
        email: normalizedEmail,
        phone: input.phone,
      });
    case "office_branch":
      return createOfficeBranchInvitation(input.admin, {
        brokerId: input.brokerId,
        email: normalizedEmail,
        phone: input.phone,
      });
    default:
      throw new Error("Geçersiz davet akışı.");
  }
}

/** @deprecated Use processSegmentedTeamInvite */
export async function processHybridTeamInvite(input: {
  admin: SupabaseClient;
  brokerId: string;
  profile: Profile;
  email: string;
  fullName: string;
  phone: string | null;
  inviteRole?: TeamInviteRole;
  inviteType?: TeamInvitationType;
  targetRole?: TeamInviteRole;
  password?: string;
}): Promise<TeamInviteSuccess> {
  const flow: TeamInviteFlow =
    input.inviteType === "office" || input.targetRole === "broker_owner"
      ? "office_branch"
      : "external_agent";

  return processSegmentedTeamInvite({
    admin: input.admin,
    brokerId: input.brokerId,
    profile: input.profile,
    flow,
    email: input.email,
    fullName: input.fullName,
    phone: input.phone,
  });
}

export type { TeamInvitationType };
