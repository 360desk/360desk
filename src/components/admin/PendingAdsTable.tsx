"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
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
      {ads.map((ad) => (
        <Card key={ad.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                {ad.category}
              </span>
              <StatusBadge status={ad.status} />
            </div>
            <h3 className="text-lg font-semibold text-cream">{ad.title}</h3>
            {ad.description && (
              <p className="text-sm text-cream/60 mt-1 line-clamp-2">
                {ad.description}
              </p>
            )}
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-cream/40">
              <span>{formatCurrency(ad.price)}</span>
              {ad.location && <span>{ad.location}</span>}
              <span>{formatDate(ad.created_at)}</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => handleAction(ad.id, "approved")}
              disabled={actionLoading === ad.id}
            >
              Onayla
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleAction(ad.id, "rejected")}
              disabled={actionLoading === ad.id}
            >
              Reddet
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
