import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-cream/10 bg-charcoal-light px-6 py-16 sm:px-12 sm:py-20">
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/5 blur-2xl" />

      <div className="relative max-w-4xl">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-cream leading-tight">
          Türkiye&apos;nin{" "}
          <span className="text-primary">Emlak Profesyonellerinin</span> Merkezine
          Hoşgeldiniz
        </h1>
        <p className="mt-5 max-w-3xl text-base sm:text-lg text-cream/60 leading-relaxed">
          Emlak profesyoneli olarak işinizi takip etmek, mülklerinizi yönetmek,
          yatırımcılarınızla iletişimde kalmak, gelirlerinizi görmek ve diğer
          profesyonel ve yatırımcılarla etkileşimde olmak için hemen ücretsiz
          deneme üyeliğini başlatın ve işinizde yeni bir aşamaya geçin
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/fiyatlandirma">
            <Button size="lg">Hemen Üye Ol</Button>
          </Link>
          <Link href="/profesyoneller">
            <Button variant="secondary" size="lg">
              Profesyonelleri Gör
            </Button>
          </Link>
          <Link href="/ilanlar">
            <Button variant="outline" size="lg">
              Açık İlanlara Göz At
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
