"use client";

import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { LISTING_CREATION_LIMIT_MESSAGE } from "@/lib/supabase/profile-quota";

interface ListingLimitReachedModalProps {
  open: boolean;
  currentCount: number;
  maxLimit: number;
  onClose?: () => void;
}

export function ListingLimitReachedModal({
  open,
  currentCount,
  maxLimit,
  onClose,
}: ListingLimitReachedModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose ?? (() => undefined)}
      title="İlan Limitine Ulaştınız"
      size="lg"
      footer={
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              Kapat
            </Button>
          )}
          <Link href="/panel/uyelik">
            <Button className="w-full sm:w-auto">Kurumsal Pakete Geç</Button>
          </Link>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/15 via-charcoal to-charcoal-light p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Portföy Kotası Dolu
          </p>
          <p className="mt-3 text-base leading-relaxed text-cream/85">
            {LISTING_CREATION_LIMIT_MESSAGE}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-cream/10 bg-charcoal-light px-4 py-4">
            <p className="text-xs uppercase tracking-wider text-cream/45">
              Mevcut Portföy
            </p>
            <p className="mt-1 text-2xl font-bold text-cream">{currentCount}</p>
          </div>
          <div className="rounded-xl border border-cream/10 bg-charcoal-light px-4 py-4">
            <p className="text-xs uppercase tracking-wider text-cream/45">
              Paket Limiti
            </p>
            <p className="mt-1 text-2xl font-bold text-primary">{maxLimit}</p>
          </div>
        </div>

        <ul className="flex flex-col gap-2 text-sm text-cream/65">
          <li>• Bağımsız Ofis paketi ile 25 ilana çıkın</li>
          <li>• Alt danışman ekleyin ve ofis logonuzu vitrinde kullanın</li>
          <li>• Enterprise Franchise ile çok şubeli ağınızı tek panelden yönetin</li>
        </ul>
      </div>
    </Modal>
  );
}
