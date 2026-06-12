"use client";

import type { CategorySelection } from "@/lib/categories";
import { AMENITY_OPTIONS, showCommunityFields } from "@/lib/dynamic-properties";
import type { CommunitySpecs } from "@/types/dynamic-properties";
import { Input } from "@/components/ui/Input";
import { FormSection } from "@/components/ads/form/FormSection";

interface CommunitySpecsSectionProps {
  category: CategorySelection;
  value: CommunitySpecs;
  onChange: (value: CommunitySpecs) => void;
  disabled?: boolean;
}

export function CommunitySpecsSection({
  category,
  value,
  onChange,
  disabled,
}: CommunitySpecsSectionProps) {
  if (!showCommunityFields(category)) return null;

  const toggleAmenity = (id: string) => {
    const amenities = value.amenities.includes(id)
      ? value.amenities.filter((a) => a !== id)
      : [...value.amenities, id];
    onChange({ ...value, amenities });
  };

  return (
    <FormSection
      title="Site & Sosyal Olanaklar"
      description="Konut kompleksi ve ortak alan bilgileri"
    >
      <div className="flex flex-col gap-4">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={value.is_in_complex}
            disabled={disabled}
            onChange={(e) =>
              onChange({
                ...value,
                is_in_complex: e.target.checked,
                complex_name: e.target.checked ? value.complex_name : null,
              })
            }
            className="h-4 w-4 rounded border-cream/30 bg-charcoal text-primary focus:ring-primary focus:ring-offset-charcoal"
          />
          <span className="text-sm text-cream group-hover:text-cream/80">
            Site / Rezidans içinde
          </span>
        </label>

        {value.is_in_complex && (
          <Input
            label="Site / Rezidans Adı"
            value={value.complex_name ?? ""}
            disabled={disabled}
            onChange={(e) =>
              onChange({ ...value, complex_name: e.target.value || null })
            }
            placeholder="Örn: Park Residence"
          />
        )}

        <div>
          <p className="text-sm font-medium text-cream/80 mb-3">Olanaklar</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {AMENITY_OPTIONS.map((amenity) => (
              <label
                key={amenity.id}
                className="flex items-center gap-3 rounded-lg border border-cream/10 px-3 py-2.5 cursor-pointer transition-colors hover:border-primary/40 hover:bg-cream/5"
              >
                <input
                  type="checkbox"
                  checked={value.amenities.includes(amenity.id)}
                  disabled={disabled}
                  onChange={() => toggleAmenity(amenity.id)}
                  className="h-4 w-4 rounded border-cream/30 bg-charcoal text-primary focus:ring-primary"
                />
                <span className="text-sm text-cream/70">{amenity.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </FormSection>
  );
}
