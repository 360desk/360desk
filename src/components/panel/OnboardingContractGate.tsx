"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import {
  ONBOARDING_LEGAL_SECTIONS,
  requiresOnboardingContract,
} from "@/lib/onboarding-contract";

export function OnboardingContractGate() {
  const { profile, loading, refreshProfile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [hasAcceptedInvite, setHasAcceptedInvite] = useState(false);
  const [lockChecked, setLockChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkLock = async () => {
      try {
        const response = await fetch("/api/team/onboarding-lock");
        const payload = (await response.json()) as {
          locked?: boolean;
          reason?: string | null;
        };

        if (!mounted) {
          return;
        }

        setHasAcceptedInvite(
          payload.locked === true && payload.reason === "invite"
        );
      } catch {
        if (mounted) {
          setHasAcceptedInvite(false);
        }
      } finally {
        if (mounted) {
          setLockChecked(true);
        }
      }
    };

    if (!loading && profile) {
      void checkLock();
    } else if (!loading) {
      setLockChecked(true);
    }

    return () => {
      mounted = false;
    };
  }, [loading, profile]);

  const locked =
    lockChecked &&
    !loading &&
    requiresOnboardingContract(profile, hasAcceptedInvite);

  if (!locked) {
    return null;
  }

  const handleAccept = async () => {
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/profile/accept-contract", {
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Sözleşme onayı kaydedilemedi.");
        return;
      }

      await refreshProfile();
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/80 p-4 backdrop-blur-xl">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl border border-cream/15 bg-charcoal/70 shadow-2xl shadow-black/50 backdrop-blur-2xl">
        <div className="border-b border-cream/10 bg-gradient-to-r from-primary/20 via-charcoal-light/80 to-charcoal px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Kurumsal Onboarding
          </p>
          <h2 className="mt-2 text-2xl font-bold text-cream">
            Kullanıcı Sözleşmesi, Hizmet Şartları ve KVKK Metni
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-cream/60">
            Davet edildiğiniz kurumsal yapıya erişebilmek için aşağıdaki metinleri
            okuyup onaylamanız gerekmektedir. Onay verilene kadar panel kilitli
            kalacaktır.
          </p>
        </div>

        <div className="max-h-[50vh] space-y-5 overflow-y-auto px-6 py-6">
          {ONBOARDING_LEGAL_SECTIONS.map((section) => (
            <div
              key={section.title}
              className="rounded-2xl border border-cream/10 bg-charcoal-light/80 p-4"
            >
              <h3 className="text-sm font-semibold text-cream">{section.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-cream/65">
                {section.body}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-cream/10 bg-charcoal/90 px-6 py-5">
          {error && (
            <p className="mb-3 rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          <Button
            className="w-full"
            disabled={submitting}
            onClick={() => void handleAccept()}
          >
            {submitting ? "Kaydediliyor..." : "Sözleşmeyi Okudum, Onaylıyorum"}
          </Button>
        </div>
      </div>
    </div>
  );
}
