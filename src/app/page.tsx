import { Hero } from "@/components/landing/Hero";
import { AdList } from "@/components/ads/AdList";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 flex flex-col gap-12">
      <Hero />

      <section id="ilanlar">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-cream">Yayında Olan İlanlar</h2>
          <p className="text-sm text-cream/50 mt-1">
            Onaylanmış ilanları keşfedin
          </p>
        </div>
        <AdList emptyMessage="Henüz yayında ilan bulunmuyor." />
      </section>
    </div>
  );
}
