"use client";

import dynamic from "next/dynamic";
import type { MapFocusTarget } from "@/types/listing-geo";

interface ListingLocationMapProps {
  latitude: number | null;
  longitude: number | null;
  focusTarget: MapFocusTarget | null;
  disabled?: boolean;
  onCoordinatesChange: (latitude: number, longitude: number) => void;
}

const ListingLocationMapInner = dynamic(
  () =>
    import("@/components/maps/ListingLocationMapInner").then(
      (module) => module.ListingLocationMapInner
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] items-center justify-center rounded-2xl border border-charcoal/10 bg-white text-sm text-charcoal/50">
        Harita yükleniyor...
      </div>
    ),
  }
);

export function ListingLocationMap(props: ListingLocationMapProps) {
  return <ListingLocationMapInner {...props} />;
}
