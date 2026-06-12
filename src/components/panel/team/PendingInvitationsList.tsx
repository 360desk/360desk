"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/format";
import { PendingInvitationActionsMenu } from "@/components/panel/team/PendingInvitationActionsMenu";

interface SentInvitation {
  id: string;
  invitee_email: string;
  invitee_phone?: string | null;
  status: string;
  invite_type?: string;
  target_role?: string;
  created_at: string;
}

interface PendingInvitationsListProps {
  refreshKey: number;
  onResendSuccess?: (email: string) => void;
  onCancelSuccess?: (email: string) => void;
  onActionError?: (message: string) => void;
}

export function PendingInvitationsList({
  refreshKey,
  onResendSuccess,
  onCancelSuccess,
  onActionError,
}: PendingInvitationsListProps) {
  const [invitations, setInvitations] = useState<SentInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/team/invitations?scope=sent");
    const payload = (await response.json()) as {
      invitations?: SentInvitation[];
    };

    setInvitations(payload.invitations ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchInvitations();
  }, [fetchInvitations, refreshKey]);

  const handleResend = async (invitationId: string) => {
    const response = await fetch(`/api/team/invitations/${invitationId}/resend`, {
      method: "POST",
    });
    const payload = (await response.json()) as {
      error?: string;
      invitee_email?: string;
    };

    if (!response.ok) {
      onActionError?.(payload.error ?? "Davet yeniden gönderilemedi.");
      return;
    }

    await fetchInvitations();
    onResendSuccess?.(payload.invitee_email ?? "Davetli");
  };

  const handleCancel = async (invitationId: string) => {
    const response = await fetch(`/api/team/invitations/${invitationId}`, {
      method: "DELETE",
    });
    const payload = (await response.json()) as {
      error?: string;
      invitee_email?: string;
    };

    if (!response.ok) {
      onActionError?.(payload.error ?? "Davet iptal edilemedi.");
      return;
    }

    setInvitations((current) =>
      current.filter((invitation) => invitation.id !== invitationId)
    );
    onCancelSuccess?.(payload.invitee_email ?? "Davetli");
  };

  if (loading || invitations.length === 0) {
    return null;
  }

  return (
    <Card className="border-cream/10 bg-charcoal-light">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-cream/50">
        Bekleyen Davetler
      </h3>
      <div className="mt-4 flex flex-col gap-3">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cream/10 bg-charcoal px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-cream">
                {invitation.invitee_email}
              </p>
              <p className="text-xs text-cream/40">
                Gönderildi: {formatDate(invitation.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-200">
                Bekliyor
              </span>
              <PendingInvitationActionsMenu
                invitationId={invitation.id}
                onResend={handleResend}
                onCancel={handleCancel}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
