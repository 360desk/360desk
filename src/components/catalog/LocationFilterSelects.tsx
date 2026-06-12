"use client";

import { useLocationTree } from "@/hooks/useLocationTree";
import { LOCATION_ALL_VALUE } from "@/types/location";
import type { CatalogFilterState } from "@/lib/catalog-filters";

interface LocationFilterSelectsProps {
  filters: CatalogFilterState;
  onChange: (patch: Partial<CatalogFilterState>) => void;
  layout?: "stacked" | "inline";
}

const selectClassName =
  "w-full appearance-none rounded-lg border border-cream/15 bg-charcoal px-4 py-2.5 pr-10 text-sm text-cream outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50";

function SelectChevron() {
  return (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/40"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export function LocationFilterSelects({
  filters,
  onChange,
  layout = "stacked",
}: LocationFilterSelectsProps) {
  const {
    cities,
    districts,
    neighborhoods,
    loadingCities,
    loadingDistricts,
    loadingNeighborhoods,
    error,
  } = useLocationTree({
    cityId: filters.cityId,
    districtId: filters.districtId,
  });

  const handleCityChange = (value: string) => {
    onChange({
      cityId: value,
      districtId: LOCATION_ALL_VALUE,
      neighborhoodId: LOCATION_ALL_VALUE,
    });
  };

  const handleDistrictChange = (value: string) => {
    onChange({
      districtId: value,
      neighborhoodId: LOCATION_ALL_VALUE,
    });
  };

  const containerClassName =
    layout === "inline"
      ? "grid grid-cols-1 gap-4 md:grid-cols-3"
      : "flex flex-col gap-4";

  return (
    <div className={containerClassName}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="city-filter" className="text-sm font-medium text-cream/80">
          İl
        </label>
        <div className="relative">
          <select
            id="city-filter"
            value={filters.cityId}
            disabled={loadingCities}
            onChange={(e) => handleCityChange(e.target.value)}
            className={selectClassName}
          >
            <option value={LOCATION_ALL_VALUE}>Tamamı</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
          <SelectChevron />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="district-filter"
          className="text-sm font-medium text-cream/80"
        >
          İlçe
        </label>
        <div className="relative">
          <select
            id="district-filter"
            value={filters.districtId}
            disabled={
              loadingDistricts || filters.cityId === LOCATION_ALL_VALUE
            }
            onChange={(e) => handleDistrictChange(e.target.value)}
            className={selectClassName}
          >
            <option value={LOCATION_ALL_VALUE}>Tamamı</option>
            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
          <SelectChevron />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="neighborhood-filter"
          className="text-sm font-medium text-cream/80"
        >
          Mahalle
        </label>
        <div className="relative">
          <select
            id="neighborhood-filter"
            value={filters.neighborhoodId}
            disabled={
              loadingNeighborhoods || filters.districtId === LOCATION_ALL_VALUE
            }
            onChange={(e) => onChange({ neighborhoodId: e.target.value })}
            className={selectClassName}
          >
            <option value={LOCATION_ALL_VALUE}>Tamamı</option>
            {neighborhoods.map((neighborhood) => (
              <option key={neighborhood.id} value={neighborhood.id}>
                {neighborhood.name}
              </option>
            ))}
          </select>
          <SelectChevron />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
