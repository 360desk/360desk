"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { secondaryActionClass } from "@/components/panel/team/TeamInviteActionsBar";
import type { TeamInviteMode } from "@/lib/supabase/team-invite-engine";
import type { TeamQuotaSnapshot } from "@/types/subscription-tier";

interface InternalAgentInviteModalProps {
  open: boolean;
  quota: TeamQuotaSnapshot | null;
  onClose: () => void;
  onSuccess: (mode: TeamInviteMode) => void;
}

export function InternalAgentInviteModal({
  open,
  quota,
  onClose,
  onSuccess,
}: InternalAgentInviteModalProps) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
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

    if (!email.trim() && !phone.trim()) {
      setError("E-posta veya telefon alanlarından en az biri zorunludur.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          full_name: email.trim() || phone.trim(),
          invite_flow: "internal_agent",
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        success?: boolean;
        mode?: TeamInviteMode;
      };

      if (!response.ok) {
        setError(payload.error ?? "İç davet kaydı oluşturulamadı.");
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
      title="Mevcut Kayıtlı Danışmanı Ofise Davet Et"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Vazgeç
          </Button>
          <button
            type="submit"
            form="internal-agent-invite-form"
            disabled={loading || quota?.canAddTeamMember === false}
            className={secondaryActionClass}
          >
            {loading ? "İşleniyor..." : "İç Davet Gönder"}
          </button>
        </>
      }
    >
      <form
        id="internal-agent-invite-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <div className="rounded-xl border border-cream/15 bg-charcoal-light/80 px-4 py-3 text-sm text-cream/70">
          Platformda kayıtlı danışmanları e-posta veya telefon ile arayın. Bulunan
          kayıt için yalnızca{" "}
          <span className="font-semibold text-cream">team_invitations</span>{" "}
          tablosuna pending davet açılır; profil tablosuna dokunulmaz.
          <p className="mt-2 font-semibold text-cream">Ekip kotası: {quotaLabel}</p>
        </div>

        <Input
          label="Kayıtlı E-posta"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="kayitli@danisman.com"
        />
        <Input
          label="Kayıtlı Telefon"
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
