export interface MembershipPackage {
  id: string;
  name: string;
  max_active_ads: number;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  package_id: string;
  status: string;
  trial_start_at: string | null;
  trial_end_at: string | null;
  membership_packages: MembershipPackage | null;
}

export interface SubscriptionLimits {
  packageName: string;
  maxActiveAds: number;
  activeAdCount: number;
  trialDaysRemaining: number;
  isAtLimit: boolean;
  canExpandVisibility: boolean;
}
