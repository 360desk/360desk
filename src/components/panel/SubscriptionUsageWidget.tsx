"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useProfileQuota } from "@/hooks/useProfileQuota";
import {
  getPackageDisplayName,
  getPortfolioQuotaLabel,
  isTrialSubscriptionTier,
} from "@/lib/subscription-display";
import { calculateTrialDaysRemaining } from "@/lib/supabase/profile-quota";
import { useAuth } from "@/contexts/AuthContext";
import type { SubscriptionLimits } from "@/types/subscription";

interface SubscriptionUsageWidgetProps {
  limits: SubscriptionLimits;
  loading?: boolean;
}

export function SubscriptionUsageWidget({
  limits,
  loading = false,
}: SubscriptionUsageWidgetProps) {
  const { profile } = useAuth();
  const { quota, loading: quotaLoading } = useProfileQuota();

  const tier = quota.subscriptionTier;
  const packageName = getPackageDisplayName(tier);
  const portfolioQuotaLabel = getPortfolioQuotaLabel(tier);
  const isTrial = isTrialSubscriptionTier(tier);
  const trialDaysRemaining = isTrial
    ? (quota.trialDaysRemaining ??
      calculateTrialDaysRemaining(profile?.created_at))
    : null;

  const usagePercent = quota.maxListingLimit
    ? Math.min(100, (quota.currentListingCount / quota.maxListingLimit) * 100)
    : 0;

  const widgetLoading = loading || quotaLoading;

  return (
    <Card className="overflow-hidden border-cream/10 bg-charcoal-light p-0">
      <div className="border-b border-cream/10 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Paket Kullanımı
            </p>
            <h2 className="mt-1 text-lg font-semibold text-cream">
              {widgetLoading ? "Yükleniyor..." : packageName}
            </h2>
          </div>
          {isTrial ? (
            <div className="rounded-lg border border-cream/10 bg-charcoal px-3 py-2 text-right">
              <p className="text-xs uppercase tracking-wider text-cream/40">
                Deneme Süresi
              </p>
              <p className="text-sm font-semibold text-cream">
                {widgetLoading ? "—" : `${trialDaysRemaining ?? 0} gün`}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-right">
              <p className="text-xs uppercase tracking-wider text-cream/40">
                Aktif Paket
              </p>
              <p className="text-sm font-semibold text-cream">
                {widgetLoading ? "—" : packageName}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-4 sm:px-6">
        <div className="mb-2 flex items-end justify-between gap-4">
          <p className="text-sm text-cream/70">
            {portfolioQuotaLabel}:{" "}
            <span className="font-semibold text-cream">
              {widgetLoading
                ? "—"
                : `${quota.currentListingCount} / ${quota.maxListingLimit}`}
            </span>
          </p>
          {!widgetLoading && quota.isAtListingLimit && (
            <span className="text-xs font-medium text-primary">Limit dolu</span>
          )}
        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full border border-cream/10 bg-charcoal">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: widgetLoading ? "0%" : `${usagePercent}%` }}
          />
        </div>

        <p className="mt-3 text-xs leading-relaxed text-cream/40">
          Portföy kotası, arşivlenmemiş tüm ilanlarınızı kapsar. Görünürlük
          limiti (MLS/Herkese Açık):{" "}
          {widgetLoading
            ? "—"
            : `${limits.activeAdCount} / ${limits.maxActiveAds}`}{" "}
          onaylı ilan.
        </p>

        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-cream/10 bg-charcoal px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-cream/40">
              {portfolioQuotaLabel}
            </p>
            <p className="mt-1 text-sm font-medium text-cream">
              {widgetLoading
                ? "—"
                : `${quota.currentListingCount} / ${quota.maxListingLimit} ilan`}
            </p>
          </div>
          <Link href="/panel/uyelik">
            <Button size="sm" variant="outline">
              Paketi Yükselt
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
