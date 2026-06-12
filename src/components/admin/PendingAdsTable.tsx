"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/format";
import { getCustomListingId } from "@/lib/listing";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { AdGallery } from "@/components/ads/AdGallery";
import { CategoryBadge } from "@/components/ads/CategoryBadge";
import type { ClassifiedAd } from "@/types/database";

export function PendingAdsTable() {
  const supabase = createClient();
  const [ads, setAds] = useState<ClassifiedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("classified_ads")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    setAds((data as ClassifiedAd[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    setActionLoading(id);
    const { error } = await supabase
      .from("classified_ads")
      .update({ status })
      .eq("id", id);

    if (!error) {
      fetchPending();
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-cream/40">Yükleniyor...</p>
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <Card className="text-center py-12">
        <p className="text-cream/40">Onay bekleyen ilan bulunmuyor.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {ads.map((ad) => {
        const listingId = getCustomListingId(ad);

        return (
          <Card
            key={ad.id}
            className="flex flex-col gap-4 sm:flex-row sm:items-stretch border-cream/10 bg-charcoal-light"
          >
            <Link
              href={`/ilan/${ad.id}`}
              className="group flex flex-1 min-w-0 gap-4 transition-colors"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-cream/10 sm:h-28 sm:w-28 group-hover:border-primary/40 transition-colors">
                <AdGallery ad={ad} variant="thumb" className="h-full w-full" />
              </div>

              <div className="flex flex-1 min-w-0 flex-col gap-1.5 py-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <CategoryBadge ad={ad} />
                  <StatusBadge status={ad.status} />
                </div>

                <span className="inline-flex w-fit items-center rounded border border-cream/15 bg-charcoal px-2 py-0.5 text-xs font-mono tracking-wider text-cream/70">
                  {listingId}
                </span>

                <h3 className="text-lg font-semibold text-cream group-hover:text-primary transition-colors line-clamp-1">
                  {ad.title}
                </h3>

                {ad.description && (
                  <p className="text-sm text-cream/60 line-clamp-2 group-hover:text-cream/80 transition-colors">
                    {ad.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 mt-auto pt-1 text-sm text-cream/40">
                  <span className="font-medium text-primary/80">
                    {formatCurrency(ad.price)}
                  </span>
                  {ad.location && <span>{ad.location}</span>}
                  <span>{formatDate(ad.created_at)}</span>
                </div>

                <span className="text-xs text-cream/30 group-hover:text-primary/70 transition-colors">
                  Detayları incele →
                </span>
              </div>
            </Link>

            <div className="flex gap-2 shrink-0 sm:flex-col sm:justify-center border-t border-cream/10 sm:border-t-0 sm:border-l sm:pl-4 pt-4 sm:pt-0">
              <Button
                size="sm"
                onClick={() => handleAction(ad.id, "approved")}
                disabled={actionLoading === ad.id}
                className="flex-1 sm:flex-none"
              >
                Onayla
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleAction(ad.id, "rejected")}
                disabled={actionLoading === ad.id}
                className="flex-1 sm:flex-none"
              >
                Reddet
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
