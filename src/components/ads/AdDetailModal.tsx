"use client";

import { useEffect } from "react";
import { AdGallery } from "@/components/ads/AdGallery";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ClassifiedAd } from "@/types/database";

interface AdDetailModalProps {
  ad: ClassifiedAd | null;
  onClose: () => void;
}

export function AdDetailModal({ ad, onClose }: AdDetailModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (ad) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKey);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [ad, onClose]);

  if (!ad) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={ad.title}
    >
      <div
        className="absolute inset-0 bg-charcoal-dark/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-cream/10 bg-charcoal shadow-2xl shadow-black/40">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-charcoal-light text-cream/60 hover:text-primary hover:border-primary border border-cream/10 transition-colors"
          aria-label="Kapat"
        >
          ×
        </button>

        <AdGallery ad={ad} variant="detail" className="p-4 pb-0" />

        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary mb-2">
                {ad.category}
              </span>
              <h2 className="text-2xl font-bold text-cream">{ad.title}</h2>
            </div>
            <p className="text-2xl font-bold text-primary shrink-0">
              {formatCurrency(ad.price)}
            </p>
          </div>

          {ad.description && (
            <p className="text-sm text-cream/70 leading-relaxed">
              {ad.description}
            </p>
          )}

          <div className="flex flex-wrap gap-4 pt-2 border-t border-cream/10 text-sm text-cream/50">
            {ad.location && (
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {ad.location}
              </span>
            )}
            {ad.contact_phone && (
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {ad.contact_phone}
              </span>
            )}
            <span>{formatDate(ad.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
