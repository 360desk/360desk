"use client";

import { useMemo, type Dispatch, type SetStateAction } from "react";
import { LocationFormSelects } from "@/components/ads/form/LocationFormSelects";
import { ListingLocationMap } from "@/components/maps/ListingLocationMap";
import { FormSection } from "@/components/ads/form/FormSection";
import { Input } from "@/components/ui/Input";
import { resolveMapFocusTarget } from "@/lib/listing-geo";
import type { ListingGeoState, MapFocusTarget } from "@/types/listing-geo";
import type {
  ListingLocationIds,
  ListingLocationSelection,
} from "@/types/listing-location";
import type { LocationSpecs } from "@/types/dynamic-properties";

interface LocationSpecsSectionProps {
  value: LocationSpecs;
  onChange: (value: LocationSpecs) => void;
  locationIds: ListingLocationIds;
  onLocationChange: (selection: ListingLocationSelection) => void;
  geo: ListingGeoState;
  onGeoChange: Dispatch<SetStateAction<ListingGeoState>>;
  mapFocus?: MapFocusTarget | null;
  disabled?: boolean;
  locationError?: string | null;
}

export function LocationSpecsSection({
  value,
  onChange,
  locationIds,
  onLocationChange,
  geo,
  onGeoChange,
  mapFocus,
  disabled,
  locationError,
}: LocationSpecsSectionProps) {
  const update = (partial: Partial<LocationSpecs>) =>
    onChange({ ...value, ...partial });

  const handleLocationSelection = (selection: ListingLocationSelection) => {
    onLocationChange(selection);
    onChange({
      ...value,
      city: selection.city_name,
      district: selection.district_name,
      neighborhood: selection.neighborhood_name,
    });
  };

  const focusTarget = useMemo(
    () =>
      resolveMapFocusTarget(
        locationIds,
        { city_name: value.city },
        mapFocus
      ),
    [locationIds.city_id, mapFocus, value.city]
  );

  return (
    <FormSection
      title="Konum & Ulaşım"
      description="Resmi il, ilçe ve mahalle seçimi ile filtre uyumlu konum kaydı"
    >
      <div className="flex flex-col gap-6">
        <LocationFormSelects
          value={locationIds}
          names={{
            city_name: value.city,
            district_name: value.district,
            neighborhood_name: value.neighborhood ?? "",
          }}
          onChange={handleLocationSelection}
          disabled={disabled}
          error={locationError}
        />

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="full-address"
            className="text-sm font-medium text-cream/80"
          >
            Açık Adres
          </label>
          <textarea
            id="full-address"
            value={geo.full_address}
            disabled={disabled}
            onChange={(event) =>
              onGeoChange((prev) => ({
                ...prev,
                full_address: event.target.value,
              }))
            }
            placeholder="Cadde, sokak, bina no, daire ve yön tarifi..."
            className="min-h-[96px] w-full rounded-lg border border-cream/15 bg-charcoal px-4 py-3 text-sm text-cream outline-none transition-colors placeholder:text-cream/30 focus:border-primary focus:ring-1 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <ListingLocationMap
          latitude={geo.latitude}
          longitude={geo.longitude}
          focusTarget={focusTarget}
          disabled={disabled}
          onCoordinatesChange={(latitude, longitude) =>
            onGeoChange((prev) => ({
              ...prev,
              latitude,
              longitude,
            }))
          }
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Metroya Mesafe (m)"
            type="number"
            min="0"
            value={value.subway_distance_m ?? ""}
            disabled={disabled}
            onChange={(event) =>
              update({
                subway_distance_m: event.target.value
                  ? parseInt(event.target.value, 10)
                  : null,
              })
            }
            placeholder="500"
          />
          <Input
            label="Otoyol / Ana Yol Erişimi"
            value={value.highway_access ?? ""}
            disabled={disabled}
            onChange={(event) =>
              update({ highway_access: event.target.value || null })
            }
            placeholder="Örn: İzmir Yolu 2 dk"
          />
          <div className="sm:col-span-2">
            <label
              htmlFor="nearby-pois"
              className="mb-1.5 block text-sm font-medium text-cream/80"
            >
              Yakın Çevre & Önemli Noktalar
            </label>
            <textarea
              id="nearby-pois"
              value={value.nearby_pois ?? ""}
              disabled={disabled}
              onChange={(event) =>
                update({ nearby_pois: event.target.value || null })
              }
              placeholder="AVM, okul, hastane, park vb."
              className="min-h-[96px] w-full rounded-lg border border-cream/15 bg-charcoal px-4 py-3 text-sm text-cream outline-none transition-colors placeholder:text-cream/30 focus:border-primary focus:ring-1 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
      </div>
    </FormSection>
  );
}
