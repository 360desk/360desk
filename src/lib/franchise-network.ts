import type { SupabaseClient } from "@supabase/supabase-js";
import { buildMultiIdOwnershipScopeFilter } from "@/lib/supabase/ownership";

export interface FranchiseBranchOffice {
  id: string;
  full_name: string | null;
  email: string;
  company_name: string | null;
  agent_ids: string[];
}

export interface FranchiseNetworkSnapshot {
  master_id: string;
  branches: FranchiseBranchOffice[];
  network_scope_ids: string[];
}

export async function fetchFranchiseBranchOffices(
  supabase: SupabaseClient,
  masterId: string
): Promise<FranchiseBranchOffice[]> {
  const { data: branches, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, company_name")
    .eq("company_leader_id", masterId)
    .eq("user_role", "broker_owner")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const branchRows = branches ?? [];
  if (branchRows.length === 0) {
    return [];
  }

  const branchIds = branchRows.map((branch) => branch.id as string);

  const { data: agents, error: agentsError } = await supabase
    .from("profiles")
    .select("id, company_leader_id")
    .in("company_leader_id", branchIds)
    .eq("user_role", "office_agent");

  if (agentsError) {
    throw new Error(agentsError.message);
  }

  const agentsByBranch = new Map<string, string[]>();
  for (const agent of agents ?? []) {
    const branchId = agent.company_leader_id as string;
    const list = agentsByBranch.get(branchId) ?? [];
    list.push(agent.id as string);
    agentsByBranch.set(branchId, list);
  }

  return branchRows.map((branch) => ({
    id: branch.id as string,
    full_name: (branch.full_name as string | null) ?? null,
    email: branch.email as string,
    company_name: (branch.company_name as string | null) ?? null,
    agent_ids: agentsByBranch.get(branch.id as string) ?? [],
  }));
}

export function resolveBranchListingScopeIds(
  branch: Pick<FranchiseBranchOffice, "id" | "agent_ids">
): string[] {
  return [branch.id, ...branch.agent_ids];
}

export function resolveFranchiseNetworkScopeIds(
  masterId: string,
  branches: FranchiseBranchOffice[]
): string[] {
  const scopeIds = new Set<string>([masterId]);

  for (const branch of branches) {
    scopeIds.add(branch.id);
    for (const agentId of branch.agent_ids) {
      scopeIds.add(agentId);
    }
  }

  return [...scopeIds];
}

export function buildFranchiseListingScopeFilter(scopeIds: string[]): string {
  return buildMultiIdOwnershipScopeFilter(scopeIds);
}

export async function fetchFranchiseNetworkSnapshot(
  supabase: SupabaseClient,
  masterId: string
): Promise<FranchiseNetworkSnapshot> {
  const branches = await fetchFranchiseBranchOffices(supabase, masterId);

  return {
    master_id: masterId,
    branches,
    network_scope_ids: resolveFranchiseNetworkScopeIds(masterId, branches),
  };
}
