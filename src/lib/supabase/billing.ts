import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getSubscriptionPackage,
  normalizeSubscriptionTier,
} from "@/lib/subscription-packages";
import { resolveOfficeUserRoleOnUpgrade } from "@/lib/office-hierarchy";
import { isMissingProfileColumnError } from "@/lib/supabase/profile-query";
import type { SubscriptionTier } from "@/types/subscription-tier";

export interface UpgradeSubscriptionInput {
  userId: string;
  tier: SubscriptionTier;
  contractAccepted: boolean;
}

export async function upgradeProfileSubscription(
  supabase: SupabaseClient,
  input: UpgradeSubscriptionInput
): Promise<{ error: string | null }> {
  if (!input.contractAccepted) {
    return {
      error:
        "Paket yükseltme için B2B SaaS Hizmet ve Mesleki Üyelik Sözleşmesini onaylamanız gerekir.",
    };
  }

  const tier = normalizeSubscriptionTier(input.tier);
  const pkg = getSubscriptionPackage(tier);

  const hierarchyRole = resolveOfficeUserRoleOnUpgrade(tier);

  const payload: Record<string, unknown> = {
    subscription_tier: tier,
    max_listing_limit: pkg.maxListingLimit,
    max_image_per_listing: pkg.maxImagePerListing,
    contract_accepted: true,
    contract_accepted_at: new Date().toISOString(),
    account_type:
      tier === "enterprise_franchise"
        ? "franchise"
        : tier === "bagimsiz_ofis"
          ? "ofis"
          : "bireysel",
    user_type:
      tier === "enterprise_franchise"
        ? "franchise_admin"
        : tier === "bagimsiz_ofis"
          ? "office_admin"
          : "individual",
    company_leader_id: null,
  };

  if (hierarchyRole) {
    payload.user_role = hierarchyRole;
  }

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", input.userId);

  if (error && isMissingProfileColumnError(error.message)) {
    return {
      error:
        "Abonelik alanları henüz veritabanına eklenmemiş. Lütfen migrasyon 021_add_profile_subscription_columns uygulayın.",
    };
  }

  if (error) {
    return { error: error.message };
  }

  console.log("[billing-upgrade] queued", {
    userId: input.userId,
    tier,
    maxListingLimit: pkg.maxListingLimit,
    maxImagePerListing: pkg.maxImagePerListing,
    processedAt: new Date().toISOString(),
    paymentMode: "dummy_active",
  });

  return { error: null };
}
