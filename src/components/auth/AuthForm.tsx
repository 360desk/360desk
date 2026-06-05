"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function AuthForm() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (mode === "login") {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError);
      } else {
        router.push("/panel");
        router.refresh();
      }
    } else {
      const { error: signUpError } = await signUp(email, password, fullName);
      if (signUpError) {
        setError(signUpError);
      } else {
        setSuccess(
          "Kayıt başarılı! E-posta doğrulaması gerekiyorsa lütfen gelen kutunuzu kontrol edin."
        );
        setMode("login");
      }
    }

    setLoading(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-cream">
          {mode === "login" ? "Giriş Yap" : "Kayıt Ol"}
        </h1>
        <p className="mt-1 text-sm text-cream/50">
          {mode === "login"
            ? "360desk hesabınıza giriş yapın"
            : "Yeni satıcı hesabı oluşturun"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === "register" && (
          <Input
            label="Ad Soyad"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="Adınız Soyadınız"
          />
        )}
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
        {success && (
          <p className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-sm text-emerald-300">
            {success}
          </p>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading
            ? "İşleniyor..."
            : mode === "login"
              ? "Giriş Yap"
              : "Kayıt Ol"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-cream/50">
        {mode === "login" ? (
          <>
            Hesabınız yok mu?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
                setSuccess("");
              }}
              className="text-primary hover:underline font-medium"
            >
              Kayıt olun
            </button>
          </>
        ) : (
          <>
            Zaten hesabınız var mı?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setSuccess("");
              }}
              className="text-primary hover:underline font-medium"
            >
              Giriş yapın
            </button>
          </>
        )}
      </div>
    </Card>
  );
}
