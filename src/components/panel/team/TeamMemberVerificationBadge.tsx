"use client";

import type { TeamMember } from "@/types/team";

interface TeamMemberVerificationBadgeProps {
  member: Pick<TeamMember, "contract_accepted" | "is_suspended" | "row_kind">;
}

export function TeamMemberVerificationBadge({
  member,
}: TeamMemberVerificationBadgeProps) {
  if (member.is_suspended) {
    return (
      <span className="inline-flex rounded-full border border-red-500/30 bg-red-950/20 px-2.5 py-0.5 text-xs font-medium text-red-300">
        Pasif
      </span>
    );
  }

  if (
    !member.contract_accepted ||
    member.row_kind === "pending_invitation" ||
    member.row_kind === "pending_profile"
  ) {
    return (
      <span className="relative inline-flex items-center gap-2 rounded-full border border-amber-400/45 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-200">
        <span className="absolute -left-0.5 h-2 w-2 animate-pulse rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
        <span className="pl-2">Bekliyor (Kayıt ve Onay Linki Gönderildi)</span>
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full border border-emerald-500/40 bg-emerald-950/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
      Aktif
    </span>
  );
}
