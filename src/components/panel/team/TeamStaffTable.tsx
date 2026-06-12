"use client";

import { Card } from "@/components/ui/Card";
import { ACCOUNT_ORIGIN_LABELS } from "@/lib/format-team";
import { getOfficeUserRoleLabel } from "@/lib/office-hierarchy";
import { TeamStaffActionsMenu } from "@/components/panel/team/TeamStaffActionsMenu";
import { TeamMemberVerificationBadge } from "@/components/panel/team/TeamMemberVerificationBadge";
import type { TeamManagementViewMode } from "@/lib/office-hierarchy";
import type { TeamMember } from "@/types/team";

interface TeamStaffTableProps {
  members: TeamMember[];
  loading: boolean;
  viewMode: TeamManagementViewMode;
  memberColumnLabel: string;
  emptyMessage: string;
  emptyHint: string;
  onTransfer: (member: TeamMember) => void;
  onDeactivate: (member: TeamMember) => void;
}

export function TeamStaffTable({
  members,
  loading,
  viewMode,
  memberColumnLabel,
  emptyMessage,
  emptyHint,
  onTransfer,
  onDeactivate,
}: TeamStaffTableProps) {
  const listingColumnLabel =
    viewMode === "franchise_master" ? "Şube Portföyü" : "Aktif İlan";

  if (loading) {
    return (
      <Card className="py-12 text-center">
        <p className="text-cream/40">Ekip listesi yükleniyor...</p>
      </Card>
    );
  }

  if (members.length === 0) {
    return (
      <Card className="py-12 text-center">
        <p className="text-cream/50">{emptyMessage}</p>
        <p className="mt-2 text-sm text-cream/30">{emptyHint}</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-visible border-cream/10 bg-charcoal-light p-0">
      <div className="overflow-x-auto overflow-y-visible">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-cream/10 bg-charcoal/60">
            <tr>
              <th className="px-5 py-4 font-semibold text-cream/70">
                {memberColumnLabel}
              </th>
              <th className="px-5 py-4 font-semibold text-cream/70">Telefon</th>
              <th className="px-5 py-4 font-semibold text-cream/70">Rol</th>
              <th className="px-5 py-4 font-semibold text-cream/70">Durum</th>
              <th className="px-5 py-4 font-semibold text-cream/70">
                {listingColumnLabel}
              </th>
              <th className="px-5 py-4 font-semibold text-cream/70 text-right">
                İşlem
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream/10">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-cream/[0.02]">
                <td className="px-5 py-4">
                  <div className="font-medium text-cream">
                    {member.full_name ||
                      (viewMode === "franchise_master"
                        ? "İsimsiz Şube"
                        : "İsimsiz Danışman")}
                  </div>
                  <div className="text-xs text-cream/40">{member.email}</div>
                  <div className="mt-1 text-[10px] text-cream/35">
                    {ACCOUNT_ORIGIN_LABELS[member.account_origin]}
                  </div>
                </td>
                <td className="px-5 py-4 text-cream/70">
                  {member.phone || "—"}
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex rounded-full border border-cream/20 bg-cream/5 px-2.5 py-0.5 text-xs font-medium text-cream/70">
                    {getOfficeUserRoleLabel(member.user_role)}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <TeamMemberVerificationBadge member={member} />
                </td>
                <td className="px-5 py-4">
                  <span className="font-semibold text-cream">
                    {member.active_ad_count}
                  </span>
                </td>
                <td className="relative overflow-visible px-5 py-4 text-right">
                  <TeamStaffActionsMenu
                    member={member}
                    viewMode={viewMode}
                    onTransfer={onTransfer}
                    onDeactivate={onDeactivate}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
