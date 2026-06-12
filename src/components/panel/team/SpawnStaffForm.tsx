"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

interface SpawnStaffFormProps {
  onSuccess: () => void;
}

export function SpawnStaffForm({ onSuccess }: SpawnStaffFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const response = await fetch("/api/team/spawn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
        phone,
      }),
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Danışman hesabı oluşturulamadı.");
      setLoading(false);
      return;
    }

    setEmail("");
    setPassword("");
    setFullName("");
    setPhone("");
    setSuccess("Yeni ofis danışmanı başarıyla oluşturuldu.");
    onSuccess();
    setLoading(false);
  };

  return (
    <Card className="border-cream/10 bg-charcoal-light">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Doğrudan Hesap Oluştur
        </p>
        <h3 className="mt-1 text-lg font-semibold text-cream">
          Ofis Danışmanı Ekle
        </h3>
        <p className="mt-1 text-sm text-cream/50">
          E-posta ve şifre ile yeni bir ofis danışmanı hesabı oluşturun.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Ad Soyad"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Örn. Ayşe Yılmaz"
        />
        <Input
          label="E-posta"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="danisman@ofis.com"
        />
        <Input
          label="Telefon"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="05xx xxx xx xx"
        />
        <Input
          label="Geçici Şifre"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="En az 8 karakter"
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
          {loading ? "Oluşturuluyor..." : "Danışman Hesabı Oluştur"}
        </Button>
      </form>
    </Card>
  );
}
