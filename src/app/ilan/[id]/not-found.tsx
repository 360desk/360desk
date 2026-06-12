import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function AdNotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-6xl font-bold text-primary/30 mb-4">404</p>
      <h1 className="text-2xl font-bold text-cream mb-2">İlan Bulunamadı</h1>
      <p className="text-cream/50 mb-8">
        Bu ilan mevcut değil, kaldırılmış veya henüz onaylanmamış olabilir.
      </p>
      <Link href="/">
        <Button>Ana Sayfaya Dön</Button>
      </Link>
    </div>
  );
}
