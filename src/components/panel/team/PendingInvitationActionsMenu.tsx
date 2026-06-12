"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TeamActionsDropdownPortal } from "@/components/panel/team/TeamActionsDropdownPortal";

interface PendingInvitationActionsMenuProps {
  invitationId: string;
  disabled?: boolean;
  onResend: (invitationId: string) => Promise<void>;
  onCancel: (invitationId: string) => Promise<void>;
}

export function PendingInvitationActionsMenu({
  invitationId,
  disabled = false,
  onResend,
  onCancel,
}: PendingInvitationActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<"resend" | "cancel" | null>(
    null
  );
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleResend = async () => {
    setBusyAction("resend");
    try {
      await onResend(invitationId);
      setOpen(false);
    } finally {
      setBusyAction(null);
    }
  };

  const handleCancel = async () => {
    setBusyAction("cancel");
    try {
      await onCancel(invitationId);
      setOpen(false);
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div ref={triggerRef} className="relative inline-flex justify-end">
      <Button
        variant="secondary"
        size="sm"
        disabled={disabled || busyAction !== null}
        onClick={() => setOpen((current) => !current)}
        className="border-primary/25 bg-gradient-to-r from-charcoal-light to-charcoal shadow-lg shadow-black/20"
      >
        İşlemler
      </Button>

      <TeamActionsDropdownPortal
        open={open}
        onClose={() => setOpen(false)}
        triggerRef={triggerRef}
        minWidth={240}
        className="overflow-hidden rounded-2xl border border-primary/20 bg-charcoal/95 shadow-2xl shadow-black/40 backdrop-blur-xl !z-[9999]"
      >
        <div className="border-b border-cream/10 bg-gradient-to-r from-primary/15 via-charcoal-light/90 to-charcoal px-4 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/90">
            Davet Yönetimi
          </p>
        </div>
        <button
          type="button"
          className="block w-full px-4 py-3.5 text-left text-sm text-cream/85 transition-colors hover:bg-primary/10 hover:text-cream disabled:opacity-50"
          disabled={busyAction !== null}
          onClick={() => void handleResend()}
        >
          {busyAction === "resend" ? "Gönderiliyor..." : "Daveti Tekrar Gönder"}
        </button>
        <button
          type="button"
          className="block w-full border-t border-cream/10 px-4 py-3.5 text-left text-sm text-red-300 transition-colors hover:bg-red-950/25 disabled:opacity-50"
          disabled={busyAction !== null}
          onClick={() => void handleCancel()}
        >
          {busyAction === "cancel" ? "İptal ediliyor..." : "Daveti İptal Et"}
        </button>
      </TeamActionsDropdownPortal>
    </div>
  );
}
