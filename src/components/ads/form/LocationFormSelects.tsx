"use client";

import { useLocationTree } from "@/hooks/useLocationTree";
import { locationNodeToMapFocus } from "@/lib/location-nodes";
import { MAP_FOCUS_ZOOM } from "@/lib/listing-geo";
import {
  LOCATION_PLACEHOLDER_VALUE,
  type ListingLocationIds,
  type ListingLocationSelection,
} from "@/types/listing-location";

interface LocationFormSelectsProps {
  value: ListingLocationIds;
  names: {
    city_name: string;
    district_name: string;
    neighborhood_name: string;
  };
  onChange: (selection: ListingLocationSelection) => void;
  disabled?: boolean;
  error?: string | null;
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

export function LocationFormSelects({
  value,
  names,
  onChange,
  disabled = false,
  error,
}: LocationFormSelectsProps) {
  const {
    cities,
    districts,
    neighborhoods,
    loadingCities,
    loadingDistricts,
    loadingNeighborhoods,
    error: fetchError,
  } = useLocationTree({
    cityId: value.city_id,
    districtId: value.district_id,
  });

  const handleCityChange = (cityId: string) => {
    const city = cities.find((item) => item.id === cityId);

    onChange({
      city_id: cityId,
      district_id: LOCATION_PLACEHOLDER_VALUE,
      neighborhood_id: LOCATION_PLACEHOLDER_VALUE,
      city_name: city?.name ?? "",
      district_name: "",
      neighborhood_name: "",
      map_focus: city
        ? locationNodeToMapFocus(city, MAP_FOCUS_ZOOM.city)
        : null,
    });
  };

  const handleDistrictChange = (districtId: string) => {
    const district = districts.find((item) => item.id === districtId);

    onChange({
      ...value,
      district_id: districtId,
      neighborhood_id: LOCATION_PLACEHOLDER_VALUE,
      city_name: names.city_name,
      district_name: district?.name ?? "",
      neighborhood_name: "",
    });
  };

  const handleNeighborhoodChange = (neighborhoodId: string) => {
    const neighborhood = neighborhoods.find((item) => item.id === neighborhoodId);

    onChange({
      ...value,
      neighborhood_id: neighborhoodId,
      city_name: names.city_name,
      district_name: names.district_name,
      neighborhood_name: neighborhood?.name ?? "",
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="form-city" className="text-sm font-medium text-cream/80">
            İl Seçin
          </label>
          <div className="relative">
            <select
              id="form-city"
              value={value.city_id}
              disabled={disabled || loadingCities}
              onChange={(event) => handleCityChange(event.target.value)}
              className={selectClassName}
            >
              <option value={LOCATION_PLACEHOLDER_VALUE}>
                Lütfen Seçiniz...
              </option>
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
            htmlFor="form-district"
            className="text-sm font-medium text-cream/80"
          >
            İlçe Seçin
          </label>
          <div className="relative">
            <select
              id="form-district"
              value={value.district_id}
              disabled={
                disabled ||
                loadingDistricts ||
                !value.city_id
              }
              onChange={(event) => handleDistrictChange(event.target.value)}
              className={selectClassName}
            >
              <option value={LOCATION_PLACEHOLDER_VALUE}>
                Lütfen Seçiniz...
              </option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
            <SelectChevron />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
          <label
            htmlFor="form-neighborhood"
            className="text-sm font-medium text-cream/80"
          >
            Mahalle Seçin
          </label>
          <div className="relative">
            <select
              id="form-neighborhood"
              value={value.neighborhood_id}
              disabled={
                disabled ||
                loadingNeighborhoods ||
                !value.district_id
              }
              onChange={(event) => handleNeighborhoodChange(event.target.value)}
              className={selectClassName}
            >
              <option value={LOCATION_PLACEHOLDER_VALUE}>
                Lütfen Seçiniz...
              </option>
              {neighborhoods.map((neighborhood) => (
                <option key={neighborhood.id} value={neighborhood.id}>
                  {neighborhood.name}
                </option>
              ))}
            </select>
            <SelectChevron />
          </div>
        </div>
      </div>

      {(error || fetchError) && (
        <p className="text-sm text-red-300" role="alert">
          {error ?? fetchError}
        </p>
      )}
    </div>
  );
}
