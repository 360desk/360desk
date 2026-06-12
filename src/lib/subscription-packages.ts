import type {
  SubscriptionPackageDefinition,
  SubscriptionTier,
} from "@/types/subscription-tier";

export const SUBSCRIPTION_PACKAGES: SubscriptionPackageDefinition[] = [
  {
    tier: "free_trial",
    title: "Ücretsiz Deneme (Free Trial)",
    subtitle: "Yeni üyeler için başlangıç paketi",
    priceLabel: "0 TL",
    maxListingLimit: 5,
    maxImagePerListing: 10,
    maxTeamMembers: 0,
    badge: "Başlangıç",
    highlights: [
      "5 Aktif Portföy Limiti",
      "İlan Başına 10 Görsel",
      "B2B Profesyoneller Rehberine Sınırlı Erişim",
    ],
  },
  {
    tier: "pro_professional",
    title: "PRO PROFESYONEL",
    subtitle: "Bağımsız danışmanlar ve bireysel brokerlar için",
    priceLabel: "₺990 / ay",
    maxListingLimit: 5,
    maxImagePerListing: 8,
    maxTeamMembers: 0,
    highlights: [
      "5 aktif portföy ilanı",
      "İlan başına 8 premium görsel",
      "B2B profesyonel dizin profili",
      "Konum paylaşım ve CRM entegrasyonu",
    ],
  },
  {
    tier: "bagimsiz_ofis",
    title: "BAĞIMSIZ OFİS",
    subtitle: "Yerel acenteler ve butik ofisler için",
    priceLabel: "₺2.490 / ay",
    maxListingLimit: 25,
    maxImagePerListing: 15,
    maxTeamMembers: 10,
    badge: "En Popüler",
    highlights: [
      "25 aktif portföy ilanı",
      "İlan başına 15 premium görsel",
      "Kurumsal logo ve marka vitrini",
      "Alt danışman ekleme ve ofis yönetimi",
      "MLS iç havuz görünürlüğü",
    ],
  },
  {
    tier: "enterprise_franchise",
    title: "ENTERPRISE FRANCHISE",
    subtitle: "Çok şubeli franchise ve ağ yapıları için",
    priceLabel: "Özel Teklif",
    maxListingLimit: 100,
    maxImagePerListing: 25,
    maxTeamMembers: 50,
    highlights: [
      "100+ aktif portföy ilanı",
      "İlan başına 25 premium görsel",
      "Çok şubeli franchise yönetimi",
      "Öncelikli destek ve özel entegrasyon",
      "Kurumsal uyumluluk ve sözleşme yönetimi",
    ],
  },
];

export const DEFAULT_SUBSCRIPTION_TIER: SubscriptionTier = "free_trial";

export const LISTING_LIMIT_REACHED_MESSAGE =
  "İlan Limitine Ulaştınız. Daha fazla portföy yayınlamak ve ekibinize alt danışmanlar eklemek için kurumsal ofis paketine geçiş yapın.";

export const B2B_CONTRACT_LABEL =
  "B2B SaaS Hizmet ve Mesleki Üyelik Sözleşmesini okudum, onaylıyorum.";

export function getSubscriptionPackage(
  tier: SubscriptionTier
): SubscriptionPackageDefinition {
  return (
    SUBSCRIPTION_PACKAGES.find((pkg) => pkg.tier === tier) ??
    SUBSCRIPTION_PACKAGES[0]
  );
}

const SUBSCRIPTION_TIER_VALUES = new Set<SubscriptionTier>([
  "free_trial",
  "pro_professional",
  "bagimsiz_ofis",
  "enterprise_franchise",
]);

export function isSubscriptionTier(
  value: string | null | undefined
): value is SubscriptionTier {
  return (
    typeof value === "string" &&
    SUBSCRIPTION_TIER_VALUES.has(value as SubscriptionTier)
  );
}

function resolveLegacySubscriptionTier(
  value: string
): SubscriptionTier | null {
  if (value === "free") {
    return "free_trial";
  }

  if (value === "independent_office") {
    return "bagimsiz_ofis";
  }

  return null;
}

export function normalizeSubscriptionTier(
  value: string | null | undefined
): SubscriptionTier {
  if (isSubscriptionTier(value)) {
    return value;
  }

  if (typeof value === "string") {
    const legacyTier = resolveLegacySubscriptionTier(value);
    if (legacyTier) {
      return legacyTier;
    }
  }

  return DEFAULT_SUBSCRIPTION_TIER;
}

export function resolveProfileQuotaDefaults(tier: SubscriptionTier): {
  maxListingLimit: number;
  maxImagePerListing: number;
  maxTeamMembers: number;
} {
  const pkg = getSubscriptionPackage(tier);

  return {
    maxListingLimit: pkg.maxListingLimit,
    maxImagePerListing: pkg.maxImagePerListing,
    maxTeamMembers: pkg.maxTeamMembers,
  };
}

export const TEAM_MANAGEMENT_UPGRADE_MESSAGE =
  "Ekip yönetimi ve alt danışman ekleme özellikleri yalnızca Kurumsal Ofis ve Franchise paketlerinde mevcuttur.";

export function hasTeamManagementAccess(
  tier: SubscriptionTier | string | null | undefined
): boolean {
  const normalized = normalizeSubscriptionTier(tier);
  return (
    normalized === "bagimsiz_ofis" || normalized === "enterprise_franchise"
  );
}

export function buildProfileSubscriptionSeed(tier: SubscriptionTier): {
  subscription_tier: SubscriptionTier;
  max_listing_limit: number;
  max_image_per_listing: number;
  account_type: "bireysel" | "ofis" | "franchise";
} {
  const normalizedTier = normalizeSubscriptionTier(tier);
  const pkg = getSubscriptionPackage(normalizedTier);

  return {
    subscription_tier: normalizedTier,
    max_listing_limit: pkg.maxListingLimit,
    max_image_per_listing: pkg.maxImagePerListing,
    account_type:
      normalizedTier === "enterprise_franchise"
        ? "franchise"
        : normalizedTier === "bagimsiz_ofis"
          ? "ofis"
          : "bireysel",
  };
}

export function resolveSignupTierFromMetadata(
  value: string | null | undefined
): SubscriptionTier {
  return normalizeSubscriptionTier(value);
}
