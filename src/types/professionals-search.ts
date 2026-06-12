export type ProfessionalAccountType =
  | "bireysel"
  | "ofis"
  | "franchise"
  | "master_franchise";

export const PROFESSIONAL_ACCOUNT_TYPES: ProfessionalAccountType[] = [
  "bireysel",
  "ofis",
  "franchise",
  "master_franchise",
];

export interface ProfessionalsSearchFilters {
  account_type: ProfessionalAccountType | null;
  city_id: string | null;
  district_id: string | null;
  neighborhood_id: string | null;
}

export interface ProfessionalListingCounts {
  total_listings: number;
  system_listings: number;
  public_listings: number;
}

export interface ProfessionalDirectoryEntry {
  id: string;
  display_name: string;
  full_name: string | null;
  company_name: string | null;
  email: string;
  avatar_url: string | null;
  professional_level: string | null;
  account_type: ProfessionalAccountType | null;
  city_id: string | null;
  district_id: string | null;
  neighborhood_id: string | null;
  city_name: string | null;
  district_name: string | null;
  neighborhood_name: string | null;
  total_listings: number;
  system_listings: number;
  public_listings: number;
}

export interface ProfessionalsSearchResponse {
  results: ProfessionalDirectoryEntry[];
  total_count: number;
  filters: ProfessionalsSearchFilters;
}

export interface ProfessionalProfileDetail {
  id: string;
  display_name: string;
  full_name: string | null;
  company_name: string | null;
  email: string;
  phone: string | null;
  ttbs_no: string | null;
  avatar_url: string | null;
  professional_level: string | null;
  account_type: ProfessionalAccountType | null;
  city_name: string | null;
  district_name: string | null;
  neighborhood_name: string | null;
  total_listings: number;
  system_listings: number;
  public_listings: number;
}
