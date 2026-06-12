"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

interface InviteSignupFormProps {
  inviteToken: string;
  email: string;
}

export function InviteSignupForm({ inviteToken, email }: InviteSignupFormProps) {
  const router = useRouter();
  const { signIn, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [targetRole, setTargetRole] = useState<string | null>(null);
  const [signupBlocked, setSignupBlocked] = useState(false);

  useEffect(() => {
    let mounted = true;

    const validateInvite = async () => {
      const params = new URLSearchParams({
        token: inviteToken,
        email,
      });

      try {
        const response = await fetch(`/api/team/register-invite?${params.toString()}`);
        const payload = (await response.json()) as {
          error?: string;
          valid?: boolean;
          target_role?: string;
          account_exists?: boolean;
        };

        if (!mounted) {
          return;
        }

        if (!response.ok) {
          setError(payload.error ?? "Davet doğrulanamadı.");
          setSignupBlocked(true);
          setValidating(false);
          return;
        }

        if (payload.account_exists) {
          router.replace(
            `/giris?email=${encodeURIComponent(email)}&next=${encodeURIComponent("/panelim")}`
          );
          return;
        }

        setTargetRole(payload.target_role ?? null);
        setValidating(false);
      } catch {
        if (mounted) {
          setError("Davet doğrulanamadı. Lütfen tekrar deneyin.");
          setValidating(false);
        }
      }
    };

    void validateInvite();

    return () => {
      mounted = false;
    };
  }, [email, inviteToken, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (signupBlocked) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/team/register-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: inviteToken,
          invite_token: inviteToken,
          email,
          password,
          full_name: fullName,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        redirect_to_login?: boolean;
        redirect_to?: string;
      };

      if (!response.ok) {
        if (payload.redirect_to_login) {
          setError(payload.error ?? "Hesap zaten mevcut.");
          window.setTimeout(() => {
            router.replace(
              `/giris?email=${encodeURIComponent(email)}&next=${encodeURIComponent("/panelim")}`
            );
          }, 1500);
          return;
        }

        setError(payload.error ?? "Kayıt tamamlanamadı.");
        if (response.status === 410) {
          setSignupBlocked(true);
        }
        return;
      }

      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(
          "Kayıt oluşturuldu ancak oturum açılamadı. Lütfen giriş yapın."
        );
        router.replace(
          `/giris?email=${encodeURIComponent(email)}&next=${encodeURIComponent("/panelim")}`
        );
        return;
      }

      await refreshProfile();
      router.replace(payload.redirect_to ?? "/panelim");
      router.refresh();
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <Card className="mx-auto w-full max-w-md py-12 text-center">
        <p className="text-cream/50">Davet bağlantısı doğrulanıyor...</p>
      </Card>
    );
  }

  const roleLabel =
    targetRole === "broker_owner" ? "Alt Ofis / Şube Broker" : "Ofis Danışmanı";

  return (
    <Card className="mx-auto w-full max-w-md">
      <div className="mb-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Kurumsal Davet Kaydı
        </p>
        <h1 className="mt-3 text-2xl font-bold text-cream">Hesabınızı Oluşturun</h1>
        <p className="mt-2 text-sm leading-relaxed text-cream/55">
          Sistem dışı davet ile {roleLabel} olarak ekibe katılıyorsunuz.
          Kayıt sonrası sözleşmeyi onaylamadan panele erişemezsiniz.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Ad Soyad"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
          placeholder="Adınız Soyadınız"
        />
        <Input
          label="E-posta"
          type="email"
          value={email}
          readOnly
          className="opacity-80"
          required
        />
        <Input
          label="Şifre"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={6}
          placeholder="En az 6 karakter"
        />

        {error && (
          <div
            className="rounded-xl border border-red-500/35 bg-red-950/20 px-4 py-3 text-sm text-red-300"
            role="alert"
          >
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading || signupBlocked} className="w-full">
          {loading ? "Kayıt Oluşturuluyor..." : "Kayıt Ol"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-cream/50">
        Zaten hesabınız var mı?{" "}
        <Link
          href={`/giris?email=${encodeURIComponent(email)}&next=${encodeURIComponent("/panelim")}`}
          className="font-medium text-primary hover:underline"
        >
          Giriş yapın
        </Link>
      </div>
    </Card>
  );
}
