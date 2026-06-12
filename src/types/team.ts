import type { AccountOrigin } from "@/types/database";

export type TeamRowKind = "active_member" | "pending_profile" | "pending_invitation";

export interface TeamMember {
  id: string;
  invitation_id?: string | null;
  row_kind: TeamRowKind;
  email: string;
  full_name: string | null;
  phone: string | null;
  account_origin: AccountOrigin;
  user_role: string | null;
  is_suspended: boolean;
  contract_accepted: boolean;
  active_ad_count: number;
  created_at: string;
}

export interface BranchOfficeNode extends TeamMember {
  agents: TeamMember[];
}

export interface EnterpriseTeamTree {
  view_mode: "franchise_master" | "broker_owner";
  hq_agents: TeamMember[];
  branch_offices: BranchOfficeNode[];
  office_agents: TeamMember[];
}

export interface TransferRecipient {
  id: string;
  label: string;
  is_broker: boolean;
}

export interface OfficeInvitation {
  id: string;
  broker_id: string;
  invitee_email: string;
  invitee_phone: string | null;
  status: string;
  invite_type: string;
  target_role: string;
  created_at: string;
  broker?: {
    full_name: string | null;
    company_name: string | null;
  } | null;
}

export interface DismissStaffResult {
  staff_id: string;
  transfer_to_id: string;
  account_origin: AccountOrigin;
  transferred_ads: number;
  suspended: boolean;
}
