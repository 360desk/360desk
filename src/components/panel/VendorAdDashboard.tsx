"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AdLimitNotice } from "@/components/panel/AdLimitNotice";
import { AdGallery } from "@/components/ads/AdGallery";
import { CategoryBadge } from "@/components/ads/CategoryBadge";
import { ShareLocationButton } from "@/components/location/ShareLocationButton";
import { Button } from "@/components/ui/Button";
import { listingGeoToSharePayload } from "@/lib/listing-geo";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { getCustomListingId } from "@/lib/listing";
import {
  ARCHIVE_LABELS,
  formatCurrency,
  formatDate,
  VISIBILITY_MODE_LABELS,
  VISIBILITY_MODE_OPTIONS,
} from "@/lib/format";
import {
  buildMultiIdOwnershipScopeFilter,
  buildOwnershipScopeFilter,
  resolveOwnershipContext,
} from "@/lib/supabase/ownership";
import { inferOfficeUserRole } from "@/lib/office-hierarchy";
import type { FranchiseBranchOffice } from "@/lib/franchise-network";
import {
  FranchiseBranchFilter,
  resolveFranchiseListingScope,
} from "@/components/panel/FranchiseBranchFilter";
import {
  ACTIVE_AD_LIMIT_MESSAGE,
  validateActiveAdLimitForVisibility,
} from "@/lib/supabase/subscriptions";
import {
  validateVisibilityChange,
  VISIBILITY_TASINMAZ_REQUIRED_MESSAGE,
} from "@/lib/validation/visibility-mode";
import type { ClassifiedAd, VisibilityMode } from "@/types/database";
import type { SubscriptionLimits } from "@/types/subscription";

interface VendorAdDashboardProps {
  limits?: SubscriptionLimits;
  onLimitsChange?: () => void;
}

export function VendorAdDashboard({ onLimitsChange }: VendorAdDashboardProps) {
  const { user, profile } = useAuth();
  const supabase = createClient();
  const [ads, setAds] = useState<ClassifiedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [visibilityErrors, setVisibilityErrors] = useState<
    Record<string, string>
  >({});
  const [franchiseBranches, setFranchiseBranches] = useState<
    FranchiseBranchOffice[]
  >([]);
  const [selectedBranchId, setSelectedBranchId] = useState("all");
  const [networkLoading, setNetworkLoading] = useState(false);

  const isFranchiseMaster =
    inferOfficeUserRole(profile) === "franchise_master";

  useEffect(() => {
    if (!user || !isFranchiseMaster) {
      setFranchiseBranches([]);
      setSelectedBranchId("all");
      return;
    }

    let cancelled = false;

    const loadNetwork = async () => {
      setNetworkLoading(true);
      try {
        const response = await fetch("/api/franchise/branches");
        const payload = (await response.json()) as {
          branches?: FranchiseBranchOffice[];
          error?: string;
        };

        if (!cancelled && response.ok) {
          setFranchiseBranches(payload.branches ?? []);
        }
      } finally {
        if (!cancelled) {
          setNetworkLoading(false);
        }
      }
    };

    void loadNetwork();

    return () => {
      cancelled = true;
    };
  }, [user, isFranchiseMaster]);

  const fetchAds = useCallback(async () => {
    if (!user) {
      return;
    }

    setLoading(true);

    let scopeFilter: string;

    if (isFranchiseMaster) {
      const scopeIds = resolveFranchiseListingScope(
        user.id,
        franchiseBranches,
        selectedBranchId
      );
      scopeFilter = buildMultiIdOwnershipScopeFilter(scopeIds);
    } else {
      const { ownerId } = resolveOwnershipContext(profile, user.id);
      scopeFilter = buildOwnershipScopeFilter(ownerId, user.id);
    }

    const { data } = await supabase
      .from("classified_ads")
      .select("*")
      .or(scopeFilter)
      .order("created_at", { ascending: false });

    setAds((data as ClassifiedAd[]) ?? []);
    setLoading(false);
  }, [
    supabase,
    user,
    profile,
    isFranchiseMaster,
    franchiseBranches,
    selectedBranchId,
  ]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const handleArchiveToggle = async (ad: ClassifiedAd) => {
    setActionLoading(`archive-${ad.id}`);

    const { error } = await supabase
      .from("classified_ads")
      .update({ is_archived: !ad.is_archived })
      .eq("id", ad.id);

    if (!error) {
      fetchAds();
    }

    setActionLoading(null);
  };

  const handleDelete = async (ad: ClassifiedAd) => {
    const confirmed = window.confirm(
      `"${ad.title}" ilanını kalıcı olarak silmek istediğinize emin misiniz?`
    );

    if (!confirmed) {
      return;
    }

    setActionLoading(`delete-${ad.id}`);

    const { error } = await supabase
      .from("classified_ads")
      .delete()
      .eq("id", ad.id);

    if (!error) {
      fetchAds();
    }

    setActionLoading(null);
  };

  const handleVisibilityChange = async (
    ad: ClassifiedAd,
    nextMode: VisibilityMode
  ) => {
    const currentMode = ad.visibility_mode ?? "private";

    if (currentMode === nextMode) {
      return;
    }

    const validation = validateVisibilityChange(
      currentMode,
      nextMode,
      ad.tasinmaz_no
    );

    if (!validation.ok) {
      setVisibilityErrors((prev) => ({
        ...prev,
        [ad.id]: validation.error,
      }));
      return;
    }

    const limitValidation = await validateActiveAdLimitForVisibility(
      supabase,
      profile,
      user!.id,
      currentMode,
      nextMode,
      ad.id
    );

    if (!limitValidation.ok) {
      setVisibilityErrors((prev) => ({
        ...prev,
        [ad.id]: limitValidation.error,
      }));
      return;
    }

    setVisibilityErrors((prev) => {
      const next = { ...prev };
      delete next[ad.id];
      return next;
    });

    setActionLoading(`visibility-${ad.id}`);

    const { error } = await supabase
      .from("classified_ads")
      .update({ visibility_mode: nextMode })
      .eq("id", ad.id);

    if (error) {
      setVisibilityErrors((prev) => ({
        ...prev,
        [ad.id]: "Görünürlük güncellenirken bir hata oluştu.",
      }));
    } else {
      fetchAds();
      onLimitsChange?.();
    }

    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {isFranchiseMaster && (
          <FranchiseBranchFilter
            branches={franchiseBranches}
            selectedBranchId={selectedBranchId}
            onChange={setSelectedBranchId}
            loading={networkLoading}
          />
        )}
        <div className="flex items-center justify-center py-12">
          <p className="text-cream/40">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {isFranchiseMaster && (
          <FranchiseBranchFilter
            branches={franchiseBranches}
            selectedBranchId={selectedBranchId}
            onChange={setSelectedBranchId}
            loading={networkLoading}
          />
        )}
        <Card className="text-center py-12">
          <p className="text-cream/40">
            {isFranchiseMaster
              ? selectedBranchId === "all"
                ? "Franchise ağında henüz ilan bulunmuyor."
                : "Seçili şubede henüz ilan bulunmuyor."
              : "Henüz ilan eklemediniz."}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {isFranchiseMaster && (
        <FranchiseBranchFilter
          branches={franchiseBranches}
          selectedBranchId={selectedBranchId}
          onChange={setSelectedBranchId}
          loading={networkLoading}
        />
      )}
      {ads.map((ad) => {
        const listingId = getCustomListingId(ad);
        const isBusy = actionLoading?.includes(ad.id) ?? false;
        const visibilityMode = ad.visibility_mode ?? "private";
        const showVisibilityControl =
          ad.status === "approved" && !ad.is_archived;
        const visibilityError = visibilityErrors[ad.id];
        const editHref = `/panel/ilanlar/${ad.id}/edit`;
        const needsTasinmazForVisibility =
          visibilityError === VISIBILITY_TASINMAZ_REQUIRED_MESSAGE;

        return (
          <div key={ad.id} className="flex flex-col gap-3">
            <Card className="flex flex-col gap-0 border-cream/10 bg-charcoal-light p-0 overflow-hidden sm:flex-row sm:items-stretch">
              <div className="relative h-36 w-full shrink-0 overflow-hidden border-b border-cream/10 sm:h-auto sm:w-40 sm:border-b-0 sm:border-r">
                <AdGallery ad={ad} variant="thumb" className="h-full w-full" />
                {ad.is_archived && (
                  <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-[1px]" />
                )}
              </div>

              <div className="flex flex-1 min-w-0 flex-col divide-y divide-cream/10">
                <div className="flex flex-col gap-3 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <CategoryBadge ad={ad} />
                    <StatusBadge status={ad.status} />
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        ad.is_archived
                          ? "border-cream/20 bg-cream/5 text-cream/50"
                          : "border-primary/30 bg-primary/10 text-primary"
                      }`}
                    >
                      {ad.is_archived
                        ? ARCHIVE_LABELS.passive
                        : ARCHIVE_LABELS.active}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-xs font-mono tracking-wider text-cream/50">
                      {listingId}
                    </span>
                    <h3 className="text-lg font-semibold text-cream leading-tight line-clamp-1">
                      {ad.title}
                    </h3>
                    {ad.description && (
                      <p className="text-sm text-cream/60 line-clamp-2">
                        {ad.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="font-semibold text-primary">
                      {formatCurrency(ad.price)}
                    </span>
                    {ad.location && (
                      <span className="text-cream/50">{ad.location}</span>
                    )}
                    <span className="text-cream/30">
                      {formatDate(ad.created_at)}
                    </span>
                  </div>
                </div>

                {showVisibilityControl && (
                  <div className="px-4 py-3 sm:px-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-cream/50">
                          Görünürlük:
                        </span>
                        <span className="hidden sm:inline text-xs text-cream/30">
                          {VISIBILITY_MODE_LABELS[visibilityMode]}
                        </span>
                      </div>

                      <div className="relative min-w-[220px] sm:max-w-xs sm:flex-1">
                        <select
                          value={visibilityMode}
                          disabled={isBusy}
                          onChange={(e) =>
                            handleVisibilityChange(
                              ad,
                              e.target.value as VisibilityMode
                            )
                          }
                          className="w-full appearance-none rounded-lg border border-cream/15 bg-charcoal px-4 py-2.5 pr-10 text-sm font-medium text-cream outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/40 disabled:opacity-50"
                          aria-label={`${ad.title} görünürlük seçimi`}
                        >
                          {VISIBILITY_MODE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <svg
                          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/40"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>

                    {visibilityError === ACTIVE_AD_LIMIT_MESSAGE && (
                      <div className="mt-3">
                        <AdLimitNotice message={visibilityError} />
                      </div>
                    )}

                    {visibilityError &&
                      visibilityError !== ACTIVE_AD_LIMIT_MESSAGE && (
                        <p
                          className="mt-3 rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-2 text-sm text-red-300"
                          role="alert"
                        >
                          {visibilityError}
                        </p>
                      )}

                    {needsTasinmazForVisibility && (
                        <Link
                          href={editHref}
                          className="mt-2 inline-block text-xs font-medium text-primary transition-colors hover:text-primary/80"
                        >
                          Taşınmaz numarasını eklemek için ilanı düzenleyin →
                        </Link>
                      )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 p-4 sm:p-5">
                  <ShareLocationButton
                    payload={listingGeoToSharePayload({
                      title: ad.title,
                      full_address: ad.full_address ?? null,
                      latitude: ad.latitude ?? null,
                      longitude: ad.longitude ?? null,
                      location: ad.location,
                    })}
                  />
                  <Link href={editHref}>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      className="gap-1.5"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Düzenle
                    </Button>
                  </Link>
                  {ad.status === "approved" &&
                    !ad.is_archived &&
                    visibilityMode === "public" && (
                      <Link href={`/ilan/${ad.id}`}>
                        <Button variant="ghost" size="sm">
                          İlanı Görüntüle
                        </Button>
                      </Link>
                    )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleArchiveToggle(ad)}
                    disabled={isBusy}
                  >
                    {actionLoading === `archive-${ad.id}`
                      ? "Kaydediliyor..."
                      : ad.is_archived
                        ? "Yeniden Aktifleştir"
                        : "Arşivle"}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(ad)}
                    disabled={isBusy}
                  >
                    {actionLoading === `delete-${ad.id}`
                      ? "Siliniyor..."
                      : "Sil"}
                  </Button>
                </div>
              </div>
            </Card>

            {ad.status === "rejected" && ad.rejection_reason && (
              <Card className="border-red-500/30 bg-red-950/20 p-4">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10">
                    <svg
                      className="h-5 w-5 text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-red-300">
                      İlan Reddedildi — Düzeltme Gerekli
                    </p>
                    <p className="mt-1 text-sm text-cream/80 leading-relaxed whitespace-pre-wrap">
                      {ad.rejection_reason}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        );
      })}
    </div>
  );
}
