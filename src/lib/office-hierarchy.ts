import { normalizeSubscriptionTier } from "@/lib/subscription-packages";
import type { Profile } from "@/types/database";
import type { OfficeUserRole, TeamInviteRole } from "@/types/office-hierarchy";
import type { SubscriptionTier } from "@/types/subscription-tier";

const OFFICE_USER_ROLES = new Set<OfficeUserRole>([
  "franchise_master",
  "broker_owner",
  "office_agent",
]);

export function isOfficeUserRole(
  value: string | null | undefined
): value is OfficeUserRole {
  return (
    typeof value === "string" &&
    OFFICE_USER_ROLES.has(value as OfficeUserRole)
  );
}

export function normalizeOfficeUserRole(
  value: string | null | undefined
): OfficeUserRole | null {
  if (isOfficeUserRole(value)) {
    return value;
  }

  return null;
}

export function resolveOfficeUserRoleFromTier(
  tier: SubscriptionTier
): OfficeUserRole {
  if (tier === "enterprise_franchise") {
    return "franchise_master";
  }

  if (tier === "bagimsiz_ofis") {
    return "broker_owner";
  }

  return "office_agent";
}

export function inferOfficeUserRole(profile: Profile | null): OfficeUserRole | null {
  const explicit = normalizeOfficeUserRole(profile?.user_role);
  if (explicit) {
    return explicit;
  }

  const tier = normalizeSubscriptionTier(profile?.subscription_tier);

  if (tier === "enterprise_franchise" && !profile?.company_leader_id) {
    return "franchise_master";
  }

  if (isIndependentOfficeBrokerProfile(profile)) {
    return "broker_owner";
  }

  if (profile?.company_leader_id) {
    return "office_agent";
  }

  return null;
}

export function isIndependentOfficeBrokerProfile(
  profile: Profile | null | undefined
): boolean {
  if (!profile || profile.company_leader_id) {
    return false;
  }

  if (profile.is_independent_office) {
    return true;
  }

  if (profile.organization_role === "office_admin") {
    return true;
  }

  const tier = normalizeSubscriptionTier(profile.subscription_tier);
  return tier === "bagimsiz_ofis";
}

export function isFranchiseMaster(
  profile: Profile | null | undefined
): boolean {
  return inferOfficeUserRole(profile ?? null) === "franchise_master";
}

export function isBrokerOwner(
  profile: Profile | null | undefined
): boolean {
  return inferOfficeUserRole(profile ?? null) === "broker_owner";
}

export function canInviteBrokerOwners(
  profile: Profile | null | undefined
): boolean {
  return isFranchiseMaster(profile);
}

export function canInviteOfficeAgents(
  profile: Profile | null | undefined
): boolean {
  return isBrokerOwner(profile) || isFranchiseMaster(profile);
}

export function canInviteHqOfficeAgents(
  profile: Profile | null | undefined
): boolean {
  return isFranchiseMaster(profile);
}

export function isTeamInviteRoleAllowed(
  profile: Profile | null | undefined,
  inviteRole: TeamInviteRole
): boolean {
  if (inviteRole === "broker_owner") {
    return canInviteBrokerOwners(profile);
  }

  if (inviteRole === "office_agent") {
    return canInviteOfficeAgents(profile);
  }

  return false;
}

export function resolveTeamInviteRole(
  profile: Profile | null | undefined
): TeamInviteRole | null {
  if (canInviteBrokerOwners(profile)) {
    return "broker_owner";
  }

  if (canInviteOfficeAgents(profile)) {
    return "office_agent";
  }

  return null;
}

export function getOfficeUserRoleLabel(role: string | null | undefined): string {
  switch (role) {
    case "franchise_master":
      return "Franchise Master";
    case "broker_owner":
      return "Broker / Şube Yöneticisi";
    case "office_agent":
      return "Alt Danışman";
    default:
      return "Danışman";
  }
}

export function resolveOfficeUserRoleOnUpgrade(
  tier: SubscriptionTier
): OfficeUserRole | null {
  if (tier === "enterprise_franchise") {
    return "franchise_master";
  }

  if (tier === "bagimsiz_ofis") {
    return "broker_owner";
  }

  return null;
}

export type TeamManagementViewMode = "franchise_master" | "broker_owner";

export interface TeamManagementViewConfig {
  viewMode: TeamManagementViewMode;
  pageTitle: string;
  pageSubtitle: string;
  sectionTitle: string;
  inviteButtonLabel: string;
  statLabel: string;
  leaderLabel: string;
  memberColumnLabel: string;
  emptyMessage: string;
  emptyHint: string;
}

export function getTeamManagementViewConfig(
  profile: Profile | null
): TeamManagementViewConfig | null {
  const role = inferOfficeUserRole(profile);

  if (role === "franchise_master") {
    return {
      viewMode: "franchise_master",
      pageTitle: "Franchise ve Şube Yönetimi",
      pageSubtitle:
        "Franchise ağınızdaki alt ofis ve şube brokerlarını yönetin, portföy devri yapın.",
      sectionTitle: "Alt Ofisler ve Şubeler",
      inviteButtonLabel: "Yeni Alt Ofis / Şube Davet Et",
      statLabel: "Aktif Şube",
      leaderLabel: "Franchise Master",
      memberColumnLabel: "Alt Ofis / Şube",
      emptyMessage: "Henüz franchise ağınıza bağlı alt ofis bulunmuyor.",
      emptyHint:
        "Yeni Alt Ofis / Şube Davet Et ile şube broker hesabı oluşturun.",
    };
  }

  if (role === "broker_owner") {
    return {
      viewMode: "broker_owner",
      pageTitle: "Ekip & Kadro Yönetimi",
      pageSubtitle:
        "Alt danışmanlarınızı yönetin, davet edin ve ilan devri ile güvenli şekilde ofisten çıkarın.",
      sectionTitle: "Ofis Danışmanları",
      inviteButtonLabel: "Danışman Davet Et",
      statLabel: "Aktif Danışman",
      leaderLabel: "Broker",
      memberColumnLabel: "Danışman",
      emptyMessage: "Henüz ofisinize bağlı danışman bulunmuyor.",
      emptyHint: "Danışman Davet Et ile yeni ekip üyesi oluşturun.",
    };
  }

  return null;
}
