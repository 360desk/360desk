"use client";

import { useEffect } from "react";

export type TeamInviteToastVariant = "success" | "amber";

interface TeamInviteToastProps {
  message: string;
  variant: TeamInviteToastVariant;
  onDismiss: () => void;
  durationMs?: number;
}

export function TeamInviteToast({
  message,
  variant,
  onDismiss,
  durationMs = 5200,
}: TeamInviteToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, onDismiss]);

  const styles =
    variant === "success"
      ? "border-emerald-400/35 bg-gradient-to-r from-emerald-950/70 via-charcoal-light to-emerald-950/40 text-emerald-100 shadow-emerald-900/20"
      : "border-amber-400/40 bg-gradient-to-r from-amber-950/70 via-charcoal-light to-amber-950/35 text-amber-100 shadow-amber-900/25";

  const iconStyles =
    variant === "success"
      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
      : "border-amber-400/45 bg-amber-500/15 text-amber-200";

  return (
    <div
      className={`pointer-events-auto fixed inset-x-4 top-6 z-[80] mx-auto flex max-w-xl items-start gap-3 rounded-2xl border px-4 py-4 shadow-2xl backdrop-blur-md sm:inset-x-auto sm:right-8 sm:top-8 ${styles}`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${iconStyles}`}
      >
        {variant === "success" ? "✓" : "!"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold tracking-wide">
          {variant === "success" ? "Davet Tamamlandı" : "Mevcut Danışman Daveti"}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-cream/85">{message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-cream/55 transition-colors hover:bg-cream/10 hover:text-cream"
        aria-label="Bildirimi kapat"
      >
        Kapat
      </button>
    </div>
  );
}

export const TEAM_INVITE_TOAST_MESSAGES = {
  external_invited:
    "Sistem dışı danışman daveti oluşturuldu. Bekleyen kayıt tabloda görünecek; test linki ile kayıt akışını simüle edebilirsiniz.",
  internal_invited:
    "Kayıtlı danışmana ofis daveti gönderildi. Kullanıcı panelinde bildirim tetiklenecek.",
  office_invited:
    "Alt ofis / şube daveti oluşturuldu. Broker adayı kayıt ve sözleşme onayı sonrası bağlanacak.",
  invite_resent: (email: string) =>
    `${email} için davet yenilendi. Onay bağlantısı güncellendi ve tekrar gönderildi.`,
  invite_cancelled: (email: string) =>
    `${email} için bekleyen davet iptal edildi ve kota güncellendi.`,
  test_link_copied: (email: string) =>
    `${email} için test onay bağlantısı panoya kopyalandı. Gizli pencerede yapıştırarak onboarding akışını deneyebilirsiniz.`,
} as const;
