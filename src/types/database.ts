export type UserRole = "guest" | "vendor" | "admin";
export type OrganizationRole =
  | "individual"
  | "office_admin"
  | "franchise_admin"
  | "office_staff";
export type AdStatus = "draft" | "pending" | "approved" | "rejected";
export type VisibilityMode = "private" | "internal_mls" | "public";
export type AccountOrigin = "self" | "created_by_office";
export type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";
export type RecordType = "income" | "expense";
export type ListingTier = "standard" | "premium" | "luxury";
export type ProfessionalAccountType =
  | "bireysel"
  | "ofis"
  | "franchise"
  | "master_franchise";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  ttbs_no: string | null;
  is_independent_office: boolean;
  company_name: string | null;
  company_ttbs_no: string | null;
  is_profile_completed: boolean;
  is_admin: boolean;
  organization_role: OrganizationRole;
  parent_office_id: string | null;
  account_origin: AccountOrigin;
  is_suspended: boolean;
  role: UserRole;
  professional_level?: string | null;
  account_type?: ProfessionalAccountType | null;
  city_id?: string | null;
  district_id?: string | null;
  neighborhood_id?: string | null;
  avatar_url?: string | null;
  logo_url?: string | null;
  subscription_tier?: string | null;
  max_listing_limit?: number | null;
  max_image_per_listing?: number | null;
  contract_accepted?: boolean | null;
  contract_accepted_at?: string | null;
  company_leader_id?: string | null;
  /** Corporate hierarchy: franchise_master | broker_owner | office_agent */
  user_role?: import("@/types/office-hierarchy").OfficeUserRole | string | null;
  created_at: string;
  updated_at: string;
}

import type { DynamicProperties } from "@/types/dynamic-properties";

export interface ClassifiedAd {
  id: string;
  custom_listing_id: string | null;
  tasinmaz_no: string | null;
  vendor_id: string;
  owner_id?: string | null;
  managed_by_id?: string | null;
  title: string;
  description: string | null;
  price: number;
  category: string;
  category_main: string | null;
  category_type: string | null;
  category_group: string | null;
  category_sub: string | null;
  location: string | null;
  full_address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  city_id?: string | null;
  district_id?: string | null;
  neighborhood_id?: string | null;
  contact_phone: string | null;
  images: string[];
  sq_meters_gross: number | null;
  sq_meters_net: number | null;
  room_count: string | null;
  floor_number: string | null;
  total_floors: number | null;
  heating_type: string | null;
  building_age: number | null;
  dynamic_properties: DynamicProperties;
  status: AdStatus;
  rejection_reason: string | null;
  is_archived: boolean;
  visibility_mode: VisibilityMode;
  transfer_status?: "none" | "pending" | "approved" | "rejected";
  target_owner_id?: string | null;
  is_luxury_listing?: boolean;
  listing_tier?: ListingTier;
  property_segment?: string | null;
  premium_highlight?: string | null;
  virtual_tour_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListingAgentProfile {
  full_name: string | null;
  email: string;
  company_name: string | null;
}

export interface ClassifiedAdWithVendor extends ClassifiedAd {
  vendor?: ListingAgentProfile | null;
  broker?: ListingAgentProfile | null;
  owner?: ListingAgentProfile | null;
}

export interface FinancialRecord {
  id: string;
  vendor_id: string;
  type: RecordType;
  amount: number;
  description: string | null;
  record_date: string;
  created_at: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
}
