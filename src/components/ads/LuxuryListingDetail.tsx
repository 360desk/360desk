import Link from "next/link";
import { AdminDecisionWidget } from "@/components/admin/AdminDecisionWidget";
import { AdDetailGallery } from "@/components/ads/AdDetailGallery";
import { BrokerContactCard } from "@/components/ads/BrokerContactCard";
import { CategoryBadge } from "@/components/ads/CategoryBadge";
import { DynamicPropertiesTabs } from "@/components/ads/DynamicPropertiesTabs";
import { VendorContactCard } from "@/components/ads/VendorContactCard";
import { ShareLocationButton } from "@/components/location/ShareLocationButton";
import { resolveDynamicProperties } from "@/lib/dynamic-properties";
import { listingGeoToSharePayload } from "@/lib/listing-geo";
import { getCustomListingId } from "@/lib/listing";
import { formatCurrency } from "@/lib/format";
import type { ClassifiedAdWithVendor, ListingTier } from "@/types/database";

interface LuxuryListingDetailProps {
  ad: ClassifiedAdWithVendor;
  isAdmin?: boolean;
}

function isPremiumTier(tier: ListingTier | undefined): boolean {
  return tier === "luxury" || tier === "premium";
}

function resolveTierBadge(ad: ClassifiedAdWithVendor): string | null {
  const tier = ad.listing_tier ?? "standard";

  if (tier === "luxury") {
    return "Luxury Segment";
  }

  if (tier === "premium") {
    return "Premium Collection";
  }

  if (ad.property_segment?.toLowerCase().includes("loft")) {
    return "1+1 Loft Exclusive";
  }

  return null;
}

export function LuxuryListingDetail({
  ad,
  isAdmin = false,
}: LuxuryListingDetailProps) {
  const dynamic = resolveDynamicProperties(ad);
  const { property_specs: specs } = dynamic;
  const listingId = getCustomListingId(ad);
  const showAdminWidget = isAdmin && ad.status === "pending";
  const premium = isPremiumTier(ad.listing_tier) || ad.is_luxury_listing;
  const tierBadge = resolveTierBadge(ad);

  const specItems = [
    ad.property_segment
      ? { label: "Segment", value: ad.property_segment }
      : null,
    ad.premium_highlight
      ? { label: "Öne Çıkan", value: ad.premium_highlight }
      : null,
    ad.virtual_tour_url
      ? { label: "Sanal Tur", value: "Mevcut" }
      : null,
    specs.room_count ? { label: "Oda", value: specs.room_count } : null,
    specs.sq_meters_gross != null
      ? { label: "Brüt m²", value: `${specs.sq_meters_gross} m²` }
      : null,
    specs.sq_meters_net != null
      ? { label: "Net m²", value: `${specs.sq_meters_net} m²` }
      : null,
    specs.floor_number ? { label: "Kat", value: specs.floor_number } : null,
    specs.heating_type ? { label: "Isıtma", value: specs.heating_type } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Link
        href={isAdmin && ad.status === "pending" ? "/admin" : "/ilanlar"}
        className="mb-8 inline-flex items-center gap-2 text-sm text-cream/50 transition-colors hover:text-primary"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        {isAdmin && ad.status === "pending"
          ? "Yönetim Paneline Dön"
          : "Tüm İlanlara Dön"}
      </Link>

      {showAdminWidget && (
        <div className="sticky top-20 z-20 mb-8">
          <AdminDecisionWidget adId={ad.id} listingId={listingId} />
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <div
            className={`rounded-2xl p-[1px] ${
              premium
                ? "bg-gradient-to-br from-primary/70 via-cream/20 to-primary/30"
                : "bg-cream/10"
            }`}
          >
            <div className="rounded-2xl bg-charcoal p-1">
              <AdDetailGallery ad={ad} />
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {tierBadge && (
              <span className="inline-flex w-fit items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                {tierBadge}
              </span>
            )}

            <CategoryBadge ad={ad} size="md" />

            <span className="inline-flex w-fit items-center rounded border border-cream/15 bg-charcoal px-2.5 py-1 font-mono text-xs tracking-wider text-cream/70">
              {listingId}
            </span>

            <p className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
              {formatCurrency(ad.price)}
            </p>

            <h1 className="text-2xl font-bold leading-tight text-cream sm:text-4xl">
              {ad.title}
            </h1>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {(ad.location || ad.full_address) && (
                <div className="flex items-center gap-2 text-cream/60">
                  <svg
                    className="h-5 w-5 shrink-0 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="text-base">
                    {ad.full_address?.trim() || ad.location}
                  </span>
                </div>
              )}
              <ShareLocationButton
                payload={listingGeoToSharePayload({
                  title: ad.title,
                  full_address: ad.full_address ?? null,
                  latitude: ad.latitude ?? null,
                  longitude: ad.longitude ?? null,
                  location: ad.location,
                })}
                size="md"
              />
            </div>
          </div>

          {specItems.length > 0 && (
            <section className="rounded-2xl border border-cream/10 bg-charcoal-light p-6 sm:p-8">
              <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-cream/50">
                Mimari Özellikler
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {specItems.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-cream/10 bg-charcoal px-4 py-4"
                  >
                    <p className="text-xs uppercase tracking-wider text-cream/40">
                      {item.label}
                    </p>
                    <p className="mt-1 text-base font-medium text-cream">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {ad.virtual_tour_url && (
                <a
                  href={ad.virtual_tour_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-cream transition hover:bg-primary-dark"
                >
                  Sanal Turu Aç
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14 3h7m0 0v7m0-7L10 14"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 10v11h11"
                    />
                  </svg>
                </a>
              )}
            </section>
          )}

          {ad.description && (
            <div className="rounded-2xl border border-cream/10 bg-charcoal-light p-6 sm:p-8">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-cream/50">
                Açıklama
              </h2>
              <p className="whitespace-pre-wrap leading-relaxed text-cream/80">
                {ad.description}
              </p>
            </div>
          )}

          <DynamicPropertiesTabs ad={ad} />
        </div>

        <div className="lg:col-span-1">
          <div className="flex flex-col gap-6 lg:sticky lg:top-24">
            {premium ? (
              <BrokerContactCard ad={ad} />
            ) : (
              <VendorContactCard ad={ad} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
