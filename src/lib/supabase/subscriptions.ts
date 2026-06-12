import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildOwnershipScopeFilter,
  resolveOwnershipContext,
} from "@/lib/supabase/ownership";
import type { Profile, VisibilityMode } from "@/types/database";
import type { SubscriptionLimits, UserSubscription } from "@/types/subscription";

export const ACTIVE_AD_LIMIT_MESSAGE =
  "Mevcut paketinizin aktif ilan yayınlama limitine ulaştınız. Daha fazla ilan yayınlayabilmek için paketinizi yükseltmeniz gerekmektedir.";

const DEFAULT_TRIAL_DAYS = 60;
const DEFAULT_MAX_ACTIVE_ADS = 5;
const DEFAULT_PACKAGE_NAME = "Deneme Paketi";

const ACTIVE_VISIBILITY_MODES: VisibilityMode[] = ["public", "internal_mls"];

function isActiveVisibility(mode: VisibilityMode | null | undefined): boolean {
  return ACTIVE_VISIBILITY_MODES.includes(mode ?? "private");
}

function calculateTrialDaysRemaining(
  subscription: UserSubscription | null
): number {
  if (!subscription?.trial_end_at) {
    return subscription ? 0 : DEFAULT_TRIAL_DAYS;
  }

  const remaining = Math.ceil(
    (new Date(subscription.trial_end_at).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24)
  );

  return Math.max(0, remaining);
}

export async function fetchUserSubscription(
  supabase: SupabaseClient,
  billingUserId: string
): Promise<UserSubscription | null> {
  const { data, error } = await supabase
    .from("user_subscriptions")
    .select(
      `
      id,
      user_id,
      package_id,
      status,
      trial_start_at,
      trial_end_at,
      membership_packages (
        id,
        name,
        max_active_ads
      )
    `
    )
    .eq("user_id", billingUserId)
    .in("status", ["active", "trial"])
    .order("trial_start_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("fetchUserSubscription:", error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  const rawPackages = data.membership_packages as
    | UserSubscription["membership_packages"]
    | UserSubscription["membership_packages"][]
    | null;

  const membership_packages = Array.isArray(rawPackages)
    ? (rawPackages[0] ?? null)
    : rawPackages;

  return {
    ...data,
    membership_packages,
  } as UserSubscription;
}

export async function countActiveAds(
  supabase: SupabaseClient,
  profile: Profile | null,
  userId: string,
  excludeAdId?: string
): Promise<number> {
  const { ownerId } = resolveOwnershipContext(profile, userId);

  let query = supabase
    .from("classified_ads")
    .select("id", { count: "exact", head: true })
    .in("visibility_mode", ACTIVE_VISIBILITY_MODES)
    .eq("status", "approved")
    .eq("is_archived", false)
    .or(buildOwnershipScopeFilter(ownerId, userId));

  if (excludeAdId) {
    query = query.neq("id", excludeAdId);
  }

  const { count, error } = await query;

  if (error) {
    console.error("countActiveAds:", error.message);
    return 0;
  }

  return count ?? 0;
}

export async function fetchSubscriptionLimits(
  supabase: SupabaseClient,
  profile: Profile | null,
  userId: string
): Promise<SubscriptionLimits> {
  const { billingUserId } = resolveOwnershipContext(profile, userId);
  const subscription = await fetchUserSubscription(supabase, billingUserId);
  const activeAdCount = await countActiveAds(supabase, profile, userId);

  const maxActiveAds =
    subscription?.membership_packages?.max_active_ads ?? DEFAULT_MAX_ACTIVE_ADS;
  const packageName =
    subscription?.membership_packages?.name ?? DEFAULT_PACKAGE_NAME;
  const trialDaysRemaining = calculateTrialDaysRemaining(subscription);
  const isAtLimit = activeAdCount >= maxActiveAds;

  return {
    packageName,
    maxActiveAds,
    activeAdCount,
    trialDaysRemaining,
    isAtLimit,
    canExpandVisibility: !isAtLimit,
  };
}

export async function validateActiveAdLimitForVisibility(
  supabase: SupabaseClient,
  profile: Profile | null,
  userId: string,
  currentMode: VisibilityMode,
  nextMode: VisibilityMode,
  excludeAdId?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isActiveVisibility(nextMode)) {
    return { ok: true };
  }

  if (isActiveVisibility(currentMode)) {
    return { ok: true };
  }

  const activeAdCount = await countActiveAds(
    supabase,
    profile,
    userId,
    excludeAdId
  );

  const limits = await fetchSubscriptionLimits(supabase, profile, userId);

  if (activeAdCount >= limits.maxActiveAds) {
    return { ok: false, error: ACTIVE_AD_LIMIT_MESSAGE };
  }

  return { ok: true };
}
