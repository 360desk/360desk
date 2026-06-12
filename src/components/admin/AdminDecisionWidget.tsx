"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";

interface AdminDecisionWidgetProps {
  adId: string;
  listingId: string;
}

export function AdminDecisionWidget({ adId, listingId }: AdminDecisionWidgetProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    setLoading("approve");
    setError(null);

    const { error: updateError } = await supabase
      .from("classified_ads")
      .update({ status: "approved", rejection_reason: null })
      .eq("id", adId);

    if (updateError) {
      setError(updateError.message);
      setLoading(null);
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  const handleReject = async () => {
    const trimmed = rejectionReason.trim();
    if (!trimmed) {
      setError("Lütfen bir red nedeni yazın.");
      return;
    }

    setLoading("reject");
    setError(null);

    const { error: updateError } = await supabase
      .from("classified_ads")
      .update({ status: "rejected", rejection_reason: trimmed })
      .eq("id", adId);

    if (updateError) {
      setError(updateError.message);
      setLoading(null);
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="rounded-xl border border-primary/25 bg-charcoal-light p-5 shadow-xl shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
            Yönetici İncelemesi
          </p>
          <h2 className="text-lg font-semibold text-cream">İlan Kararı</h2>
          <p className="mt-1 text-xs font-mono tracking-wider text-cream/50">
            {listingId}
          </p>
        </div>
        <StatusBadge status="pending" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="primary"
          size="lg"
          className="flex-1"
          onClick={handleApprove}
          disabled={loading !== null}
        >
          {loading === "approve" ? "Onaylanıyor..." : "Onayla"}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="flex-1 border-cream/25 text-cream/80"
          onClick={() => {
            setShowRejectForm((prev) => !prev);
            setError(null);
          }}
          disabled={loading !== null}
        >
          Reddet
        </Button>
      </div>

      {showRejectForm && (
        <div className="mt-5 flex flex-col gap-3 border-t border-cream/10 pt-5">
          <label
            htmlFor={`rejection-reason-${adId}`}
            className="text-xs font-medium uppercase tracking-wider text-cream/40"
          >
            Red Nedeni
          </label>
          <textarea
            id={`rejection-reason-${adId}`}
            placeholder="Red Nedeni Yazın..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
            disabled={loading !== null}
            className="w-full resize-none rounded-lg border border-cream/20 bg-charcoal px-4 py-3 text-sm text-cream placeholder:text-cream/30 transition-colors focus:border-cream/40 focus:outline-none disabled:opacity-50"
          />
          <Button
            variant="secondary"
            size="md"
            onClick={handleReject}
            disabled={loading !== null}
            className="self-end border-cream/25 text-cream/70 hover:text-cream"
          >
            {loading === "reject" ? "Kaydediliyor..." : "Reddet ve Kaydet"}
          </Button>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
