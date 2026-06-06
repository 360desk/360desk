import type { ClassifiedAd } from "@/types/database";

export function getAdImages(ad: ClassifiedAd): string[] {
  if (!ad.images || !Array.isArray(ad.images)) return [];
  return ad.images.filter(Boolean);
}

export function getAdCoverImage(ad: ClassifiedAd): string | null {
  const images = getAdImages(ad);
  return images[0] ?? null;
}
