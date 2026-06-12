"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import type { TeamMember, TransferRecipient } from "@/types/team";

interface DismissStaffModalProps {
  member: TeamMember | null;
  brokerId: string;
  brokerName: string;
  teamMembers: TeamMember[];
  onClose: () => void;
  onSuccess: () => void;
}

export function DismissStaffModal({
  member,
  brokerId,
  brokerName,
  teamMembers,
  onClose,
  onSuccess,
}: DismissStaffModalProps) {
  const recipients = useMemo<TransferRecipient[]>(() => {
    const options: TransferRecipient[] = [
      {
        id: brokerId,
        label: `${brokerName} (Ofis Yöneticisi)`,
        is_broker: true,
      },
    ];

    for (const staff of teamMembers) {
      if (staff.id !== member?.id) {
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

  const handleDismiss = async () => {
    if (!member) {
      return;
    }

    setLoading(true);
    setError("");

    const response = await fetch("/api/team/dismiss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staff_id: member.id,
        transfer_to_id: transferToId,
      }),
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Danışman ofisten çıkarılamadı.");
      setLoading(false);
      return;
    }

    onSuccess();
    onClose();
    setLoading(false);
  };

  return (
    <Modal
      open={Boolean(member)}
      onClose={onClose}
      title="Danışmanı Ofisten Çıkar"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Vazgeç
          </Button>
          <Button variant="danger" onClick={handleDismiss} disabled={loading}>
            {loading ? "İşleniyor..." : "Ofisten Çıkar ve İlanları Devret"}
          </Button>
        </>
      }
    >
      {member && (
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-4">
            <p className="text-sm leading-relaxed text-cream/85">
              Bu danışmanı ofisten çıkarmak üzeresiniz. Yönettiği aktif
              ilanları kime devretmek istersiniz?
            </p>
            <p className="mt-3 text-sm font-semibold text-cream">
              {member.full_name || member.email}
            </p>
            <p className="mt-1 text-xs text-cream/50">
              {member.account_origin === "created_by_office"
                ? "Ofis hesabı: tüm yönettiği ilanlar devredilecek ve hesap askıya alınacak."
                : "Bağımsız katılım: yalnızca ofise ait ilanlar devredilecek, kişisel ilanları korunacak."}
            </p>
          </div>

          <Select
            label="İlan Devralacak Kişi"
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
