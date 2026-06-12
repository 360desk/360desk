"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";

interface PendingInvitation {
  id: string;
  broker?: {
    full_name: string | null;
    company_name: string | null;
  } | null;
}

export function OfficeInviteBanner() {
  const { profile, refreshProfile } = useAuth();
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchInvitations = useCallback(async () => {
    if (profile?.organization_role !== "individual") {
      setInvitations([]);
      return;
    }

    const response = await fetch("/api/team/invitations");
    const payload = (await response.json()) as {
      invitations?: PendingInvitation[];
    };

    setInvitations(payload.invitations ?? []);
  }, [profile?.organization_role]);

  useEffect(() => {
    void fetchInvitations();
  }, [fetchInvitations]);

  const handleAccept = async (invitationId: string) => {
    setLoadingId(invitationId);
    setError("");

    const response = await fetch("/api/team/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: invitationId }),
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Davet kabul edilemedi.");
      setLoadingId(null);
      return;
    }

    await refreshProfile();
    setInvitations([]);
    setLoadingId(null);
    window.location.href = "/panelim?onboarding=locked";
  };

  const handleReject = async (invitationId: string) => {
    setRejectingId(invitationId);
    setError("");

    const response = await fetch("/api/team/reject-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: invitationId }),
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Davet reddedilemedi.");
      setRejectingId(null);
      return;
    }

    setInvitations((current) =>
      current.filter((invitation) => invitation.id !== invitationId)
    );
    setRejectingId(null);
  };

  if (!invitations.length) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {invitations.map((invitation) => {
        const officeName =
          invitation.broker?.company_name ||
          invitation.broker?.full_name ||
          "Bir ofis";

        return (
          <Card
            key={invitation.id}
            className="border-primary/30 bg-primary/5 p-4"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-primary">
                  Ofis Daveti
                </p>
                <p className="mt-1 text-sm text-cream/85">
                  {officeName} sizi ekibine katılmaya davet ediyor.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={rejectingId === invitation.id || loadingId === invitation.id}
                  onClick={() => void handleReject(invitation.id)}
                >
                  {rejectingId === invitation.id ? "Reddediliyor..." : "Reddet"}
                </Button>
                <Button
                  size="sm"
                  disabled={loadingId === invitation.id || rejectingId === invitation.id}
                  onClick={() => void handleAccept(invitation.id)}
                >
                  {loadingId === invitation.id
                    ? "Kabul ediliyor..."
                    : "Daveti Kabul Et"}
                </Button>
              </div>
            </div>
          </Card>
        );
      })}

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
