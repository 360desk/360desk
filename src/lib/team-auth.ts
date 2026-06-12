import {
  isBrokerOwner,
  isFranchiseMaster,
  inferOfficeUserRole,
} from "@/lib/office-hierarchy";
import type { Profile } from "@/types/database";

export function isOfficeAdmin(
  profile: Pick<Profile, "organization_role"> | null | undefined
): boolean {
  return profile?.organization_role === "office_admin";
}

export function isOfficeStaff(
  profile: Pick<Profile, "organization_role"> | null | undefined
): boolean {
  return profile?.organization_role === "office_staff";
}

export function isCorporateTeamLeader(
  profile: Profile | null | undefined
): boolean {
  const role = inferOfficeUserRole(profile ?? null);
  return role === "franchise_master" || role === "broker_owner";
}

export { isFranchiseMaster, isBrokerOwner, inferOfficeUserRole };
