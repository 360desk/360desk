"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdCard } from "@/components/ads/AdCard";
import { Button } from "@/components/ui/Button";
import type { ClassifiedAd } from "@/types/database";

interface AdListProps {
  vendorId?: string;
  statusFilter?: "all" | "pending" | "approved" | "rejected";
  showStatus?: boolean;
  emptyMessage?: string;
}

export function AdList({
  vendorId,
  statusFilter = "all",
  showStatus = false,
  emptyMessage = "Henüz ilan bulunmuyor.",
}: AdListProps) {
  const supabase = createClient();
  const [ads, setAds] = useState<ClassifiedAd[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("classified_ads")
      .select("*")
      .order("created_at", { ascending: false });

    if (vendorId) {
      query = query.eq("vendor_id", vendorId);
    } else {
      query = query.eq("status", "approved");
    }

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;
    setAds((data as ClassifiedAd[]) ?? []);
    setLoading(false);
  }, [supabase, vendorId, statusFilter]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("classified_ads")
      .delete()
      .eq("id", id);

    if (!error) {
      fetchAds();
    }
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
      <div className="flex items-center justify-center py-12">
        <p className="text-cream/40">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ads.map((ad) => (
        <div key={ad.id} className="relative group">
          <AdCard ad={ad} showStatus={showStatus} />
          {showStatus && ad.status === "pending" && vendorId && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(ad.id)}
              >
                Sil
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
