"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { TeamInviteMode } from "@/lib/supabase/team-invite-engine";
import type { TeamQuotaSnapshot } from "@/types/subscription-tier";

interface AgentInviteModalProps {
  open: boolean;
  quota: TeamQuotaSnapshot | null;
  onClose: () => void;
  onSuccess: (mode: TeamInviteMode) => void;
}

export function AgentInviteModal({
  open,
  quota,
  onClose,
  onSuccess,
}: AgentInviteModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setFullName("");
    setEmail("");
    setPhone("");
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          invite_type: "agent",
          target_role: "office_agent",
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        success?: boolean;
        mode?: TeamInviteMode;
      };

      if (!response.ok) {
        setError(payload.error ?? "Danışman daveti tamamlanamadı.");
        return;
      }

      if (payload.success && payload.mode) {
        onSuccess(payload.mode);
        handleClose();
        return;
      }

      setError("Davet yanıtı işlenemedi. Lütfen tekrar deneyin.");
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const quotaLabel = quota
    ? `${quota.currentTeamSize} / ${quota.maxTeamMembers} danışman`
    : "—";

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Danışman Davet Et"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Vazgeç
          </Button>
          <Button
            type="submit"
            form="agent-invite-form"
            disabled={loading || quota?.canAddTeamMember === false}
          >
            {loading ? "İşleniyor..." : "Danışman Davet Et"}
          </Button>
        </>
      }
    >
      <form
        id="agent-invite-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-cream/70">
          Bağımsız ofis olarak yalnızca alt danışman (office_agent) daveti
          gönderebilirsiniz. Kayıtlı olmayan danışmanlar için yeni hesap açılır;
          sistemde kayıtlı danışmanlara güvenli katılım daveti iletilir.
          <p className="mt-2 font-semibold text-cream">Ekip kotası: {quotaLabel}</p>
        </div>

        <Input
          label="Ad Soyad"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
          placeholder="Örn. Ayşe Yılmaz"
        />
        <Input
          label="E-posta"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          placeholder="ornek@ofis.com"
        />
        <Input
          label="Telefon"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="05xx xxx xx xx"
        />

        {error && (
          <div
            className="rounded-xl border border-primary/55 bg-primary/10 px-4 py-3 text-sm text-cream"
            role="alert"
          >
            {error}
          </div>
        )}
      </form>
    </Modal>
  );
}
