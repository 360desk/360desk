import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-cream/10 bg-charcoal-light px-6 py-16 sm:px-12 sm:py-20">
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/5 blur-2xl" />

      <div className="relative max-w-2xl">
        <h1 className="text-4xl sm:text-5xl font-bold text-cream leading-tight">
          İlanlarınızı yönetin,{" "}
          <span className="text-primary">finansınızı</span> takip edin.
        </h1>
        <p className="mt-4 text-lg text-cream/60 leading-relaxed">
          360desk ile ilanlarınızı kolayca oluşturun, gelir ve giderlerinizi
          tek panelden yönetin. Sahibinden tarzı ilan sistemi ve Parasut
          tarzı finans takibi bir arada.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/giris">
            <Button size="lg">Hemen Başla</Button>
          </Link>
          <a href="#ilanlar">
            <Button variant="secondary" size="lg">
              İlanları İncele
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
