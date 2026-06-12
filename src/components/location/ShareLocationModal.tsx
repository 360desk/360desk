"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  buildCrmClipboardText,
  buildWhatsAppShareUrl,
  hasShareableCoordinates,
  resolveShareAddress,
} from "@/lib/listing-geo";
import type { ShareLocationPayload } from "@/types/listing-geo";

interface ShareLocationModalProps {
  open: boolean;
  onClose: () => void;
  payload: ShareLocationPayload;
}

export function ShareLocationModal({
  open,
  onClose,
  payload,
}: ShareLocationModalProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const whatsappUrl = buildWhatsAppShareUrl(payload);
  const canShareCoordinates = hasShareableCoordinates(payload);
  const address = resolveShareAddress(payload);

  const handleCopy = async () => {
    setError("");
    setCopied(false);

    try {
      await navigator.clipboard.writeText(buildCrmClipboardText(payload));
      setCopied(true);
    } catch {
      setError("Panoya kopyalanamadı. Lütfen tekrar deneyin.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Konumu Paylaş"
      footer={
        <Button variant="ghost" onClick={onClose}>
          Kapat
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-4">
          <p className="text-sm font-semibold text-cream">{payload.title}</p>
          <p className="mt-2 text-sm leading-relaxed text-cream/65">{address}</p>
          {canShareCoordinates && (
            <p className="mt-2 font-mono text-xs text-cream/45">
              {payload.latitude}, {payload.longitude}
            </p>
          )}
        </div>

        {!canShareCoordinates && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-sm text-amber-200">
            Bu ilan için henüz harita koordinatı işaretlenmemiş. WhatsApp paylaşımı
            koordinat eklendikten sonra aktif olur; CRM metni yine de kopyalanabilir.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href={whatsappUrl ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!whatsappUrl}
            className={!whatsappUrl ? "pointer-events-none" : undefined}
          >
            <Button
              className="w-full"
              disabled={!whatsappUrl}
            >
              WhatsApp ile Gönder
            </Button>
          </a>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => void handleCopy()}
          >
            {copied ? "Kopyalandı" : "CRM / Müşteri Kartı Kopyala"}
          </Button>
        </div>

        {error && (
          <p className="text-sm text-red-300" role="alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
