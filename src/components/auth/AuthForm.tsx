"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, refreshProfile } = useAuth();
  const nextPath = searchParams.get("next") || "/panelim";
  const prefilledEmail = searchParams.get("email")?.trim().toLowerCase() ?? "";
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }
  }, [prefilledEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError);
    } else {
      await refreshProfile();
      router.replace(nextPath);
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-cream">Giriş Yap</h1>
        <p className="mt-1 text-sm text-cream/50">
          360desk hesabınıza giriş yapın
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="E-posta"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="ornek@email.com"
        />
        <Input
          label="Şifre"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          placeholder="En az 6 karakter"
        />

        {error && (
          <p className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "İşleniyor..." : "Giriş Yap"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-cream/50">
        Hesabınız yok mu?{" "}
        <Link
          href="/fiyatlandirma"
          className="font-medium text-primary hover:underline"
        >
          Paket seçerek üye olun
        </Link>
      </div>
    </Card>
  );
}
