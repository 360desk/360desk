export type UserRole = "guest" | "vendor" | "admin";
export type AdStatus = "pending" | "approved" | "rejected";
export type RecordType = "income" | "expense";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface ClassifiedAd {
  id: string;
  vendor_id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  location: string | null;
  contact_phone: string | null;
  images: string[];
  status: AdStatus;
  created_at: string;
  updated_at: string;
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
