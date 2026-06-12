"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TeamActionsDropdownPortal } from "@/components/panel/team/TeamActionsDropdownPortal";
import { buildTestOnboardingLink } from "@/lib/supabase/team-invitations-table";
import type { TeamManagementViewMode } from "@/lib/office-hierarchy";
import type { TeamMember } from "@/types/team";

export interface TeamInviteRevokeResult {
  invitation_id: string;
  invitee_email: string;
  profile_removed?: boolean;
}

interface TeamStaffActionsMenuProps {
  member: TeamMember;
  viewMode: TeamManagementViewMode;
  onTransfer: (member: TeamMember) => void;
  onDeactivate: (member: TeamMember) => void;
  onResendSuccess?: (email: string) => void;
  onRevokeSuccess?: (
    member: TeamMember,
    result: TeamInviteRevokeResult
  ) => void;
  onCopyTestLinkSuccess?: (email: string) => void;
  onActionError?: (message: string) => void;
}

function resolveInvitationId(member: TeamMember): string | null {
  if (member.invitation_id) {
    return member.invitation_id;
  }

  if (member.row_kind === "pending_invitation") {
    return member.id;
  }

  return null;
}

function buildRevokeInviteUrl(member: TeamMember): string {
  const params = new URLSearchParams();
  const invitationId = resolveInvitationId(member);

  if (invitationId) {
    params.set("id", invitationId);
  }

  if (member.row_kind === "pending_profile") {
    params.set("member_id", member.id);
  } else if (!invitationId && member.row_kind !== "active_member") {
    params.set("member_id", member.id);
  }

  if (member.email?.trim()) {
    params.set("email", member.email.trim().toLowerCase());
  }

  return `/api/team/invite?${params.toString()}`;
}

export function TeamStaffActionsMenu({
  member,
  viewMode,
  onTransfer,
  onDeactivate,
  onResendSuccess,
  onRevokeSuccess,
  onCopyTestLinkSuccess,
  onActionError,
}: TeamStaffActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<
    "resend" | "revoke" | "copy" | null
  >(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const invitationId = resolveInvitationId(member);
  const isPending = member.row_kind !== "active_member";
  const isBranchView = viewMode === "franchise_master";
  const deactivateLabel = isBranchView
    ? "Şubeyi Pasife Al"
    : "Danışmanı Pasife Al";

  const handleResend = async () => {
    setBusyAction("resend");
    try {
      const params = new URLSearchParams();
      if (invitationId) {
        params.set("id", invitationId);
      }
      if (member.email?.trim()) {
        params.set("email", member.email.trim().toLowerCase());
      }

      const response = await fetch(
        invitationId
          ? `/api/team/invitations/${invitationId}/resend`
          : `/api/team/members/${member.id}/resend-invite?${params.toString()}`,
        { method: "POST" }
      );
      const payload = (await response.json()) as {
        error?: string;
        invitee_email?: string;
        email_sent?: boolean;
      };

      if (!response.ok) {
        onActionError?.(payload.error ?? "Davet yeniden gönderilemedi.");
        return;
      }

      if (payload.email_sent === false) {
        onActionError?.("Davet kaydı bulundu ancak e-posta gönderilemedi.");
        return;
      }

      setOpen(false);
      onResendSuccess?.(payload.invitee_email ?? member.email);
    } catch {
      onActionError?.("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleRevoke = async () => {
    setBusyAction("revoke");
    try {
      const response = await fetch(buildRevokeInviteUrl(member), {
        method: "DELETE",
      });
      const payload = (await response.json()) as {
        error?: string;
        invitation_id?: string | null;
        invitee_email?: string;
        profile_removed?: boolean;
        member_id?: string;
      };

      if (!response.ok) {
        onActionError?.(payload.error ?? "Davet iptal edilemedi.");
        return;
      }

      setOpen(false);
      onRevokeSuccess?.(member, {
        invitation_id:
          payload.invitation_id ?? invitationId ?? member.invitation_id ?? member.id,
        invitee_email: payload.invitee_email ?? member.email,
        profile_removed: payload.profile_removed,
      });
    } catch {
      onActionError?.("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleCopyTestLink = async () => {
    if (!invitationId) {
      onActionError?.("Bu satır için test onay bağlantısı oluşturulamadı.");
      return;
    }

    setBusyAction("copy");
    try {
      const relativeLink = buildTestOnboardingLink(invitationId, member.email);
      const absoluteLink = `${window.location.origin}${relativeLink}`;
      await navigator.clipboard.writeText(absoluteLink);
      setOpen(false);
      onCopyTestLinkSuccess?.(member.email);
    } catch {
      onActionError?.("Panoya kopyalanamadı. Tarayıcı izinlerini kontrol edin.");
    } finally {
      setBusyAction(null);
    }
  };

  const menuClassName = isPending
    ? "overflow-hidden rounded-2xl border border-primary/20 bg-charcoal/95 shadow-2xl shadow-black/40 backdrop-blur-xl !z-[9999]"
    : "overflow-hidden rounded-xl border border-cream/10 bg-charcoal-light shadow-xl shadow-black/30 !z-[9999]";

  return (
    <div ref={triggerRef} className="relative inline-flex justify-end">
      <Button
        variant="secondary"
        size="sm"
        disabled={busyAction !== null}
        onClick={() => setOpen((current) => !current)}
        className={
          isPending
            ? "border-primary/25 bg-gradient-to-r from-charcoal-light to-charcoal shadow-lg shadow-black/20"
            : undefined
        }
      >
        İşlemler
      </Button>

      <TeamActionsDropdownPortal
        open={open}
        onClose={() => setOpen(false)}
        triggerRef={triggerRef}
        minWidth={isPending ? 280 : 220}
        className={menuClassName}
      >
        {isPending ? (
          <>
            <div className="border-b border-cream/10 bg-gradient-to-r from-primary/15 via-charcoal-light/90 to-charcoal px-4 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/90">
                Bekleyen Davet
              </p>
            </div>
            {invitationId && (
              <button
                type="button"
                className="block w-full px-4 py-3.5 text-left text-sm text-amber-100/90 transition-colors hover:bg-amber-500/10 hover:text-amber-50 disabled:opacity-50"
                disabled={busyAction !== null}
                onClick={() => void handleCopyTestLink()}
              >
                {busyAction === "copy"
                  ? "Kopyalanıyor..."
                  : "Onay Linkini Kopyala (Test)"}
              </button>
            )}
            <button
              type="button"
              className="block w-full border-t border-cream/10 px-4 py-3.5 text-left text-sm text-cream/85 transition-colors hover:bg-primary/10 hover:text-cream disabled:opacity-50"
              disabled={busyAction !== null}
              onClick={() => void handleResend()}
            >
              {busyAction === "resend"
                ? "Gönderiliyor..."
                : "Daveti Tekrar Gönder"}
            </button>
            <button
              type="button"
              className="block w-full border-t border-cream/10 px-4 py-3.5 text-left text-sm text-red-300 transition-colors hover:bg-red-950/25 disabled:opacity-50"
              disabled={busyAction !== null}
              onClick={() => void handleRevoke()}
            >
              {busyAction === "revoke"
                ? "İptal ediliyor..."
                : "Daveti İptal Et (Geri Çek)"}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="block w-full px-4 py-3 text-left text-sm text-cream/80 transition-colors hover:bg-cream/5 hover:text-cream"
              onClick={() => {
                setOpen(false);
                onTransfer(member);
              }}
            >
              {isBranchView
                ? "Şube Portföylerini Transfer Et"
                : "Portföyleri Transfer Et"}
            </button>
            <button
              type="button"
              className="block w-full border-t border-cream/10 px-4 py-3 text-left text-sm text-red-300 transition-colors hover:bg-red-950/20"
              onClick={() => {
                setOpen(false);
                onDeactivate(member);
              }}
              disabled={member.is_suspended}
            >
              {deactivateLabel}
            </button>
          </>
        )}
      </TeamActionsDropdownPortal>
    </div>
  );
}
