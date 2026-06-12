import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_SUBSCRIPTION_TIER,
  normalizeSubscriptionTier,
  resolveProfileQuotaDefaults,
} from "@/lib/subscription-packages";
import { buildOwnershipScopeFilter, resolveOwnershipContext } from "@/lib/supabase/ownership";
import type { Profile } from "@/types/database";
import type {
  ProfileQuotaSnapshot,
  SubscriptionStatusSnapshot,
  SubscriptionTier,
} from "@/types/subscription-tier";

export const LISTING_CREATION_LIMIT_MESSAGE =
  "İlan Limitine Ulaştınız. Daha fazla portföy yayınlamak ve ekibinize alt danışmanlar eklemek için kurumsal ofis paketine geçiş yapın.";

const DEFAULT_MAX_LISTING_LIMIT = 5;
const DEFAULT_MAX_IMAGE_PER_LISTING = 10;
export const TRIAL_PERIOD_DAYS = 14;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const SUBSCRIPTION_BADGE_LABELS: Record<SubscriptionTier, string> = {
  free_trial: "Ücretsiz Deneme",
  pro_professional: "Pro Profesyonel",
  bagimsiz_ofis: "Bağımsız Ofis",
  enterprise_franchise: "Enterprise Franchise",
};

export function calculateTrialDaysRemaining(
  createdAt: string | null | undefined,
  referenceDate: Date = new Date()
): number {
  if (!createdAt) {
    return TRIAL_PERIOD_DAYS;
  }

  const createdDate = new Date(createdAt);

  if (Number.isNaN(createdDate.getTime())) {
    return TRIAL_PERIOD_DAYS;
  }

  const elapsedDays = Math.floor(
    (referenceDate.getTime() - createdDate.getTime()) / MS_PER_DAY
  );

  return Math.max(0, TRIAL_PERIOD_DAYS - elapsedDays);
}

export function getSubscriptionBadgeLabel(tier: SubscriptionTier): string {
  return SUBSCRIPTION_BADGE_LABELS[tier];
}

export function buildSubscriptionStatusSnapshot(
  profile: Profile | null
): SubscriptionStatusSnapshot {
  const subscriptionTier = resolveProfileSubscriptionTier(profile);
  const packageLabel = getSubscriptionBadgeLabel(subscriptionTier);
  const isTrial = subscriptionTier === "free_trial";
  const trialDaysRemaining = isTrial
    ? calculateTrialDaysRemaining(profile?.created_at)
    : null;
  const isTrialExpired = isTrial && (trialDaysRemaining ?? 0) <= 0;

  const badgeLabel = isTrial
    ? `Paket: Ücretsiz Deneme (${trialDaysRemaining ?? 0} Gün Kaldı)`
    : `Paket: ${packageLabel}`;

  return {
    subscriptionTier,
    packageLabel,
    badgeLabel,
    isTrial,
    trialDaysRemaining,
    isTrialExpired,
  };
}

export function resolveProfileListingLimit(profile: Profile | null): number {
  if (
    typeof profile?.max_listing_limit === "number" &&
    Number.isFinite(profile.max_listing_limit) &&
    profile.max_listing_limit > 0
  ) {
    return profile.max_listing_limit;
  }

  const tier = normalizeSubscriptionTier(profile?.subscription_tier);
  return resolveProfileQuotaDefaults(tier).maxListingLimit;
}

export function resolveProfileImageLimit(profile: Profile | null): number {
  if (
    typeof profile?.max_image_per_listing === "number" &&
    Number.isFinite(profile.max_image_per_listing) &&
    profile.max_image_per_listing > 0
  ) {
    return profile.max_image_per_listing;
  }

  const tier = normalizeSubscriptionTier(profile?.subscription_tier);
  return resolveProfileQuotaDefaults(tier).maxImagePerListing;
}

export function resolveProfileSubscriptionTier(
  profile: Profile | null
): SubscriptionTier {
  return normalizeSubscriptionTier(
    profile?.subscription_tier ?? DEFAULT_SUBSCRIPTION_TIER
  );
}

export async function countUserListings(
  supabase: SupabaseClient,
  profile: Profile | null,
  userId: string
): Promise<number> {
  const { ownerId } = resolveOwnershipContext(profile, userId);

  const { count, error } = await supabase
    .from("classified_ads")
    .select("id", { count: "exact", head: true })
    .eq("is_archived", false)
    .or(buildOwnershipScopeFilter(ownerId, userId));

  if (error) {
    console.error("countUserListings:", error.message);
    return 0;
  }

  return count ?? 0;
}

export async function fetchProfileQuotaSnapshot(
  supabase: SupabaseClient,
  profile: Profile | null,
  userId: string
): Promise<ProfileQuotaSnapshot> {
  const [currentListingCount, maxListingLimit, maxImagePerListing] =
    await Promise.all([
      countUserListings(supabase, profile, userId),
      Promise.resolve(resolveProfileListingLimit(profile)),
      Promise.resolve(resolveProfileImageLimit(profile)),
    ]);

  const subscriptionTier = resolveProfileSubscriptionTier(profile);
  const isAtListingLimit = currentListingCount >= maxListingLimit;
  const trialDaysRemaining =
    subscriptionTier === "free_trial"
      ? calculateTrialDaysRemaining(profile?.created_at)
      : null;

  return {
    subscriptionTier,
    maxListingLimit,
    maxImagePerListing,
    currentListingCount,
    contractAccepted: Boolean(profile?.contract_accepted),
    isAtListingLimit,
    canCreateListing: !isAtListingLimit,
    trialDaysRemaining,
  };
}

export async function validateListingCreationQuota(
  supabase: SupabaseClient,
  profile: Profile | null,
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const quota = await fetchProfileQuotaSnapshot(supabase, profile, userId);

  if (!quota.canCreateListing) {
    return { ok: false, error: LISTING_CREATION_LIMIT_MESSAGE };
  }

  return { ok: true };
}

export function buildProfileQuotaFromPartial(
  profile: Profile | null
): Pick<
  ProfileQuotaSnapshot,
  "maxListingLimit" | "maxImagePerListing" | "subscriptionTier" | "contractAccepted"
> {
  return {
    subscriptionTier: resolveProfileSubscriptionTier(profile),
    maxListingLimit: resolveProfileListingLimit(profile),
    maxImagePerListing: resolveProfileImageLimit(profile),
    contractAccepted: Boolean(profile?.contract_accepted),
  };
}

export function getDefaultProfileQuotaValues() {
  return {
    maxListingLimit: DEFAULT_MAX_LISTING_LIMIT,
    maxImagePerListing: DEFAULT_MAX_IMAGE_PER_LISTING,
    subscriptionTier: DEFAULT_SUBSCRIPTION_TIER as SubscriptionTier,
  };
}

export function buildDefaultProfileQuotaSnapshot(): ProfileQuotaSnapshot {
  const defaults = getDefaultProfileQuotaValues();

  return {
    subscriptionTier: defaults.subscriptionTier,
    maxListingLimit: defaults.maxListingLimit,
    maxImagePerListing: defaults.maxImagePerListing,
    currentListingCount: 0,
    contractAccepted: false,
    isAtListingLimit: false,
    canCreateListing: true,
    trialDaysRemaining: TRIAL_PERIOD_DAYS,
  };
}
