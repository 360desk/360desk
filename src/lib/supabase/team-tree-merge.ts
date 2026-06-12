import { createAdminClient } from "@/lib/supabase/admin-server";
import {
  TEAM_INVITATION_SELECT,
  TEAM_INVITATIONS_TABLE,
  type TeamInvitationRecord,
} from "@/lib/supabase/team-invitations-table";
import type { TeamInviteRole } from "@/types/office-hierarchy";
import type {
  BranchOfficeNode,
  EnterpriseTeamTree,
  TeamMember,
  TeamRowKind,
} from "@/types/team";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function resolveMemberRowKind(
  contractAccepted: boolean,
  invitationId?: string | null
): TeamRowKind {
  if (contractAccepted) {
    return "active_member";
  }

  return invitationId ? "pending_profile" : "pending_profile";
}

export function invitationToTeamMember(
  invitation: TeamInvitationRecord
): TeamMember {
  return {
    id: invitation.id,
    invitation_id: invitation.id,
    row_kind: "pending_invitation",
    email: invitation.invitee_email,
    phone: invitation.invitee_phone,
    full_name: null,
    account_origin: "self",
    user_role: invitation.target_role,
    is_suspended: false,
    contract_accepted: false,
    active_ad_count: 0,
    created_at: invitation.created_at ?? new Date().toISOString(),
  };
}

export function attachInvitationToMember(
  member: TeamMember,
  invitation: TeamInvitationRecord
): TeamMember {
  return {
    ...member,
    invitation_id: invitation.id,
    phone: member.phone ?? invitation.invitee_phone,
    row_kind: member.contract_accepted ? "active_member" : "pending_profile",
  };
}

export async function fetchPendingInvitationsForBroker(
  brokerId: string
): Promise<TeamInvitationRecord[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from(TEAM_INVITATIONS_TABLE)
    .select(TEAM_INVITATION_SELECT)
    .eq("broker_id", brokerId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TeamInvitationRecord[];
}

function findMemberIndexByEmail(members: TeamMember[], email: string): number {
  return members.findIndex(
    (member) => normalizeEmail(member.email) === normalizeEmail(email)
  );
}

function mergeAgentInvites(
  members: TeamMember[],
  invitations: TeamInvitationRecord[],
  targetRole: TeamInviteRole
): TeamMember[] {
  const next = [...members];
  const roleInvites = invitations.filter((inv) => inv.target_role === targetRole);

  for (const invitation of roleInvites) {
    const email = normalizeEmail(invitation.invitee_email);
    const existingIndex = findMemberIndexByEmail(next, email);

    if (existingIndex >= 0) {
      next[existingIndex] = attachInvitationToMember(
        next[existingIndex],
        invitation
      );
      continue;
    }

    next.push(invitationToTeamMember(invitation));
  }

  return next;
}

function mergeBranchInvites(
  branches: BranchOfficeNode[],
  invitations: TeamInvitationRecord[]
): BranchOfficeNode[] {
  const next = [...branches];
  const branchInvites = invitations.filter(
    (inv) => inv.target_role === "broker_owner"
  );

  for (const invitation of branchInvites) {
    const email = normalizeEmail(invitation.invitee_email);
    const existingIndex = findMemberIndexByEmail(next, email);

    if (existingIndex >= 0) {
      next[existingIndex] = {
        ...attachInvitationToMember(next[existingIndex], invitation),
        agents: next[existingIndex].agents,
      };
      continue;
    }

    next.push({
      ...invitationToTeamMember(invitation),
      agents: [],
    });
  }

  return next;
}

export function mergePendingInvitationsIntoTree(
  tree: EnterpriseTeamTree,
  invitations: TeamInvitationRecord[]
): EnterpriseTeamTree {
  if (invitations.length === 0) {
    return tree;
  }

  if (tree.view_mode === "broker_owner") {
    return {
      ...tree,
      office_agents: mergeAgentInvites(
        tree.office_agents,
        invitations,
        "office_agent"
      ),
    };
  }

  return {
    ...tree,
    hq_agents: mergeAgentInvites(tree.hq_agents, invitations, "office_agent"),
    branch_offices: mergeBranchInvites(tree.branch_offices, invitations),
  };
}

export function enrichTeamMemberRowKind(member: TeamMember): TeamMember {
  if (member.row_kind) {
    return member;
  }

  return {
    ...member,
    row_kind: resolveMemberRowKind(
      member.contract_accepted,
      member.invitation_id
    ),
  };
}

function memberMatchesRemovalTarget(
  member: TeamMember,
  target: {
    id?: string;
    email?: string;
    invitationId?: string | null;
  }
): boolean {
  if (
    target.invitationId &&
    (member.invitation_id === target.invitationId ||
      member.id === target.invitationId)
  ) {
    return true;
  }

  if (target.id && member.id === target.id) {
    return true;
  }

  if (
    target.email &&
    normalizeEmail(member.email) === normalizeEmail(target.email)
  ) {
    return true;
  }

  return false;
}

function filterRemovedMembers(
  members: TeamMember[],
  target: {
    id?: string;
    email?: string;
    invitationId?: string | null;
  }
): TeamMember[] {
  return members.filter((member) => !memberMatchesRemovalTarget(member, target));
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

export function removeMemberFromEnterpriseTree(
  tree: EnterpriseTeamTree,
  target: {
    id?: string;
    email?: string;
    invitationId?: string | null;
  }
): EnterpriseTeamTree {
  if (tree.view_mode === "broker_owner") {
    return {
      ...tree,
      office_agents: filterRemovedMembers(tree.office_agents, target),
    };
  }

  return {
    ...tree,
    hq_agents: filterRemovedMembers(tree.hq_agents, target),
    branch_offices: tree.branch_offices
      .filter((branch) => !memberMatchesRemovalTarget(branch, target))
      .map((branch) => ({
        ...branch,
        agents: filterRemovedMembers(branch.agents, target),
      })),
  };
}
