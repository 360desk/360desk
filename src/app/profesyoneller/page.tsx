import { Suspense } from "react";
import type { Metadata } from "next";
import { ProfessionalsDirectoryPage } from "@/components/professionals/ProfessionalsDirectoryPage";

export const metadata: Metadata = {
  title: "Profesyoneller — 360desk Enterprise Network",
  description:
    "Türkiye genelindeki emlak profesyonellerini il, ilçe ve mahalle filtreleriyle keşfedin.",
};

function DirectoryFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 h-32 animate-pulse rounded-2xl bg-charcoal-light" />
      <div className="mb-6 h-40 animate-pulse rounded-2xl bg-[#1E1F22]" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-16 animate-pulse rounded-xl bg-charcoal-light"
          />
        ))}
      </div>
    </div>
  );
}

export default function ProfesyonellerPage() {
  return (
    <Suspense fallback={<DirectoryFallback />}>
      <ProfessionalsDirectoryPage />
    </Suspense>
  );
}
