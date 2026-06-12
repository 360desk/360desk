"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CatalogAdCard } from "@/components/catalog/CatalogAdCard";
import { ListingsCatalogSkeleton } from "@/components/catalog/ListingsCatalogSkeleton";
import { ListingsFilterSidebar } from "@/components/catalog/ListingsFilterSidebar";
import { Card } from "@/components/ui/Card";
import {
  applyClientTierFilter,
  catalogFiltersToApiQuery,
  catalogFiltersToSearchParams,
  parseCatalogFiltersFromParams,
  type CatalogFilterState,
} from "@/lib/catalog-filters";
import type { ClassifiedAd } from "@/types/database";
import type { ListingsSearchResponse } from "@/types/listings-search";

function CatalogEmptyState() {
  return (
    <Card className="flex flex-col items-center justify-center border-cream/10 bg-charcoal-light px-8 py-16 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cream/15 bg-charcoal">
        <svg
          className="h-7 w-7 text-cream/30"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      </div>
      <p className="max-w-md text-base leading-relaxed text-cream/70">
        Aradığınız kriterlere uygun lüks segment ilan henüz eklenmedi.
      </p>
      <p className="mt-2 text-sm text-cream/40">
        Filtreleri genişleterek yeniden deneyebilirsiniz.
      </p>
    </Card>
  );
}

export function ListingsCatalogPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  const [filters, setFilters] = useState<CatalogFilterState>(() =>
    parseCatalogFiltersFromParams(searchParams)
  );
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const [listings, setListings] = useState<ClassifiedAd[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const parsed = parseCatalogFiltersFromParams(searchParams);
    setFilters(parsed);
    setDebouncedSearch(parsed.search);
  }, [searchParamsString, searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [filters.search]);

  const resolvedFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch,
    }),
    [filters, debouncedSearch]
  );

  useEffect(() => {
    const nextQuery = catalogFiltersToSearchParams(resolvedFilters).toString();

    if (nextQuery === searchParamsString) {
      return;
    }

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }, [resolvedFilters, pathname, router, searchParamsString]);

  const handleFilterChange = useCallback((patch: Partial<CatalogFilterState>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchListings() {
      setLoading(true);
      setError(null);

      try {
        const query = catalogFiltersToApiQuery(resolvedFilters).toString();
        const response = await fetch(`/api/listings/search?${query}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("İlanlar yüklenemedi.");
        }

        const payload = (await response.json()) as ListingsSearchResponse;
        const filtered = applyClientTierFilter(payload.results, resolvedFilters);

        setListings(filtered);
        setTotalCount(
          resolvedFilters.luxuryTier && resolvedFilters.premiumTier
            ? filtered.length
            : payload.total_count
        );
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }

        setListings([]);
        setTotalCount(0);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "İlanlar yüklenirken bir hata oluştu."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchListings();

    return () => controller.abort();
  }, [resolvedFilters]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-8 flex flex-col gap-2 sm:mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          360desk Koleksiyon
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-cream sm:text-4xl">
          Lüks Emlak Kataloğu
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-cream/55 sm:text-base">
          Türkiye genelindeki seçkin portföyü il, ilçe ve mahalle bazında
          segment, koleksiyon seviyesi ve fiyat aralığına göre keşfedin.
        </p>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <ListingsFilterSidebar
          filters={filters}
          onChange={handleFilterChange}
          resultCount={loading ? null : totalCount}
          loading={loading}
        />

        <section className="min-w-0 flex-1 lg:w-[75%]">
          {error && (
            <Card className="mb-5 border-red-500/30 bg-red-950/20 p-4 text-sm text-red-300">
              {error}
            </Card>
          )}

          {loading ? (
            <ListingsCatalogSkeleton />
          ) : listings.length === 0 ? (
            <CatalogEmptyState />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {listings.map((ad) => (
                <CatalogAdCard key={ad.id} ad={ad} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
