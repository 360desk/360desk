"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SUBSCRIPTION_PACKAGES } from "@/lib/subscription-packages";
import type { SubscriptionTier } from "@/types/subscription-tier";

interface PricingTierMatrixProps {
  currentTier?: SubscriptionTier | null;
  onTierAction: (tier: SubscriptionTier) => void;
  getButtonLabel: (tier: SubscriptionTier, isCurrent: boolean) => string;
  isActionDisabled?: (tier: SubscriptionTier, isCurrent: boolean) => boolean;
  loadingTier?: SubscriptionTier | null;
}

export function PricingTierMatrix({
  currentTier = null,
  onTierAction,
  getButtonLabel,
  isActionDisabled,
  loadingTier = null,
}: PricingTierMatrixProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {SUBSCRIPTION_PACKAGES.map((pkg) => {
        const isCurrent = currentTier === pkg.tier;
        const isFeatured = pkg.tier === "bagimsiz_ofis";
        const isFreeTrial = pkg.tier === "free_trial";
        const disabled =
          isActionDisabled?.(pkg.tier, isCurrent) ?? (isCurrent || Boolean(loadingTier));

        return (
          <div
            key={pkg.tier}
            className={`rounded-2xl p-[1px] ${
              isFeatured
                ? "bg-gradient-to-br from-primary/80 via-cream/25 to-primary/40"
                : isFreeTrial
                  ? "bg-gradient-to-br from-cream/20 via-charcoal-light/40 to-cream/10"
                  : "bg-cream/10"
            }`}
          >
            <Card
              hover
              className={`flex h-full flex-col rounded-2xl border-0 bg-charcoal p-6 ${
                isCurrent ? "ring-1 ring-primary/40" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    {pkg.title}
                  </p>
                  <p className="mt-2 text-sm text-cream/55">{pkg.subtitle}</p>
                </div>
                {pkg.badge && (
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {pkg.badge}
                  </span>
                )}
              </div>

              <p className="mt-6 text-3xl font-bold tracking-tight text-cream">
                {pkg.priceLabel}
              </p>

              <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                {pkg.highlights.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-cream/70"
                  >
                    <span className="mt-1 text-primary">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-xl border border-cream/10 bg-charcoal-light px-4 py-3 text-xs text-cream/45">
                <p>
                  {pkg.maxListingLimit} aktif ilan · {pkg.maxImagePerListing}{" "}
                  görsel / ilan
                </p>
              </div>

              <Button
                type="button"
                className="mt-6 w-full"
                variant={
                  isFeatured ? "primary" : isFreeTrial ? "outline" : "secondary"
                }
                disabled={disabled}
                onClick={() => onTierAction(pkg.tier)}
              >
                {loadingTier === pkg.tier
                  ? "İşleniyor..."
                  : getButtonLabel(pkg.tier, isCurrent)}
              </Button>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
