import { AdCard } from "@/components/ads/AdCard";
import type { ClassifiedAd } from "@/types/database";

interface CatalogAdCardProps {
  ad: ClassifiedAd;
}

export function CatalogAdCard({ ad }: CatalogAdCardProps) {
  const isLuxury = ad.listing_tier === "luxury" || ad.is_luxury_listing;
  const isPremium = ad.listing_tier === "premium";

  const card = (
    <div className="relative">
      {(isLuxury || isPremium) && (
        <span
          className={`absolute left-4 top-4 z-10 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] backdrop-blur-sm ${
            isLuxury
              ? "border-primary/40 bg-primary/15 text-primary"
              : "border-cream/25 bg-charcoal/80 text-cream/80"
          }`}
        >
          {isLuxury ? "Luxury Collection" : "Premium Line"}
        </span>
      )}
      <AdCard ad={ad} linkToDetail />
    </div>
  );

  if (!isLuxury) {
    return card;
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/70 via-cream/20 to-primary/30 p-[1px] transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/15">
      <div className="rounded-2xl bg-charcoal">{card}</div>
    </div>
  );
}
