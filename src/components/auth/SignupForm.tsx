"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getSubscriptionPackage,
  normalizeSubscriptionTier,
} from "@/lib/subscription-packages";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp } = useAuth();

  const selectedTier = useMemo(
    () => normalizeSubscriptionTier(searchParams.get("tier")),
    [searchParams]
  );

  const selectedPackage = useMemo(
    () => getSubscriptionPackage(selectedTier),
    [selectedTier]
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchParams.get("tier")) {
      router.replace("/fiyatlandirma");
    }
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { error: signUpError } = await signUp(
        email,
        password,
        fullName,
        selectedTier
      );

      if (signUpError) {
        setError(signUpError);
        return;
      }

      setSuccess(
        "Kayıt başarılı! E-posta doğrulaması gerekiyorsa lütfen gelen kutunuzu kontrol edin."
      );

      window.setTimeout(() => {
        router.replace(`/giris?next=/panelim&tier=${selectedTier}`);
      }, 1200);
    } catch {
      setError(
        "Kayıt sırasında beklenmeyen bir hata oluştu. Lütfen tekrar deneyin."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <div className="mb-6 text-center">
        <Link
          href="/fiyatlandirma"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-cream/50 transition-colors hover:text-cream"
        >
          ← Paket Seçimine Dön
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-cream">Hesabınızı Oluşturun</h1>
        <p className="mt-1 text-sm text-cream/50">
          Seçtiğiniz paketle kaydınızı tamamlayın
        </p>
      </div>

      <div className="mb-5 rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-charcoal to-charcoal-light px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Seçilen Paket
        </p>
        <p className="mt-1 text-base font-semibold text-cream">
          {selectedPackage.title}
        </p>
        <p className="mt-1 text-sm text-cream/55">
          {selectedPackage.maxListingLimit} ilan ·{" "}
          {selectedPackage.maxImagePerListing} görsel / ilan ·{" "}
          {selectedPackage.priceLabel}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Ad Soyad"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          placeholder="Adınız Soyadınız"
        />
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
          <div
            className="rounded-xl border border-primary/55 bg-gradient-to-br from-primary/20 via-primary/10 to-charcoal px-4 py-3 shadow-lg shadow-primary/15"
            role="alert"
            aria-live="polite"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Doğrulama Uyarısı
            </p>
            <p className="mt-2 text-sm font-medium leading-relaxed text-cream">
              {error}
            </p>
          </div>
        )}
        {success && (
          <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
            {success}
          </p>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Kayıt Oluşturuluyor..." : "Kayıt Ol ve Başla"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-cream/50">
        Zaten hesabınız var mı?{" "}
        <Link href="/giris" className="font-medium text-primary hover:underline">
          Giriş yapın
        </Link>
      </div>
    </Card>
  );
}
