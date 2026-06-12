"use client";

import { useState } from "react";
import {
  AMENITY_OPTIONS,
  resolveDynamicProperties,
} from "@/lib/dynamic-properties";
import { formatOptional, formatSqMeters } from "@/lib/format";
import { CATEGORY_LABELS, formatCategoryFromAd } from "@/lib/categories";
import type { ClassifiedAd } from "@/types/database";

interface DynamicPropertiesTabsProps {
  ad: ClassifiedAd;
}

type TabId = "property" | "community" | "location";

const TABS: { id: TabId; label: string }[] = [
  { id: "property", label: "Yapı & Özellikler" },
  { id: "community", label: "Site & Olanaklar" },
  { id: "location", label: "Konum & Ulaşım" },
];

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <span className="text-sm text-cream/50 shrink-0">{label}</span>
      <span className="text-sm font-medium text-cream text-right">{value}</span>
    </div>
  );
}

export function DynamicPropertiesTabs({ ad }: DynamicPropertiesTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("property");
  const dynamic = resolveDynamicProperties(ad);
  const { property_specs: p, community_specs: c, location_specs: l } = dynamic;

  const amenityLabels = c.amenities
    .map((id) => AMENITY_OPTIONS.find((a) => a.id === id)?.label ?? id)
    .join(", ");

  return (
    <div className="rounded-xl border border-cream/10 bg-charcoal-light overflow-hidden">
      <div className="flex border-b border-cream/10 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[120px] px-4 py-3.5 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-cream/50 hover:text-cream hover:bg-cream/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="divide-y divide-cream/10">
        {activeTab === "property" && (
          <>
            <SpecRow label="m² (Brüt)" value={formatSqMeters(p.sq_meters_gross)} />
            <SpecRow label="m² (Net)" value={formatSqMeters(p.sq_meters_net)} />
            <SpecRow label="Oda Sayısı" value={formatOptional(p.room_count)} />
            <SpecRow label="Alt Kullanım Tipi" value={formatOptional(p.usage_subtype ?? ad.category_sub)} />
            <SpecRow label="Bulunduğu Kat" value={formatOptional(p.floor_number)} />
            <SpecRow label="Kat Sayısı" value={formatOptional(p.total_floors)} />
            <SpecRow
              label="Bina Yaşı"
              value={
                p.building_age != null
                  ? `${p.building_age} yıl`
                  : "Belirtilmemiş"
              }
            />
            <SpecRow label="Isıtma Tipi" value={formatOptional(p.heating_type)} />
            <SpecRow label={CATEGORY_LABELS.main} value={formatOptional(ad.category_main)} />
            <SpecRow label={CATEGORY_LABELS.type} value={formatOptional(ad.category_type)} />
            <SpecRow label={CATEGORY_LABELS.group} value={formatOptional(ad.category_group)} />
            <SpecRow label={CATEGORY_LABELS.sub} value={formatOptional(ad.category_sub)} />
            {!ad.category_main && (
              <SpecRow label="Kategori" value={formatCategoryFromAd(ad)} />
            )}
          </>
        )}

        {activeTab === "community" && (
          <>
            <SpecRow
              label="Site / Rezidans"
              value={c.is_in_complex ? "Evet" : "Hayır"}
            />
            <SpecRow
              label="Site Adı"
              value={formatOptional(c.complex_name)}
            />
            <SpecRow
              label="Olanaklar"
              value={amenityLabels || "Belirtilmemiş"}
            />
          </>
        )}

        {activeTab === "location" && (
          <>
            <SpecRow label="Şehir" value={formatOptional(l.city)} />
            <SpecRow label="İlçe" value={formatOptional(l.district)} />
            <SpecRow label="Mahalle" value={formatOptional(l.neighborhood)} />
            <SpecRow
              label="Metroya Mesafe"
              value={
                l.subway_distance_m != null
                  ? `${l.subway_distance_m} m`
                  : "Belirtilmemiş"
              }
            />
            <SpecRow
              label="Otoyol Erişimi"
              value={formatOptional(l.highway_access)}
            />
            <SpecRow
              label="Yakın Çevre"
              value={formatOptional(l.nearby_pois)}
            />
            <SpecRow label="Tam Konum" value={formatOptional(ad.location)} />
          </>
        )}
      </div>
    </div>
  );
}
