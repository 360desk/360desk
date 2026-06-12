import type { ClassifiedAd } from "@/types/database";

export function getCustomListingId(ad: Pick<ClassifiedAd, "id" | "custom_listing_id">): string {
  if (ad.custom_listing_id) {
    return ad.custom_listing_id;
  }
  return `360-${ad.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}
