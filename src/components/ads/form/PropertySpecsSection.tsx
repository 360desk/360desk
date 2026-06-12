"use client";

import type { CategorySelection } from "@/lib/categories";
import {
  showBuildingAgeField,
  showFloorFields,
  showHeatingField,
  showRoomCountField,
  showUsageSubtypeField,
} from "@/lib/dynamic-properties";
import { HEATING_TYPES, ROOM_COUNTS } from "@/lib/format";
import type { PropertySpecs } from "@/types/dynamic-properties";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FormSection } from "@/components/ads/form/FormSection";

interface PropertySpecsSectionProps {
  category: CategorySelection;
  value: PropertySpecs;
  onChange: (value: PropertySpecs) => void;
  tasinmazNo: string;
  onTasinmazNoChange: (value: string) => void;
  tasinmazNoError?: string;
  disabled?: boolean;
}

export function PropertySpecsSection({
  category,
  value,
  onChange,
  tasinmazNo,
  onTasinmazNoChange,
  tasinmazNoError,
  disabled,
}: PropertySpecsSectionProps) {
  const update = (partial: Partial<PropertySpecs>) =>
    onChange({ ...value, ...partial });

  return (
    <FormSection
      title="Yapı & Özellikler"
      description="Emlak tipine göre temel metrikleri girin"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input
            label="Taşınmaz Bilgi Numarası"
            value={tasinmazNo}
            disabled={disabled}
            onChange={(e) => onTasinmazNoChange(e.target.value)}
            placeholder="Örn: 1234567890"
            error={tasinmazNoError}
          />
          <p className="mt-1.5 text-xs text-cream/40">
            Taslak kayıtta isteğe bağlıdır. Onaya gönderirken zorunludur.
          </p>
        </div>

        <Input
          label="m² (Brüt)"
          type="number"
          min="1"
          value={value.sq_meters_gross ?? ""}
          disabled={disabled}
          onChange={(e) =>
            update({
              sq_meters_gross: e.target.value
                ? parseInt(e.target.value, 10)
                : null,
            })
          }
          placeholder="120"
        />
        <Input
          label="m² (Net)"
          type="number"
          min="1"
          value={value.sq_meters_net ?? ""}
          disabled={disabled}
          onChange={(e) =>
            update({
              sq_meters_net: e.target.value
                ? parseInt(e.target.value, 10)
                : null,
            })
          }
          placeholder="105"
        />

        {showRoomCountField(category) && (
          <Select
            label="Oda Sayısı"
            value={value.room_count ?? ROOM_COUNTS[2]}
            disabled={disabled}
            onChange={(e) => update({ room_count: e.target.value })}
            options={ROOM_COUNTS.map((r) => ({ value: r, label: r }))}
          />
        )}

        {showUsageSubtypeField(category) && category.category_sub && (
          <Input
            label="Alt Kullanım Tipi"
            value={category.category_sub}
            readOnly
            className="opacity-70 cursor-not-allowed"
          />
        )}

        {showHeatingField(category) && (
          <Select
            label="Isıtma Tipi"
            value={value.heating_type ?? HEATING_TYPES[0]}
            disabled={disabled}
            onChange={(e) => update({ heating_type: e.target.value })}
            options={HEATING_TYPES.map((h) => ({ value: h, label: h }))}
          />
        )}

        {showFloorFields(category) && (
          <>
            <Input
              label="Bulunduğu Kat"
              value={value.floor_number ?? ""}
              disabled={disabled}
              onChange={(e) =>
                update({ floor_number: e.target.value || null })
              }
              placeholder="Örn: 3 veya Zemin"
            />
            <Input
              label="Kat Sayısı"
              type="number"
              min="1"
              value={value.total_floors ?? ""}
              disabled={disabled}
              onChange={(e) =>
                update({
                  total_floors: e.target.value
                    ? parseInt(e.target.value, 10)
                    : null,
                })
              }
              placeholder="8"
            />
          </>
        )}

        {showBuildingAgeField(category) && (
          <Input
            label="Bina Yaşı"
            type="number"
            min="0"
            value={value.building_age ?? ""}
            disabled={disabled}
            onChange={(e) =>
              update({
                building_age: e.target.value
                  ? parseInt(e.target.value, 10)
                  : null,
              })
            }
            placeholder="5"
          />
        )}
      </div>
    </FormSection>
  );
}
