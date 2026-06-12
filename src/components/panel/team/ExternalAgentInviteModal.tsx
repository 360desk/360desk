"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { primaryActionClass } from "@/components/panel/team/TeamInviteActionsBar";
import type { TeamInviteMode } from "@/lib/supabase/team-invite-engine";
import type { TeamQuotaSnapshot } from "@/types/subscription-tier";

interface ExternalAgentInviteModalProps {
  open: boolean;
  quota: TeamQuotaSnapshot | null;
  title?: string;
  onClose: () => void;
  onSuccess: (mode: TeamInviteMode) => void;
}

export function ExternalAgentInviteModal({
  open,
  quota,
  title = "Sistem Dışı Yeni Danışman Davet Et",
  onClose,
  onSuccess,
}: ExternalAgentInviteModalProps) {
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
          invite_flow: "external_agent",
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        success?: boolean;
        mode?: TeamInviteMode;
      };

      if (!response.ok) {
        setError(payload.error ?? "Davet kaydı oluşturulamadı.");
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
      title={title}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Vazgeç
          </Button>
          <button
            type="submit"
            form="external-agent-invite-form"
            disabled={loading || quota?.canAddTeamMember === false}
            className={primaryActionClass}
          >
            {loading ? "İşleniyor..." : "Davet Kaydı Oluştur"}
          </button>
        </>
      }
    >
      <form
        id="external-agent-invite-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-cream/70">
          Platformda hesabı olmayan danışmanlar için yalnızca{" "}
          <span className="font-semibold text-cream">team_invitations</span>{" "}
          tablosuna kayıt açılır. Profil ve auth hesabı, davetli kişi kayıt
          olup sözleşmeyi onayladığında oluşturulur.
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
