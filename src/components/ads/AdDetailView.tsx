import Link from "next/link";
import { AdminDecisionWidget } from "@/components/admin/AdminDecisionWidget";
import { AdDetailGallery } from "@/components/ads/AdDetailGallery";
import { DynamicPropertiesTabs } from "@/components/ads/DynamicPropertiesTabs";
import { resolveDynamicProperties } from "@/lib/dynamic-properties";
import { CategoryBadge } from "@/components/ads/CategoryBadge";
import { VendorContactCard } from "@/components/ads/VendorContactCard";
import { getCustomListingId } from "@/lib/listing";
import { formatCurrency } from "@/lib/format";
import type { ClassifiedAdWithVendor } from "@/types/database";

interface AdDetailViewProps {
  ad: ClassifiedAdWithVendor;
  isAdmin?: boolean;
}

export function AdDetailView({ ad, isAdmin = false }: AdDetailViewProps) {
  const dynamic = resolveDynamicProperties(ad);
  const { property_specs: specs } = dynamic;
  const listingId = getCustomListingId(ad);
  const showAdminWidget = isAdmin && ad.status === "pending";

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <Link
        href={isAdmin && ad.status === "pending" ? "/admin" : "/"}
        className="inline-flex items-center gap-2 text-sm text-cream/50 hover:text-primary transition-colors mb-6"
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

      <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <AdDetailGallery ad={ad} />

          <div className="flex flex-col gap-4">
            <CategoryBadge ad={ad} size="md" />

            <span className="inline-flex w-fit items-center rounded border border-cream/15 bg-charcoal px-2.5 py-1 text-xs font-mono tracking-wider text-cream/70">
              {listingId}
            </span>

            <p className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">
              {formatCurrency(ad.price)}
            </p>

            <h1 className="text-2xl sm:text-3xl font-bold text-cream leading-tight">
              {ad.title}
            </h1>

            {(specs.room_count || specs.sq_meters_gross) && (
              <p className="text-base font-medium text-cream/70">
                {specs.room_count}
                {specs.sq_meters_gross != null && (
                  <span className="text-cream/40">
                    {" "}
                    · {specs.sq_meters_gross} m² (Brüt)
                  </span>
                )}
              </p>
            )}

            {ad.location && (
              <div className="flex items-center gap-2 text-cream/60">
                <svg
                  className="h-5 w-5 text-primary shrink-0"
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
                <span className="text-base">{ad.location}</span>
              </div>
            )}
          </div>

          {ad.description && (
            <div className="rounded-xl border border-cream/10 bg-charcoal-light p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-cream/50 mb-3">
                Açıklama
              </h2>
              <p className="text-cream/80 leading-relaxed whitespace-pre-wrap">
                {ad.description}
              </p>
            </div>
          )}

          <DynamicPropertiesTabs ad={ad} />
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24 flex flex-col gap-6">
            <VendorContactCard ad={ad} />
          </div>
        </div>
      </div>
    </div>
  );
}
