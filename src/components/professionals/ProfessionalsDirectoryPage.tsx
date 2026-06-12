"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProfessionalsFilterBar } from "@/components/professionals/ProfessionalsFilterBar";
import { ProfessionalsResultsTable } from "@/components/professionals/ProfessionalsResultsTable";
import { Card } from "@/components/ui/Card";
import {
  parseProfessionalsFiltersFromParams,
  professionalsFiltersToApiQuery,
  professionalsFiltersToSearchParams,
  type ProfessionalsFilterState,
} from "@/lib/professionals-filters";
import type { ProfessionalsSearchResponse } from "@/types/professionals-search";

function DirectoryEmptyState() {
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
            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
          />
        </svg>
      </div>
      <p className="max-w-md text-base leading-relaxed text-cream/70">
        Seçtiğiniz kriterlere uygun doğrulanmış profesyonel bulunamadı.
      </p>
      <p className="mt-2 text-sm text-cream/40">
        Konum veya hesap tipi filtrelerini genişleterek yeniden deneyin.
      </p>
    </Card>
  );
}

export function ProfessionalsDirectoryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  const [filters, setFilters] = useState<ProfessionalsFilterState>(() =>
    parseProfessionalsFiltersFromParams(searchParams)
  );
  const [results, setResults] = useState<ProfessionalsSearchResponse["results"]>(
    []
  );
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFilters(parseProfessionalsFiltersFromParams(searchParams));
  }, [searchParamsString, searchParams]);

  useEffect(() => {
    const nextQuery = professionalsFiltersToSearchParams(filters).toString();

    if (nextQuery === searchParamsString) {
      return;
    }

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }, [filters, pathname, router, searchParamsString]);

  const handleFilterChange = useCallback(
    (patch: Partial<ProfessionalsFilterState>) => {
      setFilters((current) => ({ ...current, ...patch }));
    },
    []
  );

  const apiQuery = useMemo(
    () => professionalsFiltersToApiQuery(filters).toString(),
    [filters]
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadProfessionals() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/professionals/search?${apiQuery}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Profesyonel listesi yüklenemedi.");
        }

        const payload = (await response.json()) as ProfessionalsSearchResponse;
        setResults(payload.results ?? []);
        setTotalCount(payload.total_count ?? 0);
      } catch (fetchError) {
        if (
          fetchError instanceof DOMException &&
          fetchError.name === "AbortError"
        ) {
          return;
        }

        setResults([]);
        setTotalCount(0);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Profesyonel listesi alınamadı."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProfessionals();

    return () => controller.abort();
  }, [apiQuery]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 rounded-2xl border border-cream/10 bg-charcoal-light px-6 py-8 sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          360desk Enterprise Network
        </p>
        <h1 className="mt-3 text-3xl font-bold text-cream sm:text-4xl">
          Emlak Profesyonelleri Dizini
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-cream/55 sm:text-base">
          Türkiye genelindeki doğrulanmış bireysel danışmanları, ofisleri ve
          franchisoları konum ve portföy derinliğine göre keşfedin.
        </p>
      </div>

      <div className="mb-6">
        <ProfessionalsFilterBar filters={filters} onChange={handleFilterChange} />
      </div>

      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-cream/50">
          {loading
            ? "Profesyoneller yükleniyor..."
            : `${totalCount} profesyonel listeleniyor`}
        </p>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-xl bg-charcoal-light"
            />
          ))}
        </div>
      ) : results.length === 0 ? (
        <DirectoryEmptyState />
      ) : (
        <ProfessionalsResultsTable results={results} />
      )}
    </div>
  );
}
