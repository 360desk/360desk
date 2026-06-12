import { normalizeSubscriptionTier } from "@/lib/subscription-packages";
import type { SubscriptionTier } from "@/types/subscription-tier";

const PORTFOLIO_QUOTA_LABELS: Record<SubscriptionTier, string> = {
  free_trial: "Ücretsiz Deneme Portföy Kotası",
  pro_professional: "Pro Profesyonel Portföy Kotası",
  bagimsiz_ofis: "Bağımsız Ofis Portföy Kotası",
  enterprise_franchise: "Franchise Portföy Kotası",
};

const PACKAGE_DISPLAY_NAMES: Record<SubscriptionTier, string> = {
  free_trial: "Ücretsiz Deneme",
  pro_professional: "Pro Profesyonel",
  bagimsiz_ofis: "Bağımsız Ofis",
  enterprise_franchise: "Enterprise Franchise",
};

const PACKAGE_SHORT_TITLES: Record<SubscriptionTier, string> = {
  free_trial: "Ücretsiz Deneme Paketi",
  pro_professional: "Pro Profesyonel Paketi",
  bagimsiz_ofis: "Bağımsız Ofis Paketi",
  enterprise_franchise: "Franchise Paketi",
};

export function resolveDisplaySubscriptionTier(
  tier: string | null | undefined
): SubscriptionTier {
  return normalizeSubscriptionTier(tier);
}

export function getPortfolioQuotaLabel(
  tier: string | null | undefined
): string {
  return PORTFOLIO_QUOTA_LABELS[resolveDisplaySubscriptionTier(tier)];
}

export function getPackageDisplayName(
  tier: string | null | undefined
): string {
  return PACKAGE_DISPLAY_NAMES[resolveDisplaySubscriptionTier(tier)];
}

export function getPackageShortTitle(
  tier: string | null | undefined
): string {
  return PACKAGE_SHORT_TITLES[resolveDisplaySubscriptionTier(tier)];
}

export function isTrialSubscriptionTier(
  tier: string | null | undefined
): boolean {
  return resolveDisplaySubscriptionTier(tier) === "free_trial";
}
