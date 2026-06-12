"use client";

import type { FranchiseBranchOffice } from "@/lib/franchise-network";
import {
  resolveBranchListingScopeIds,
  resolveFranchiseNetworkScopeIds,
} from "@/lib/franchise-network";

interface FranchiseBranchFilterProps {
  branches: FranchiseBranchOffice[];
  selectedBranchId: string;
  onChange: (branchId: string) => void;
  loading?: boolean;
}

export function FranchiseBranchFilter({
  branches,
  selectedBranchId,
  onChange,
  loading = false,
}: FranchiseBranchFilterProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Franchise Ağı
        </p>
        <p className="mt-1 text-sm text-cream/55">
          Tüm ağ portföylerini görüntüleyin veya belirli bir şube seçin.
        </p>
      </div>
      <label className="flex min-w-[240px] flex-col gap-1.5">
        <span className="text-xs font-medium text-cream/45">Şube Filtresi</span>
        <select
          value={selectedBranchId}
          onChange={(event) => onChange(event.target.value)}
          disabled={loading}
          className="rounded-lg border border-cream/15 bg-charcoal-light px-3 py-2.5 text-sm text-cream outline-none transition-colors focus:border-primary/50"
        >
          <option value="all">Tüm Franchise Ağı</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.company_name || branch.full_name || branch.email}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function resolveFranchiseListingScope(
  masterId: string,
  branches: FranchiseBranchOffice[],
  selectedBranchId: string
): string[] {
  if (selectedBranchId === "all") {
    return resolveFranchiseNetworkScopeIds(masterId, branches);
  }

  const branch = branches.find((item) => item.id === selectedBranchId);
  if (!branch) {
    return [masterId];
  }

  return resolveBranchListingScopeIds(branch);
}
