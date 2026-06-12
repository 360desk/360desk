"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import type { TeamMember, TransferRecipient } from "@/types/team";

interface TransferPortfoliosModalProps {
  member: TeamMember | null;
  brokerId: string;
  brokerName: string;
  teamMembers: TeamMember[];
  onClose: () => void;
  onSuccess: () => void;
}

export function TransferPortfoliosModal({
  member,
  brokerId,
  brokerName,
  teamMembers,
  onClose,
  onSuccess,
}: TransferPortfoliosModalProps) {
  const recipients = useMemo<TransferRecipient[]>(() => {
    const options: TransferRecipient[] = [
      {
        id: brokerId,
        label: `${brokerName} (Broker)`,
        is_broker: true,
      },
    ];

    for (const staff of teamMembers) {
      if (staff.id !== member?.id && !staff.is_suspended) {
        options.push({
          id: staff.id,
          label: staff.full_name || staff.email,
          is_broker: false,
        });
      }
    }

    return options;
  }, [brokerId, brokerName, member?.id, teamMembers]);

  const [transferToId, setTransferToId] = useState(brokerId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTransfer = async () => {
    if (!member) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/listings/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transfer_type: "office_reassign",
          staff_id: member.id,
          target_owner_id: transferToId,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        result?: { message?: string; transferred_count?: number };
      };

      if (!response.ok) {
        setError(payload.error ?? "Portföy devri tamamlanamadı.");
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={Boolean(member)}
      onClose={onClose}
      title="Portföyleri Transfer Et"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Vazgeç
          </Button>
          <Button onClick={handleTransfer} disabled={loading}>
            {loading ? "Devrediliyor..." : "Portföyleri Devret"}
          </Button>
        </>
      }
    >
      {member && (
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-4">
            <p className="text-sm leading-relaxed text-cream/85">
              Seçili danışmanın aktif portföylerini güvenli şekilde başka bir
              ekip üyesine devredebilirsiniz.
            </p>
            <p className="mt-3 text-sm font-semibold text-cream">
              {member.full_name || member.email}
            </p>
            <p className="mt-1 text-xs text-cream/50">
              Aktif ilan: {member.active_ad_count}
            </p>
          </div>

          <Select
            label="Portföy Devralacak Kişi"
            value={transferToId}
            onChange={(event) => setTransferToId(event.target.value)}
            options={recipients.map((recipient) => ({
              value: recipient.id,
              label: recipient.label,
            }))}
          />

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
