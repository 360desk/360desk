"use client";

import { LocationFilterSelects } from "@/components/catalog/LocationFilterSelects";
import { Input } from "@/components/ui/Input";
import {
  SEGMENT_OPTIONS,
  type CatalogFilterState,
  type SegmentOption,
} from "@/lib/catalog-filters";

interface ListingsFilterSidebarProps {
  filters: CatalogFilterState;
  onChange: (patch: Partial<CatalogFilterState>) => void;
  resultCount: number | null;
  loading: boolean;
}

export function ListingsFilterSidebar({
  filters,
  onChange,
  resultCount,
  loading,
}: ListingsFilterSidebarProps) {
  const toggleSegment = (segment: SegmentOption) => {
    onChange({
      propertySegment:
        filters.propertySegment === segment ? null : segment,
    });
  };

  return (
    <aside className="w-full shrink-0 lg:w-[25%]">
      <div className="sticky top-24 rounded-2xl border border-cream/10 bg-[#1E1F22] p-5 shadow-xl shadow-black/20 sm:p-6">
        <div className="mb-6 border-b border-cream/10 pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cream/40">
            Gelişmiş Arama
          </p>
          <h2 className="mt-2 text-xl font-bold text-cream">İlan Filtreleri</h2>
          <p className="mt-1 text-sm text-cream/50">
            Kriterleri seçin; sonuçlar anında güncellenir.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <Input
            label="Anahtar Kelime"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="İlan adı, açıklama veya anahtar kelime..."
          />

          <LocationFilterSelects filters={filters} onChange={onChange} />

          <div className="flex flex-col gap-2.5">
            <span className="text-sm font-medium text-cream/80">Segment</span>
            <div className="flex flex-wrap gap-2">
              {SEGMENT_OPTIONS.map((segment) => {
                const active = filters.propertySegment === segment;
                return (
                  <button
                    key={segment}
                    type="button"
                    onClick={() => toggleSegment(segment)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-200 ${
                      active
                        ? "border-primary bg-primary/15 text-primary shadow-sm shadow-primary/20"
                        : "border-cream/15 bg-charcoal text-cream/60 hover:border-cream/30 hover:text-cream"
                    }`}
                  >
                    {segment}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-cream/80">
              Koleksiyon Seviyesi
            </span>

            <label className="group flex cursor-pointer items-center gap-3 rounded-xl border border-cream/10 bg-charcoal px-4 py-3 transition-colors hover:border-primary/30">
              <input
                type="checkbox"
                checked={filters.luxuryTier}
                onChange={(e) => onChange({ luxuryTier: e.target.checked })}
                className="h-4 w-4 rounded border-cream/20 bg-charcoal text-primary focus:ring-primary/40"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-cream group-hover:text-primary transition-colors">
                  Luxury Collection
                </span>
                <span className="text-xs text-cream/45">
                  Üst segment mimari portföy
                </span>
              </div>
            </label>

            <label className="group flex cursor-pointer items-center gap-3 rounded-xl border border-cream/10 bg-charcoal px-4 py-3 transition-colors hover:border-cream/30">
              <input
                type="checkbox"
                checked={filters.premiumTier}
                onChange={(e) => onChange({ premiumTier: e.target.checked })}
                className="h-4 w-4 rounded border-cream/20 bg-charcoal text-primary focus:ring-primary/40"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-cream group-hover:text-cream transition-colors">
                  Premium Line
                </span>
                <span className="text-xs text-cream/45">
                  Seçkin vitrin ilanları
                </span>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Min. Fiyat (₺)"
              type="number"
              min="0"
              step="1"
              value={filters.minPrice}
              onChange={(e) => onChange({ minPrice: e.target.value })}
              placeholder="0"
            />
            <Input
              label="Max. Fiyat (₺)"
              type="number"
              min="0"
              step="1"
              value={filters.maxPrice}
              onChange={(e) => onChange({ maxPrice: e.target.value })}
              placeholder="Sınırsız"
            />
          </div>
        </div>

        <div className="mt-6 border-t border-cream/10 pt-5">
          <p className="text-xs uppercase tracking-[0.18em] text-cream/40">
            Sonuç
          </p>
          <p className="mt-1 text-lg font-semibold text-cream">
            {loading ? (
              <span className="inline-block h-6 w-16 animate-pulse rounded bg-charcoal-light" />
            ) : (
              `${resultCount ?? 0} ilan`
            )}
          </p>
        </div>
      </div>
    </aside>
  );
}
