"use client";

const inviteActionClass =
  "inline-flex w-full items-center justify-center rounded-xl border px-5 py-3 text-sm font-semibold tracking-wide text-cream shadow-lg transition-all duration-200 active:scale-[0.98]";

const primaryActionClass = `${inviteActionClass} border-primary/45 bg-gradient-to-r from-primary to-primary-dark shadow-primary/30 hover:from-primary-dark hover:to-primary hover:shadow-primary/45`;

const secondaryActionClass = `${inviteActionClass} border-cream/20 bg-gradient-to-r from-charcoal-light to-charcoal shadow-black/25 hover:border-primary/35 hover:from-charcoal hover:to-charcoal-light`;

const accentActionClass = `${inviteActionClass} border-amber-400/35 bg-gradient-to-r from-amber-950/80 to-charcoal-light text-amber-100 shadow-amber-900/20 hover:border-amber-400/55 hover:from-amber-950 hover:to-charcoal`;

const disabledActionClass =
  "cursor-not-allowed opacity-50 shadow-none hover:from-inherit hover:to-inherit";

interface TeamInviteActionsBarProps {
  showOfficeInvite: boolean;
  externalQuotaFull: boolean;
  internalQuotaFull: boolean;
  officeQuotaFull: boolean;
  onExternalInvite: () => void;
  onInternalInvite: () => void;
  onOfficeInvite: () => void;
  onQuotaBlocked?: () => void;
  onOfficeQuotaBlocked?: () => void;
}

function guardedClick(isBlocked: boolean, onBlocked: (() => void) | undefined, action: () => void) {
  if (isBlocked) {
    onBlocked?.();
    return;
  }

  action();
}

export function TeamInviteActionsBar({
  showOfficeInvite,
  externalQuotaFull,
  internalQuotaFull,
  officeQuotaFull,
  onExternalInvite,
  onInternalInvite,
  onOfficeInvite,
  onQuotaBlocked,
  onOfficeQuotaBlocked,
}: TeamInviteActionsBarProps) {
  return (
    <div className="flex w-full flex-col gap-3 lg:w-auto">
      <button
        type="button"
        aria-disabled={externalQuotaFull}
        className={`${primaryActionClass} ${externalQuotaFull ? disabledActionClass : ""}`}
        onClick={() =>
          guardedClick(externalQuotaFull, onQuotaBlocked, onExternalInvite)
        }
      >
        Sistem Dışı Yeni Danışman Davet Et
      </button>
      <button
        type="button"
        aria-disabled={internalQuotaFull}
        className={`${secondaryActionClass} ${internalQuotaFull ? disabledActionClass : ""}`}
        onClick={() =>
          guardedClick(internalQuotaFull, onQuotaBlocked, onInternalInvite)
        }
      >
        Mevcut Kayıtlı Danışmanı Ofise Davet Et
      </button>
      {showOfficeInvite && (
        <button
          type="button"
          aria-disabled={officeQuotaFull}
          className={`${accentActionClass} ${officeQuotaFull ? disabledActionClass : ""}`}
          onClick={() =>
            guardedClick(officeQuotaFull, onOfficeQuotaBlocked ?? onQuotaBlocked, onOfficeInvite)
          }
        >
          Yeni Alt Ofis / Şube Davet Et
        </button>
      )}
    </div>
  );
}

export { primaryActionClass, secondaryActionClass, accentActionClass };
