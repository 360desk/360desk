"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { TeamMember } from "@/types/team";

interface DeactivateAgentModalProps {
  member: TeamMember | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeactivateAgentModal({
  member,
  onClose,
  onSuccess,
}: DeactivateAgentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDeactivate = async () => {
    if (!member) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/team/deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff_id: member.id }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Danışman pasife alınamadı.");
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
      title="Danışmanı Pasife Al"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Vazgeç
          </Button>
          <Button variant="danger" onClick={handleDeactivate} disabled={loading}>
            {loading ? "Pasife Alınıyor..." : "Pasife Al"}
          </Button>
        </>
      }
    >
      {member && (
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-cream/75">
            <span className="font-semibold text-cream">
              {member.full_name || member.email}
            </span>{" "}
            hesabını pasife almak üzeresiniz. Aktif portföy varsa önce
            transfer işlemi yapılmalıdır.
          </p>

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
