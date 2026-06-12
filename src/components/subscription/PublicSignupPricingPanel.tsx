"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PricingTierMatrix } from "@/components/subscription/PricingTierMatrix";
import type { SubscriptionTier } from "@/types/subscription-tier";

export function PublicSignupPricingPanel() {
  const router = useRouter();

  const handleSelectTier = (tier: SubscriptionTier) => {
    router.push(`/kayit?tier=${tier}`);
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          B2B Emlak Platformu
        </p>
        <h1 className="mt-4 text-3xl font-bold text-cream sm:text-4xl">
          İşinize Uygun Paketi Seçin
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-cream/55 sm:text-base">
          Ücretsiz deneme ile başlayın veya kurumsal büyüme paketlerinden birini
          seçerek portföy kotanızı, görsel limitinizi ve ekip yeteneklerinizi
          anında aktive edin.
        </p>
        <p className="mt-4 text-sm text-cream/40">
          Zaten hesabınız var mı?{" "}
          <Link href="/giris" className="font-medium text-primary hover:underline">
            Giriş yapın
          </Link>
        </p>
      </div>

      <PricingTierMatrix
        onTierAction={handleSelectTier}
        getButtonLabel={(tier, _isCurrent) =>
          tier === "free_trial" ? "Hemen Başla" : "Seç"
        }
      />

      <p className="text-center text-xs text-cream/35">
        Paket seçimi sonrası hesap bilgilerinizi tamamlayarak kaydınızı
        bitirebilirsiniz. Kotanız kayıt anında otomatik tanımlanır.
      </p>
    </div>
  );
}
