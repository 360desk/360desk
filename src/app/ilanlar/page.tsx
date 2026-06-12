import { Suspense } from "react";
import type { Metadata } from "next";
import { ListingsCatalogPage } from "@/components/catalog/ListingsCatalogPage";
import { ListingsCatalogSkeleton } from "@/components/catalog/ListingsCatalogSkeleton";

export const metadata: Metadata = {
  title: "İlanlar — 360desk Lüks Emlak Kataloğu",
  description:
    "Türkiye genelindeki lüks, premium ve standart emlak ilanlarını il, ilçe ve mahalle filtreleriyle keşfedin.",
};

function CatalogPageFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 h-24 animate-pulse rounded-2xl bg-charcoal-light" />
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="h-[520px] w-full animate-pulse rounded-2xl bg-[#1E1F22] lg:w-[25%]" />
        <div className="flex-1">
          <ListingsCatalogSkeleton />
        </div>
      </div>
    </div>
  );
}

export default function IlanlarPage() {
  return (
    <Suspense fallback={<CatalogPageFallback />}>
      <ListingsCatalogPage />
    </Suspense>
  );
}
