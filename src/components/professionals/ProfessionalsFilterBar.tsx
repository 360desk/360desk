"use client";

import { LocationFilterSelects } from "@/components/catalog/LocationFilterSelects";
import type { ProfessionalsFilterState } from "@/lib/professionals-filters";
import type { ProfessionalAccountType } from "@/types/professionals-search";

interface ProfessionalsFilterBarProps {
  filters: ProfessionalsFilterState;
  onChange: (patch: Partial<ProfessionalsFilterState>) => void;
}

const ACCOUNT_SEGMENTS: {
  value: ProfessionalAccountType | null;
  label: string;
}[] = [
  { value: null, label: "Tümü" },
  { value: "bireysel", label: "Bireysel Kullanıcılar" },
  { value: "ofis", label: "Ofisler" },
  { value: "franchise", label: "Franchisolar" },
];

export function ProfessionalsFilterBar({
  filters,
  onChange,
}: ProfessionalsFilterBarProps) {
  return (
    <div className="rounded-2xl border border-cream/10 bg-[#1E1F22] p-5 sm:p-6">
      <div className="flex flex-col gap-6">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-cream/45">
            Hesap Tipi
          </p>
          <div className="flex flex-wrap gap-2">
            {ACCOUNT_SEGMENTS.map((segment) => {
              const isActive = filters.accountType === segment.value;

              return (
                <button
                  key={segment.label}
                  type="button"
                  onClick={() => onChange({ accountType: segment.value })}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-primary/45 bg-primary/15 text-primary"
                      : "border-cream/15 bg-charcoal text-cream/70 hover:border-cream/30 hover:text-cream"
                  }`}
                >
                  {segment.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-cream/45">
            Konum
          </p>
          <LocationFilterSelects
            layout="inline"
            filters={{
              search: "",
              cityId: filters.cityId,
              districtId: filters.districtId,
              neighborhoodId: filters.neighborhoodId,
              propertySegment: null,
              luxuryTier: false,
              premiumTier: false,
              minPrice: "",
              maxPrice: "",
            }}
            onChange={(patch) =>
              onChange({
                cityId: patch.cityId ?? filters.cityId,
                districtId: patch.districtId ?? filters.districtId,
                neighborhoodId: patch.neighborhoodId ?? filters.neighborhoodId,
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
