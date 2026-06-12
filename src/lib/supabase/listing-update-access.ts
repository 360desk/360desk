import type { SupabaseClient } from "@supabase/supabase-js";
import type { ListingOwnershipRow } from "@/lib/supabase/ownership";

const EXTENDED_OWNERSHIP_SELECT = "id, vendor_id, owner_id, managed_by_id";
const CORE_OWNERSHIP_SELECT = "id, vendor_id";

function isMissingOwnershipColumnError(error: {
  message?: string;
  code?: string;
}): boolean {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    message.includes("owner_id") ||
    message.includes("managed_by_id")
  );
}

export async function fetchListingOwnershipRow(
  supabase: SupabaseClient,
  listingId: string
): Promise<{ listing: ListingOwnershipRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("classified_ads")
    .select(EXTENDED_OWNERSHIP_SELECT)
    .eq("id", listingId)
    .maybeSingle();

  if (!error && data) {
    return { listing: data as ListingOwnershipRow, error: null };
  }

  if (error && !isMissingOwnershipColumnError(error)) {
    return { listing: null, error: error.message };
  }

  const { data: coreData, error: coreError } = await supabase
    .from("classified_ads")
    .select(CORE_OWNERSHIP_SELECT)
    .eq("id", listingId)
    .maybeSingle();

  if (coreError) {
    return { listing: null, error: coreError.message };
  }

  if (!coreData) {
    return { listing: null, error: null };
  }

  return {
    listing: {
      ...(coreData as ListingOwnershipRow),
      owner_id: null,
      managed_by_id: null,
    },
    error: null,
  };
}
