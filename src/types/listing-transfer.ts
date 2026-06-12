export type ListingTransferStatus = "none" | "pending" | "approved" | "rejected";

export type ListingTransferType =
  | "voluntary"
  | "office_forced"
  | "office_reassign"
  | "approve"
  | "reject";

export interface ListingTransferRequest {
  transfer_type: ListingTransferType;
  listing_ids?: string[];
  target_owner_id?: string;
  staff_id?: string;
}

export interface ListingTransferResult {
  transfer_type: ListingTransferType;
  transferred_count: number;
  listing_ids: string[];
  target_owner_id?: string;
  staff_id?: string;
  message: string;
}
