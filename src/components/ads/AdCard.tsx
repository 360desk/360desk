"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { AdGallery } from "@/components/ads/AdGallery";
import { CategoryBadge } from "@/components/ads/CategoryBadge";
import { resolveDynamicProperties } from "@/lib/dynamic-properties";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ClassifiedAd } from "@/types/database";

interface AdCardProps {
  ad: ClassifiedAd;
  showStatus?: boolean;
  linkToDetail?: boolean;
  onClick?: () => void;
}

export function AdCard({
  ad,
  showStatus = false,
  linkToDetail = false,
  onClick,
}: AdCardProps) {
  const specs = resolveDynamicProperties(ad).property_specs;

  const content = (
    <Card
      hover
      className={`flex flex-col gap-0 overflow-hidden p-0 ${
        linkToDetail || onClick ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
    >
      <AdGallery
        ad={ad}
        variant="card"
        className="group -mx-0 rounded-t-xl"
      />

      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <CategoryBadge ad={ad} />
          {showStatus && <StatusBadge status={ad.status} />}
        </div>

        <h3 className="text-lg font-semibold text-cream leading-tight">
          {ad.title}
        </h3>

        {(specs.room_count || specs.sq_meters_gross) && (
          <p className="text-xs text-cream/50">
            {[
              specs.room_count,
              specs.sq_meters_gross ? `${specs.sq_meters_gross} m²` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}

        {ad.description && (
          <p className="text-sm text-cream/60 line-clamp-2">{ad.description}</p>
        )}

        <div className="mt-auto flex items-end justify-between pt-2 border-t border-cream/10">
          <div>
            <p className="text-xl font-bold text-primary">
              {formatCurrency(ad.price)}
            </p>
            {ad.location && (
              <p className="text-xs text-cream/40 mt-0.5">{ad.location}</p>
            )}
          </div>
          <p className="text-xs text-cream/30">{formatDate(ad.created_at)}</p>
        </div>
      </div>
    </Card>
  );

  if (linkToDetail) {
    return (
      <Link href={`/ilan/${ad.id}`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
