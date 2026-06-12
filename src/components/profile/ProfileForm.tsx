"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { updateVendorProfile } from "@/lib/supabase/profile";
import {
  isProfileComplete,
  profileToFormFields,
  validateProfileForm,
  type ProfileFormFields,
} from "@/lib/profile";
import { ProfileImageUploadZone } from "@/components/profile/ProfileImageUploadZone";
import { PROFESSIONAL_LEVEL_OPTIONS } from "@/lib/professional-level";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

interface ProfileFormProps {
  redirectTo?: string;
}

export function ProfileForm({ redirectTo = "/panelim" }: ProfileFormProps) {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ProfileFormFields, string>>
  >({});

  const [fields, setFields] = useState<ProfileFormFields>(() =>
    profileToFormFields(profile, user?.user_metadata)
  );

  useEffect(() => {
    setFields(profileToFormFields(profile, user?.user_metadata));
  }, [profile, user?.user_metadata]);

  const completed = isProfileComplete(profile);

  const selectClassName =
    "w-full appearance-none rounded-lg border border-cream/15 bg-charcoal px-4 py-2.5 pr-10 text-sm text-cream outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50";

  const updateField = <K extends keyof ProfileFormFields>(
    key: K,
    value: ProfileFormFields[K]
  ) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateProfileForm(fields);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    if (!user) {
      setError("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      return;
    }

    setLoading(true);
    setError("");

    const { error: saveError } = await updateVendorProfile(
      supabase,
      user.id,
      fields
    );

    if (saveError) {
      setError(saveError);
      setLoading(false);
      return;
    }

    await refreshProfile();
    router.push(redirectTo);
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <Card className="border-cream/10 bg-charcoal-light p-0 overflow-hidden">
        <div className="border-b border-cream/10 px-5 py-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            B2B Kimlik Doğrulama
          </p>
          <h2 className="mt-1 text-lg font-semibold text-cream">
            {completed ? "Hesap & TTBS Bilgileri" : "Profil Tamamlama"}
          </h2>
          <p className="mt-1 text-sm text-cream/50">
            TTBS belge numaralarınız ve kurumsal kimlik bilgileriniz ilan
            yayınlamadan önce doğrulanır.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="divide-y divide-cream/10">
          <ProfileImageUploadZone
            userId={user?.id ?? ""}
            profile={profile}
            disabled={loading || !user}
            onUploaded={refreshProfile}
          />

          <section className="px-5 py-5 sm:px-6 flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-semibold text-cream">
                Kişisel Bilgiler
              </h3>
              <p className="text-xs text-cream/40 mt-1">
                Ad soyad ve onaylı iletişim numaranız
              </p>
            </div>

            <Input
              label="Ad Soyad"
              value={fields.full_name}
              onChange={(e) => updateField("full_name", e.target.value)}
              placeholder="Adınız Soyadınız"
              error={fieldErrors.full_name}
              disabled={loading}
            />

            <Input
              label="Onaylı Telefon Numarası"
              type="tel"
              value={fields.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="05XX XXX XX XX"
              error={fieldErrors.phone}
              disabled={loading}
            />

            {profile?.email && (
              <div className="rounded-lg border border-cream/10 bg-charcoal px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wider text-cream/40">
                  Kayıtlı E-posta
                </p>
                <p className="mt-1 text-sm text-cream/80">{profile.email}</p>
              </div>
            )}
          </section>

          <section className="px-5 py-5 sm:px-6 flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-semibold text-cream">
                Bireysel TTBS
              </h3>
              <p className="text-xs text-cream/40 mt-1">
                Taşınması kolaylaştırılmış gayrimenkul ticareti belge numaranız
              </p>
            </div>

            <Input
              label="Bireysel TTBS Belge Numarası"
              value={fields.ttbs_no}
              onChange={(e) => updateField("ttbs_no", e.target.value)}
              placeholder="TTBS-XXXXXXXX"
              error={fieldErrors.ttbs_no}
              disabled={loading}
              className="font-mono tracking-wide"
            />

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="professional-level"
                className="text-sm font-medium text-cream/80"
              >
                Mesleki Yeterlilik Seviyesi
              </label>
              <div className="relative">
                <select
                  id="professional-level"
                  value={fields.professional_level}
                  disabled={loading}
                  onChange={(event) =>
                    updateField(
                      "professional_level",
                      event.target.value as ProfileFormFields["professional_level"]
                    )
                  }
                  className={`${selectClassName} ${
                    fieldErrors.professional_level ? "border-red-500" : ""
                  }`}
                >
                  <option value="" disabled>
                    Lütfen Seçiniz...
                  </option>
                  {PROFESSIONAL_LEVEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              {fieldErrors.professional_level && (
                <p className="text-xs text-red-400">
                  {fieldErrors.professional_level}
                </p>
              )}
            </div>
          </section>

          <section className="px-5 py-5 sm:px-6 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-cream">
                  Kurumsal Bilgiler
                </h3>
                <p className="text-xs text-cream/40 mt-1">
                  Bağımsız emlak ofisi veya ajans olarak faaliyet gösteriyorsanız
                </p>
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-lg border border-cream/10 bg-charcoal px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={fields.is_independent_office}
                onChange={(e) =>
                  updateField("is_independent_office", e.target.checked)
                }
                disabled={loading}
                className="h-4 w-4 rounded border-cream/20 bg-charcoal text-primary focus:ring-primary/40"
              />
              <span className="text-sm text-cream/80">
                Bağımsız ofis / ajans olarak çalışıyorum
              </span>
            </label>

            {fields.is_independent_office && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input
                    label="Firma / Ajans Adı"
                    value={fields.company_name}
                    onChange={(e) =>
                      updateField("company_name", e.target.value)
                    }
                    placeholder="Örn: 360 Emlak"
                    error={fieldErrors.company_name}
                    disabled={loading}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Kurumsal TTBS Numarası"
                    value={fields.company_ttbs_no}
                    onChange={(e) =>
                      updateField("company_ttbs_no", e.target.value)
                    }
                    placeholder="Kurumsal TTBS-XXXXXXXX"
                    error={fieldErrors.company_ttbs_no}
                    disabled={loading}
                    className="font-mono tracking-wide"
                  />
                </div>
              </div>
            )}
          </section>

          <div className="px-5 py-5 sm:px-6 flex flex-col gap-4">
            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-950/20 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading
                ? "Kaydediliyor..."
                : completed
                  ? "Profili Güncelle"
                  : "Profili Kaydet ve Devam Et"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
