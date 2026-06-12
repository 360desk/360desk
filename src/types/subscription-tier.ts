export type SubscriptionTier =
  | "free_trial"
  | "pro_professional"
  | "bagimsiz_ofis"
  | "enterprise_franchise";

export interface SubscriptionPackageDefinition {
  tier: SubscriptionTier;
  title: string;
  subtitle: string;
  priceLabel: string;
  maxListingLimit: number;
  maxImagePerListing: number;
  maxTeamMembers: number;
  highlights: string[];
  badge?: string;
}

export interface ProfileQuotaSnapshot {
  subscriptionTier: SubscriptionTier;
  maxListingLimit: number;
  maxImagePerListing: number;
  currentListingCount: number;
  contractAccepted: boolean;
  isAtListingLimit: boolean;
  canCreateListing: boolean;
  trialDaysRemaining: number | null;
}

export interface TeamQuotaSnapshot {
  subscriptionTier: SubscriptionTier;
  maxTeamMembers: number;
  currentTeamSize: number;
  pendingTeamSize: number;
  totalReservedTeamSize: number;
  canAddTeamMember: boolean;
}

export interface SubscriptionStatusSnapshot {
  subscriptionTier: SubscriptionTier;
  packageLabel: string;
  badgeLabel: string;
  isTrial: boolean;
  trialDaysRemaining: number | null;
  isTrialExpired: boolean;
}
