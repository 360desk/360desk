import type { SupabaseClient } from "@supabase/supabase-js";
import {
  inferOfficeUserRole,
  isBrokerOwner,
  isFranchiseMaster,
  resolveTeamInviteRole,
} from "@/lib/office-hierarchy";
import {
  hasTeamManagementAccess,
  resolveProfileQuotaDefaults,
} from "@/lib/subscription-packages";
import { resolveProfileSubscriptionTier } from "@/lib/supabase/profile-quota";
import { TEAM_INVITATIONS_TABLE } from "@/lib/supabase/team-invitations-table";
import type { Profile } from "@/types/database";
import type { TeamInviteRole } from "@/types/office-hierarchy";
import type { TeamQuotaSnapshot } from "@/types/subscription-tier";


export function formatTeamQuotaFullMessage(
  totalReserved: number,
  maxTeamMembers: number
): string {
  return `Ekip kotanız (${totalReserved}/${maxTeamMembers}) dolmuştur. Lütfen paketinizi yükseltin.`;
}

export async function countOfficeTeamMembers(
  supabase: SupabaseClient,
  brokerId: string,
  childRole: TeamInviteRole
): Promise<number> {
  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("company_leader_id", brokerId)
    .eq("user_role", childRole);

  if (!error && typeof count === "number") {
    return count;
  }

  if (childRole === "office_agent") {
    const { count: legacyCount, error: legacyError } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("parent_office_id", brokerId)
      .eq("user_type", "office_staff");

    if (legacyError) {
      console.error("countOfficeTeamMembers:", legacyError.message);
      return 0;
    }

    return legacyCount ?? 0;
  }

  return 0;
}

export async function countPendingTeamInvitations(
  supabase: SupabaseClient,
  brokerId: string,
  targetRole: TeamInviteRole
): Promise<number> {
  const { count, error } = await supabase
    .from(TEAM_INVITATIONS_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("broker_id", brokerId)
    .eq("target_role", targetRole)
    .eq("status", "pending");

  if (error) {
    console.error("countPendingTeamInvitations:", error.message);
    return 0;
  }

  return count ?? 0;
}

export function resolveMaxTeamMembers(profile: Profile | null): number {
  const tier = resolveProfileSubscriptionTier(profile);
  const tierQuota = resolveProfileQuotaDefaults(tier).maxTeamMembers;

  if (tierQuota > 0) {
    return tierQuota;
  }

  if (isBrokerOwner(profile)) {
    return resolveProfileQuotaDefaults("bagimsiz_ofis").maxTeamMembers;
  }

  if (isFranchiseMaster(profile)) {
    return resolveProfileQuotaDefaults("enterprise_franchise").maxTeamMembers;
  }

  return 0;
}

function profileCanManageTeamMembers(profile: Profile | null): boolean {
  return (
    hasTeamManagementAccess(profile?.subscription_tier) ||
    isBrokerOwner(profile) ||
    isFranchiseMaster(profile)
  );
}

export async function countFranchiseNetworkMembers(
  supabase: SupabaseClient,
  masterId: string
): Promise<number> {
  const [branchCount, hqAgentCount] = await Promise.all([
    countOfficeTeamMembers(supabase, masterId, "broker_owner"),
    countOfficeTeamMembers(supabase, masterId, "office_agent"),
  ]);

  return branchCount + hqAgentCount;
}

export async function fetchTeamQuotaSnapshot(
  supabase: SupabaseClient,
  profile: Profile | null,
  brokerId: string,
  inviteRoleOverride?: TeamInviteRole | null
): Promise<TeamQuotaSnapshot> {
  const subscriptionTier = resolveProfileSubscriptionTier(profile);
  const maxTeamMembers = resolveMaxTeamMembers(profile);
  const leaderRole = inferOfficeUserRole(profile);
  const inviteRole = inviteRoleOverride ?? resolveTeamInviteRole(profile);
  const roleCount = inviteRole
    ? await countOfficeTeamMembers(supabase, brokerId, inviteRole)
    : 0;
  const pendingTeamSize = inviteRole
    ? await countPendingTeamInvitations(supabase, brokerId, inviteRole)
    : 0;
  const totalReservedTeamSize = roleCount + pendingTeamSize;

  return {
    subscriptionTier,
    maxTeamMembers,
    currentTeamSize: roleCount,
    pendingTeamSize,
    totalReservedTeamSize,
    canAddTeamMember:
      profileCanManageTeamMembers(profile) &&
      Boolean(inviteRole) &&
      totalReservedTeamSize < maxTeamMembers,
  };
}

export async function validateTeamMemberQuota(
  supabase: SupabaseClient,
  profile: Profile | null,
  brokerId: string,
  inviteRole?: TeamInviteRole
): Promise<{ ok: true } | { ok: false; error: string }> {
  const expectedRole = inviteRole ?? resolveTeamInviteRole(profile);

  if (!expectedRole) {
    return {
      ok: false,
      error: "Bu hesap için ekip daveti yetkisi bulunmuyor.",
    };
  }

  const quota = await fetchTeamQuotaSnapshot(
    supabase,
    profile,
    brokerId,
    expectedRole
  );

  if (!profileCanManageTeamMembers(profile)) {
    return {
      ok: false,
      error:
        "Ekip yönetimi ve alt danışman ekleme özellikleri yalnızca Kurumsal Ofis ve Franchise paketlerinde mevcuttur.",
    };
  }

  if (!quota.canAddTeamMember) {
    return {
      ok: false,
      error: formatTeamQuotaFullMessage(
        quota.totalReservedTeamSize,
        quota.maxTeamMembers
      ),
    };
  }

  return { ok: true };
}

export function profileHasTeamAccess(profile: Profile | null): boolean {
  return profileCanManageTeamMembers(profile);
}
