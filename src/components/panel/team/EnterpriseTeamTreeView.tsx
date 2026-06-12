"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ACCOUNT_ORIGIN_LABELS } from "@/lib/format-team";
import { getOfficeUserRoleLabel } from "@/lib/office-hierarchy";
import { TeamMemberVerificationBadge } from "@/components/panel/team/TeamMemberVerificationBadge";
import { TeamStaffActionsMenu } from "@/components/panel/team/TeamStaffActionsMenu";
import type { TeamInviteRevokeResult } from "@/components/panel/team/TeamStaffActionsMenu";
import type { TeamManagementViewMode } from "@/lib/office-hierarchy";
import type { EnterpriseTeamTree, TeamMember } from "@/types/team";

interface EnterpriseTeamTreeViewProps {
  tree: EnterpriseTeamTree | null;
  loading: boolean;
  viewMode: TeamManagementViewMode;
  onTransfer: (member: TeamMember) => void;
  onDeactivate: (member: TeamMember) => void;
  onResendSuccess?: (email: string) => void;
  onRevokeSuccess?: (member: TeamMember, result: TeamInviteRevokeResult) => void;
  onCopyTestLinkSuccess?: (email: string) => void;
  onActionError?: (message: string) => void;
}

function isPendingRow(member: TeamMember): boolean {
  return member.row_kind !== "active_member";
}

function formatPhone(phone: string | null): string {
  if (!phone?.trim()) {
    return "—";
  }

  return phone.trim();
}

function memberDisplayName(member: TeamMember): string {
  if (member.row_kind === "pending_invitation") {
    return "Davet Bekleniyor";
  }

  return member.full_name || "İsimsiz Üye";
}

function MemberTable({
  members,
  viewMode,
  memberColumnLabel,
  listingColumnLabel,
  onTransfer,
  onDeactivate,
  onResendSuccess,
  onRevokeSuccess,
  onCopyTestLinkSuccess,
  onActionError,
  nested = false,
}: {
  members: TeamMember[];
  viewMode: TeamManagementViewMode;
  memberColumnLabel: string;
  listingColumnLabel: string;
  onTransfer: (member: TeamMember) => void;
  onDeactivate: (member: TeamMember) => void;
  onResendSuccess?: (email: string) => void;
  onRevokeSuccess?: (member: TeamMember, result: TeamInviteRevokeResult) => void;
  onCopyTestLinkSuccess?: (email: string) => void;
  onActionError?: (message: string) => void;
  nested?: boolean;
}) {
  if (members.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-cream/15 px-4 py-6 text-center text-sm text-cream/40">
        Bu katmanda henüz kayıt bulunmuyor.
      </p>
    );
  }

  return (
    <div
      className={`overflow-x-auto overflow-y-visible ${nested ? "rounded-lg border border-cream/10 bg-charcoal/40" : ""}`}
    >
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-cream/10 bg-charcoal/60">
          <tr>
            <th className="px-5 py-3 font-semibold text-cream/70">{memberColumnLabel}</th>
            <th className="px-5 py-3 font-semibold text-cream/70">Telefon</th>
            <th className="px-5 py-3 font-semibold text-cream/70">Rol</th>
            <th className="px-5 py-3 font-semibold text-cream/70">Durum</th>
            <th className="px-5 py-3 font-semibold text-cream/70">{listingColumnLabel}</th>
            <th className="px-5 py-3 font-semibold text-cream/70 text-right">İşlemler</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-cream/10">
          {members.map((member) => {
            const pending = isPendingRow(member);

            return (
              <tr
                key={member.id}
                className={
                  pending
                    ? "bg-amber-500/[0.06] ring-1 ring-inset ring-amber-400/20 hover:bg-amber-500/[0.09]"
                    : "hover:bg-cream/[0.02]"
                }
              >
                <td className="px-5 py-3">
                  <div className="font-medium text-cream">
                    {memberDisplayName(member)}
                  </div>
                  <div className="text-xs text-cream/40">{member.email}</div>
                  {!pending && (
                    <div className="mt-1 text-[10px] text-cream/35">
                      {ACCOUNT_ORIGIN_LABELS[member.account_origin]}
                    </div>
                  )}
                </td>
                <td className="px-5 py-3 text-cream/75">
                  {formatPhone(member.phone)}
                </td>
                <td className="px-5 py-3">
                  <span className="inline-flex rounded-full border border-cream/20 bg-cream/5 px-2.5 py-0.5 text-xs font-medium text-cream/70">
                    {getOfficeUserRoleLabel(member.user_role)}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <TeamMemberVerificationBadge member={member} />
                </td>
                <td className="px-5 py-3 font-semibold text-cream">
                  {pending ? "—" : member.active_ad_count}
                </td>
                <td className="relative overflow-visible px-5 py-3 text-right">
                  <TeamStaffActionsMenu
                    member={member}
                    viewMode={viewMode}
                    onTransfer={onTransfer}
                    onDeactivate={onDeactivate}
                    onResendSuccess={onResendSuccess}
                    onRevokeSuccess={onRevokeSuccess}
                    onCopyTestLinkSuccess={onCopyTestLinkSuccess}
                    onActionError={onActionError}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BranchOfficeCard({
  branch,
  viewMode,
  onTransfer,
  onDeactivate,
  onResendSuccess,
  onRevokeSuccess,
  onCopyTestLinkSuccess,
  onActionError,
}: {
  branch: EnterpriseTeamTree["branch_offices"][number];
  viewMode: TeamManagementViewMode;
  onTransfer: (member: TeamMember) => void;
  onDeactivate: (member: TeamMember) => void;
  onResendSuccess?: (email: string) => void;
  onRevokeSuccess?: (member: TeamMember, result: TeamInviteRevokeResult) => void;
  onCopyTestLinkSuccess?: (email: string) => void;
  onActionError?: (message: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const branchPending = isPendingRow(branch);

  return (
    <Card
      className={`overflow-visible p-0 ${
        branchPending
          ? "border-amber-400/25 bg-amber-500/[0.04]"
          : "border-cream/10 bg-charcoal-light"
      }`}
    >
      <div className="flex items-center justify-between gap-4 border-b border-cream/10 px-5 py-4">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="min-w-0 flex-1 text-left transition-colors hover:bg-cream/[0.02]"
        >
          <p className="font-semibold text-cream">
            {branch.full_name || branch.email}
          </p>
          <p className="text-xs text-cream/45">{branch.email}</p>
          {branch.phone && (
            <p className="mt-1 text-xs text-cream/45">{formatPhone(branch.phone)}</p>
          )}
        </button>
        <div className="flex shrink-0 items-center gap-3">
          <TeamMemberVerificationBadge member={branch} />
          <span className="text-xs text-cream/45">
            {branch.agents.length} danışman
          </span>
          {branchPending && (
            <TeamStaffActionsMenu
              member={branch}
              viewMode={viewMode}
              onTransfer={onTransfer}
              onDeactivate={onDeactivate}
              onResendSuccess={onResendSuccess}
              onRevokeSuccess={onRevokeSuccess}
              onCopyTestLinkSuccess={onCopyTestLinkSuccess}
              onActionError={onActionError}
            />
          )}
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="rounded-md px-2 py-1 text-cream/50 transition-colors hover:bg-cream/5"
            aria-label={expanded ? "Şube detayını kapat" : "Şube detayını aç"}
          >
            {expanded ? "▾" : "▸"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-cream/40">
            Şube Danışman Kadrosu
          </p>
          <MemberTable
            members={branch.agents}
            viewMode={viewMode}
            memberColumnLabel="Danışman"
            listingColumnLabel="Aktif İlan"
            onTransfer={onTransfer}
            onDeactivate={onDeactivate}
            onResendSuccess={onResendSuccess}
            onRevokeSuccess={onRevokeSuccess}
            onCopyTestLinkSuccess={onCopyTestLinkSuccess}
            onActionError={onActionError}
            nested
          />
        </div>
      )}
    </Card>
  );
}

export function EnterpriseTeamTreeView({
  tree,
  loading,
  viewMode,
  onTransfer,
  onDeactivate,
  onResendSuccess,
  onRevokeSuccess,
  onCopyTestLinkSuccess,
  onActionError,
}: EnterpriseTeamTreeViewProps) {
  if (loading) {
    return (
      <Card className="py-12 text-center">
        <p className="text-cream/40">Kurumsal ağaç yapısı yükleniyor...</p>
      </Card>
    );
  }

  if (!tree) {
    return null;
  }

  if (tree.view_mode === "broker_owner") {
    return (
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-cream">👥 Ofis Danışmanları</h2>
        <Card className="overflow-visible border-cream/10 bg-charcoal-light p-0">
          <MemberTable
            members={tree.office_agents}
            viewMode={viewMode}
            memberColumnLabel="Danışman"
            listingColumnLabel="Aktif İlan"
            onTransfer={onTransfer}
            onDeactivate={onDeactivate}
            onResendSuccess={onResendSuccess}
            onRevokeSuccess={onRevokeSuccess}
            onCopyTestLinkSuccess={onCopyTestLinkSuccess}
            onActionError={onActionError}
          />
        </Card>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-cream">
          👑 Genel Merkez Danışmanları Kadrosu
        </h2>
        <Card className="overflow-visible border-cream/10 bg-charcoal-light p-0">
          <MemberTable
            members={tree.hq_agents}
            viewMode={viewMode}
            memberColumnLabel="Merkez Danışman"
            listingColumnLabel="Aktif İlan"
            onTransfer={onTransfer}
            onDeactivate={onDeactivate}
            onResendSuccess={onResendSuccess}
            onRevokeSuccess={onRevokeSuccess}
            onCopyTestLinkSuccess={onCopyTestLinkSuccess}
            onActionError={onActionError}
          />
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-cream">
          🏢 Bağlı Alt Ofisler & Şubeler
        </h2>
        {tree.branch_offices.length === 0 ? (
          <Card className="py-10 text-center">
            <p className="text-cream/50">Henüz bağlı alt ofis bulunmuyor.</p>
            <p className="mt-2 text-sm text-cream/30">
              Yeni Alt Ofis / Şube Davet Et ile franchise ağınızı genişletin.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {tree.branch_offices.map((branch) => (
              <BranchOfficeCard
                key={branch.id}
                branch={branch}
                viewMode={viewMode}
                onTransfer={onTransfer}
                onDeactivate={onDeactivate}
                onResendSuccess={onResendSuccess}
                onRevokeSuccess={onRevokeSuccess}
                onCopyTestLinkSuccess={onCopyTestLinkSuccess}
                onActionError={onActionError}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
