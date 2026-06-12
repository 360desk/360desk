"use client";

const franchiseActionClass =
  "inline-flex items-center justify-center rounded-xl border border-primary/45 bg-gradient-to-r from-primary to-primary-dark px-5 py-3 text-sm font-semibold tracking-wide text-cream shadow-lg shadow-primary/30 transition-all duration-200 hover:from-primary-dark hover:to-primary hover:shadow-primary/45 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none";

interface FranchiseMasterInviteActionsProps {
  branchQuotaFull: boolean;
  hqQuotaFull: boolean;
  onInviteBranch: () => void;
  onInviteHqAgent: () => void;
}

export function FranchiseMasterInviteActions({
  branchQuotaFull,
  hqQuotaFull,
  onInviteBranch,
  onInviteHqAgent,
}: FranchiseMasterInviteActionsProps) {
  return (
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
      <button
        type="button"
        className={franchiseActionClass}
        disabled={branchQuotaFull}
        onClick={onInviteBranch}
      >
        Yeni Alt Ofis / Şube Davet Et
      </button>
      <button
        type="button"
        className={franchiseActionClass}
        disabled={hqQuotaFull}
        onClick={onInviteHqAgent}
      >
        Yeni Merkez Danışmanı Davet Et
      </button>
    </div>
  );
}

export { franchiseActionClass };
