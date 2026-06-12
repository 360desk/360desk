"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

interface InviteStaffFormProps {
  onSuccess: () => void;
}

export function InviteStaffForm({ onSuccess }: InviteStaffFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const response = await fetch("/api/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        full_name: email,
        invite_flow: "internal_agent",
      }),
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Davet gönderilemedi.");
      setLoading(false);
      return;
    }

    setEmail("");
    setSuccess(
      "Davet gönderildi. Danışman panelinde daveti kabul edebilir."
    );
    onSuccess();
    setLoading(false);
  };

  return (
    <Card className="border-cream/10 bg-charcoal-light">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Ağ Daveti
        </p>
        <h3 className="mt-1 text-lg font-semibold text-cream">
          Bağımsız Danışman Davet Et
        </h3>
        <p className="mt-1 text-sm text-cream/50">
          Sistemde kayıtlı bağımsız bir danışmanı ofisinize bağlamak için davet
          gönderin.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Danışman E-postası"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="mevcut.danisman@email.com"
        />

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        {success && (
          <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-cream">
            {success}
          </p>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? "Gönderiliyor..." : "Davet Gönder"}
        </Button>
      </form>
    </Card>
  );
}
