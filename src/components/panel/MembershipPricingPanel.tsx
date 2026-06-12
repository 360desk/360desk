"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PricingTierMatrix } from "@/components/subscription/PricingTierMatrix";
import { useProfileQuota } from "@/hooks/useProfileQuota";
import {
  getPackageDisplayName,
  getPortfolioQuotaLabel,
  isTrialSubscriptionTier,
} from "@/lib/subscription-display";
import {
  B2B_CONTRACT_LABEL,
  getSubscriptionPackage,
} from "@/lib/subscription-packages";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { SubscriptionTier } from "@/types/subscription-tier";

export function MembershipPricingPanel() {
  const { refreshProfile } = useAuth();
  const { quota, loading: quotaLoading, refresh: refreshQuota } =
    useProfileQuota();
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(
    null
  );
  const [contractAccepted, setContractAccepted] = useState(
    () => quota.contractAccepted
  );
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentPackage = useMemo(
    () => getSubscriptionPackage(quota.subscriptionTier),
    [quota.subscriptionTier]
  );
  const packageDisplayName = getPackageDisplayName(quota.subscriptionTier);
  const portfolioQuotaLabel = getPortfolioQuotaLabel(quota.subscriptionTier);

  useEffect(() => {
    if (quota.contractAccepted) {
      setContractAccepted(true);
    }
  }, [quota.contractAccepted]);

  const handleUpgrade = async (tier: SubscriptionTier) => {
    setError("");
    setSuccess("");
    setSelectedTier(tier);

    if (!contractAccepted) {
      setError(
        "Paket yükseltme için B2B SaaS Hizmet ve Mesleki Üyelik Sözleşmesini onaylamanız gerekir."
      );
      return;
    }

    if (tier === quota.subscriptionTier) {
      setError("Zaten bu paketi kullanıyorsunuz.");
      return;
    }

    setUpgrading(true);

    try {
      const response = await fetch("/api/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          contract_accepted: contractAccepted,
        }),
      });

      const result = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        setError(result.error ?? "Paket yükseltme başarısız oldu.");
        return;
      }

      setSuccess(result.message ?? "Paketiniz başarıyla yükseltildi.");
      await Promise.all([refreshProfile(), refreshQuota()]);
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setUpgrading(false);
      setSelectedTier(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            B2B SaaS Üyelik
          </p>
          <h1 className="mt-2 text-3xl font-bold text-cream">
            Paket & Kota Yönetimi
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cream/55">
            Portföy limitinizi, görsel kotanızı ve kurumsal yeteneklerinizi tek
            panelden yönetin. Yükseltme işlemleri dummy ödeme modunda anında
            aktive edilir.
          </p>
        </div>

        <Card className="min-w-[240px] border-primary/20 bg-gradient-to-br from-charcoal via-charcoal-light to-charcoal p-4">
          <p className="text-xs uppercase tracking-wider text-cream/40">
            Mevcut Paket
          </p>
          <p className="mt-1 text-lg font-semibold text-cream">
            {quotaLoading ? "—" : packageDisplayName}
          </p>
          <p className="mt-2 text-xs uppercase tracking-wider text-primary/80">
            {quotaLoading ? "—" : portfolioQuotaLabel}
          </p>
          <p className="mt-2 text-sm text-cream/55">
            {quotaLoading
              ? "—"
              : `${quota.currentListingCount} / ${quota.maxListingLimit} ilan`}
          </p>
          {isTrialSubscriptionTier(quota.subscriptionTier) && (
            <p className="mt-2 text-xs text-cream/45">
              Deneme: {quota.trialDaysRemaining ?? 0} gün kaldı
            </p>
          )}
        </Card>
      </div>

      <Card className="border-cream/10 bg-charcoal-light px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-cream">
              {quotaLoading ? "—" : portfolioQuotaLabel}
            </p>
            <p className="mt-1 text-xs text-cream/45">
              Paket kotanız profil abonelik seviyenizle senkronize edilir.
            </p>
          </div>
          <p className="text-lg font-bold text-primary">
            {quotaLoading
              ? "—"
              : `${quota.currentListingCount} / ${quota.maxListingLimit}`}
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full border border-cream/10 bg-charcoal">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{
              width: quotaLoading
                ? "0%"
                : `${Math.min(100, (quota.currentListingCount / Math.max(quota.maxListingLimit, 1)) * 100)}%`,
            }}
          />
        </div>
      </Card>

      <PricingTierMatrix
        currentTier={quota.subscriptionTier}
        loadingTier={upgrading ? selectedTier : null}
        onTierAction={handleUpgrade}
        getButtonLabel={(tier, isCurrent) => {
          const isFreeTrial = tier === "free_trial";

          if (isCurrent) {
            return isFreeTrial ? "Mevcut Paketiniz" : "Aktif Paket";
          }

          return isFreeTrial ? "Ücretsiz Denemeyi Başlat" : "Paketi Yükselt";
        }}
        isActionDisabled={(tier, isCurrent) => upgrading || isCurrent}
      />

      <Card className="border-cream/10 bg-charcoal-light">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={contractAccepted}
            onChange={(e) => {
              setContractAccepted(e.target.checked);
              if (error) {
                setError("");
              }
            }}
            className="mt-1 h-4 w-4 rounded border-cream/20 bg-charcoal text-primary focus:ring-primary/40"
          />
          <span className="text-sm leading-relaxed text-cream/75">
            {B2B_CONTRACT_LABEL}
          </span>
        </label>
        <p className="mt-3 text-xs text-cream/40">
          Kurumsal uyumluluk gereği paket yükseltme işlemleri sözleşme onayı
          olmadan tamamlanamaz.
        </p>
      </Card>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm text-emerald-400" role="status">
          {success}
        </p>
      )}
    </div>
  );
}
