import type { AdStatus } from "@/types/database";
import { AD_STATUS_LABELS } from "@/lib/format";

const statusStyles: Record<AdStatus, string> = {
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  approved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  rejected: "bg-red-500/15 text-red-300 border-red-500/30",
};

export function StatusBadge({ status }: { status: AdStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}
    >
      {AD_STATUS_LABELS[status]}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    guest: "bg-cream/10 text-cream/60 border-cream/20",
    vendor: "bg-primary/15 text-primary border-primary/30",
    admin: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  };

  const labels: Record<string, string> = {
    guest: "Misafir",
    vendor: "Satıcı",
    admin: "Yönetici",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[role] ?? styles.guest}`}
    >
      {labels[role] ?? role}
    </span>
  );
}
