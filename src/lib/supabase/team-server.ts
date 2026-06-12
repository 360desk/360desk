import { createAdminClient } from "@/lib/supabase/admin-server";
import { getSessionProfile } from "@/lib/supabase/auth-server";
import { executeOfficeForcedTransfer } from "@/lib/supabase/listing-transfer";
import {
  TEAM_MANAGEMENT_UPGRADE_MESSAGE,
  normalizeSubscriptionTier,
} from "@/lib/subscription-packages";
import {
  inferOfficeUserRole,
  resolveTeamInviteRole,
} from "@/lib/office-hierarchy";
import { profileHasTeamAccess } from "@/lib/supabase/team-quota";
import type { TeamInviteRole } from "@/types/office-hierarchy";
import type { Profile } from "@/types/database";
import {
  enrichTeamMemberRowKind,
  fetchPendingInvitationsForBroker,
  mergePendingInvitationsIntoTree,
} from "@/lib/supabase/team-tree-merge";
import type { TeamMember, EnterpriseTeamTree, BranchOfficeNode } from "@/types/team";

const PROFILE_TEAM_SELECT =
  "id, email, full_name, user_type, account_origin, created_at, user_role, is_suspended, company_leader_id, parent_office_id, contract_accepted";

type RawStaffRow = {
  id: string;
  email: string;
  full_name: string | null;
  user_type: string | null;
  account_origin: TeamMember["account_origin"];
  created_at: string;
  user_role?: string | null;
  is_suspended?: boolean | null;
  company_leader_id?: string | null;
  parent_office_id?: string | null;
  contract_accepted?: boolean | null;
};

function resolveRowLeaderId(row: RawStaffRow): string | null {
  return row.company_leader_id ?? row.parent_office_id ?? null;
}

function rowMatchesDirectRole(
  row: RawStaffRow,
  leaderId: string,
  role: TeamInviteRole
): boolean {
  if (resolveRowLeaderId(row) !== leaderId) {
    return false;
  }

  if (row.user_role === role) {
    return true;
  }

  if (row.user_role) {
    return false;
  }

  if (role === "office_agent") {
    return row.user_type === "office_staff";
  }

  if (role === "broker_owner") {
    return row.user_type === "office_admin";
  }

  return false;
}

function filterRowsByDirectRole(
  rows: RawStaffRow[],
  leaderId: string,
  role: TeamInviteRole
): RawStaffRow[] {
  return rows.filter((row) => rowMatchesDirectRole(row, leaderId, role));
}

export async function requireCorporateTeamBroker(): Promise<
  | { ok: true; brokerId: string; profile: Profile; email?: string }
  | { ok: false; error: string; status: number }
> {
  const { user, profile } = await getSessionProfile();

  if (!user || !profile) {
    return { ok: false, error: "Oturum bulunamadı.", status: 401 };
  }

  if (!profileHasTeamAccess(profile)) {
    return {
      ok: false,
      error: TEAM_MANAGEMENT_UPGRADE_MESSAGE,
      status: 403,
    };
  }

  const leaderRole = inferOfficeUserRole(profile);
  const canManageTeam =
    leaderRole === "franchise_master" || leaderRole === "broker_owner";

  if (!canManageTeam) {
    return {
      ok: false,
      error: "Bu işlem yalnızca franchise master veya broker hesapları tarafından yapılabilir.",
      status: 403,
    };
  }

  return {
    ok: true,
    brokerId: user.id,
    profile,
    email: user.email,
  };
}

/** @deprecated Use requireCorporateTeamBroker */
export async function requireOfficeAdmin(): Promise<
  | { ok: true; brokerId: string; profile: Profile; email?: string }
  | { ok: false; error: string; status: number }
> {
  return requireCorporateTeamBroker();
}

async function fetchRawStaffUnderLeader(
  leaderId: string,
  userRole?: TeamInviteRole
): Promise<RawStaffRow[]> {
  const admin = createAdminClient();

  let query = admin
    .from("profiles")
    .select(PROFILE_TEAM_SELECT)
    .eq("company_leader_id", leaderId)
    .order("created_at", { ascending: true });

  if (userRole) {
    query = query.eq("user_role", userRole);
  }

  const extended = await query;

  if (extended.error?.message.includes("does not exist")) {
    const legacy = await admin
      .from("profiles")
      .select(
        "id, email, full_name, user_type, account_origin, created_at, parent_office_id"
      )
      .eq("parent_office_id", leaderId)
      .order("created_at", { ascending: true });

    if (legacy.error) {
      throw new Error(legacy.error.message);
    }

    const legacyRows = (legacy.data ?? []) as RawStaffRow[];

    if (!userRole) {
      return legacyRows;
    }

    return filterRowsByDirectRole(legacyRows, leaderId, userRole);
  }

  if (extended.error) {
    throw new Error(extended.error.message);
  }

  const rows = (extended.data ?? []) as RawStaffRow[];

  if (!userRole) {
    return rows;
  }

  return filterRowsByDirectRole(rows, leaderId, userRole);
}

async function mapRowsToTeamMembers(
  rows: RawStaffRow[],
  leaderProfile: Profile | null,
  defaultRole: TeamInviteRole = "office_agent"
): Promise<TeamMember[]> {
  if (rows.length === 0) {
    return [];
  }

  const admin = createAdminClient();
  const leaderRole = inferOfficeUserRole(leaderProfile);

  const { data: adCounts, error: countError } = await admin
    .from("classified_ads")
    .select("managed_by_id, owner_id, vendor_id")
    .in("visibility_mode", ["public", "internal_mls"])
    .eq("status", "approved")
    .eq("is_archived", false);

  if (countError) {
    throw new Error(countError.message);
  }

  return rows.map((member) => {
    let activeAdCount = 0;

    if (leaderRole === "franchise_master" && member.user_role === "broker_owner") {
      activeAdCount =
        adCounts?.filter((row) => {
          const managedById = row.managed_by_id as string | null;
          const ownerId = row.owner_id as string | null;
          const vendorId = row.vendor_id as string | null;
          return (
            managedById === member.id ||
            ownerId === member.id ||
            vendorId === member.id
          );
        }).length ?? 0;
    } else {
      activeAdCount =
        adCounts?.filter((row) => row.managed_by_id === member.id).length ?? 0;
    }

    return {
      id: member.id,
      invitation_id: null,
      row_kind: member.contract_accepted ? "active_member" : "pending_profile",
      email: member.email,
      full_name: member.full_name,
      phone: null,
      account_origin: member.account_origin,
      user_role: member.user_role ?? defaultRole,
      is_suspended: Boolean(member.is_suspended),
      contract_accepted: Boolean(member.contract_accepted),
      active_ad_count: activeAdCount,
      created_at: member.created_at,
    };
  });
}

export function flattenEnterpriseTree(tree: EnterpriseTeamTree): TeamMember[] {
  if (tree.view_mode === "broker_owner") {
    return tree.office_agents.map(enrichTeamMemberRowKind);
  }

  const nestedAgents = tree.branch_offices.flatMap((branch) => branch.agents);
  return [
    ...tree.hq_agents,
    ...tree.branch_offices,
    ...nestedAgents,
  ].map(enrichTeamMemberRowKind);
}

export async function fetchEnterpriseTeamTree(
  leaderId: string,
  leaderProfile: Profile | null
): Promise<EnterpriseTeamTree> {
  const leaderRole = inferOfficeUserRole(leaderProfile);

  if (leaderRole === "broker_owner") {
    const rows = await fetchRawStaffUnderLeader(leaderId, "office_agent");
    const office_agents = await mapRowsToTeamMembers(
      filterRowsByDirectRole(rows, leaderId, "office_agent"),
      leaderProfile,
      "office_agent"
    );

    const pending = await fetchPendingInvitationsForBroker(leaderId);
    return mergePendingInvitationsIntoTree(
      {
        view_mode: "broker_owner",
        hq_agents: [],
        branch_offices: [],
        office_agents,
      },
      pending
    );
  }

  if (leaderRole === "franchise_master") {
    const [hqRows, branchRows] = await Promise.all([
      fetchRawStaffUnderLeader(leaderId, "office_agent"),
      fetchRawStaffUnderLeader(leaderId, "broker_owner"),
    ]);

    const hqFiltered = filterRowsByDirectRole(hqRows, leaderId, "office_agent");
    const branchFiltered = filterRowsByDirectRole(
      branchRows,
      leaderId,
      "broker_owner"
    );
    const hqIds = new Set(hqFiltered.map((row) => row.id));

    const hq_agents = await mapRowsToTeamMembers(
      hqFiltered,
      leaderProfile,
      "office_agent"
    );
    const branchMembers = await mapRowsToTeamMembers(
      branchFiltered.filter((row) => !hqIds.has(row.id)),
      leaderProfile,
      "broker_owner"
    );

    const branch_offices: BranchOfficeNode[] = await Promise.all(
      branchMembers.map(async (branch) => {
        const agentRows = await fetchRawStaffUnderLeader(branch.id, "office_agent");
        const agents = await mapRowsToTeamMembers(
          filterRowsByDirectRole(agentRows, branch.id, "office_agent").filter(
            (row) => !hqIds.has(row.id)
          ),
          leaderProfile,
          "office_agent"
        );
        return { ...branch, agents };
      })
    );

    const pending = await fetchPendingInvitationsForBroker(leaderId);
    return mergePendingInvitationsIntoTree(
      {
        view_mode: "franchise_master",
        hq_agents,
        branch_offices,
        office_agents: [],
      },
      pending
    );
  }

  return {
    view_mode: "broker_owner",
    hq_agents: [],
    branch_offices: [],
    office_agents: [],
  };
}

export async function fetchOfficeTeamMembers(
  brokerId: string,
  leaderProfile: Profile | null
): Promise<TeamMember[]> {
  const tree = await fetchEnterpriseTeamTree(brokerId, leaderProfile);
  return flattenEnterpriseTree(tree);
}

export async function deactivateOfficeAgent(
  brokerId: string,
  staffId: string
): Promise<{ staff_id: string; suspended: boolean }> {
  const admin = createAdminClient();

  const { data: staff, error: staffError } = await admin
    .from("profiles")
    .select("id, company_leader_id, parent_office_id, user_role, is_suspended")
    .eq("id", staffId)
    .maybeSingle();

  if (staffError) {
    throw new Error(staffError.message);
  }

  const belongsToBroker =
    staff?.company_leader_id === brokerId ||
    staff?.parent_office_id === brokerId;

  if (!staff || !belongsToBroker) {
    throw new Error("Danışman bulunamadı veya ofise bağlı değil.");
  }

  const { count: activeListings, error: listingError } = await admin
    .from("classified_ads")
    .select("id", { count: "exact", head: true })
    .eq("managed_by_id", staffId)
    .eq("is_archived", false)
    .neq("status", "rejected");

  if (listingError) {
    throw new Error(listingError.message);
  }

  if ((activeListings ?? 0) > 0) {
    throw new Error(
      "Danışmanın aktif portföyleri var. Önce portföyleri transfer edin."
    );
  }

  const profilePayload = {
    is_suspended: true,
    user_role: "office_agent_inactive",
    updated_at: new Date().toISOString(),
  };

  const { error: profileError } = await admin
    .from("profiles")
    .update(profilePayload)
    .eq("id", staffId);

  if (profileError?.message.includes("does not exist")) {
    const { error: fallbackError } = await admin
      .from("profiles")
      .update({ updated_at: profilePayload.updated_at })
      .eq("id", staffId);

    if (fallbackError) {
      throw new Error(fallbackError.message);
    }
  } else if (profileError) {
    throw new Error(profileError.message);
  }

  await admin.auth.admin.updateUserById(staffId, {
    ban_duration: "876000h",
  });

  return { staff_id: staffId, suspended: true };
}

async function detachExternalInviteStaff(
  brokerId: string,
  staffId: string,
  transferToId: string
) {
  const admin = createAdminClient();

  const { data: staff, error: staffError } = await admin
    .from("profiles")
    .select("id, parent_office_id, account_origin")
    .eq("id", staffId)
    .maybeSingle();

  if (staffError) {
    throw new Error(staffError.message);
  }

  if (
    !staff ||
    staff.parent_office_id !== brokerId ||
    staff.account_origin !== "self"
  ) {
    throw new Error("Danışman bulunamadı veya dış davet profili değil.");
  }

  const { data: officeManagedListings, error: listingsError } = await admin
    .from("classified_ads")
    .update({
      managed_by_id: transferToId,
      updated_at: new Date().toISOString(),
    })
    .eq("managed_by_id", staffId)
    .eq("owner_id", brokerId)
    .select("id");

  if (listingsError) {
    throw new Error(listingsError.message);
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      user_type: "individual",
      parent_office_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", staffId);

  if (profileError) {
    throw new Error(profileError.message);
  }

  return {
    staff_id: staffId,
    transfer_to_id: transferToId,
    account_origin: "self" as const,
    transferred_ads: officeManagedListings?.length ?? 0,
    suspended: false,
    forced_transfer_blocked: true,
  };
}

export async function dismissOfficeStaff(
  brokerId: string,
  staffId: string,
  transferToId: string
) {
  const admin = createAdminClient();

  const { data: staff, error: staffError } = await admin
    .from("profiles")
    .select("id, parent_office_id, account_origin")
    .eq("id", staffId)
    .maybeSingle();

  if (staffError) {
    throw new Error(staffError.message);
  }

  if (!staff || staff.parent_office_id !== brokerId) {
    throw new Error("Danışman bulunamadı veya ofise bağlı değil.");
  }

  if (staff.account_origin === "self") {
    return detachExternalInviteStaff(brokerId, staffId, transferToId);
  }

  const transferResult = await executeOfficeForcedTransfer(
    admin,
    brokerId,
    staffId,
    transferToId
  );

  await admin.auth.admin.updateUserById(staffId, {
    ban_duration: "876000h",
  });

  return {
    staff_id: staffId,
    transfer_to_id: transferToId,
    account_origin: "created_by_office" as const,
    transferred_ads: transferResult.transferred_count,
    suspended: true,
    listing_ids: transferResult.listing_ids,
  };
}
