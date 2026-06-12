"use client";

import Link from "next/link";
import { ProfessionalAvatar } from "@/components/professionals/ProfessionalAvatar";
import { ProfessionalLevelBadge } from "@/components/professionals/ProfessionalLevelBadge";
import type { ProfessionalDirectoryEntry } from "@/types/professionals-search";

interface ProfessionalsResultsTableProps {
  results: ProfessionalDirectoryEntry[];
}

function formatLocation(value: string | null) {
  return value?.trim() || "—";
}

export function ProfessionalsResultsTable({
  results,
}: ProfessionalsResultsTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-cream/10 bg-charcoal-light">
      <div className="overflow-x-auto">
        <table className="min-w-[1080px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-cream/10 bg-charcoal">
              {[
                "",
                "Profesyonel",
                "İl",
                "İlçe",
                "Mahalle",
                "Toplam İlan",
                "Sistem İçi",
                "Genele Açık",
              ].map((heading) => (
                <th
                  key={heading || "avatar"}
                  className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-cream/45"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((professional) => (
              <tr
                key={professional.id}
                className="border-b border-cream/8 transition-colors last:border-b-0 hover:bg-cream/[0.03]"
              >
                <td className="px-4 py-4">
                  <Link
                    href={`/profesyoneller/${professional.id}`}
                    className="inline-flex"
                  >
                    <ProfessionalAvatar
                      name={professional.display_name}
                      avatarUrl={professional.avatar_url}
                    />
                  </Link>
                </td>
                <td className="px-4 py-4">
                  <Link
                    href={`/profesyoneller/${professional.id}`}
                    className="group flex min-w-[220px] flex-col gap-2"
                  >
                    <span className="font-semibold text-cream transition-colors group-hover:text-primary">
                      {professional.display_name}
                    </span>
                    <ProfessionalLevelBadge
                      level={professional.professional_level}
                    />
                  </Link>
                </td>
                <td className="px-4 py-4 text-sm text-cream/75">
                  <Link href={`/profesyoneller/${professional.id}`}>
                    {formatLocation(professional.city_name)}
                  </Link>
                </td>
                <td className="px-4 py-4 text-sm text-cream/75">
                  <Link href={`/profesyoneller/${professional.id}`}>
                    {formatLocation(professional.district_name)}
                  </Link>
                </td>
                <td className="px-4 py-4 text-sm text-cream/75">
                  <Link href={`/profesyoneller/${professional.id}`}>
                    {formatLocation(professional.neighborhood_name)}
                  </Link>
                </td>
                <td className="px-4 py-4 text-sm font-medium text-cream">
                  <Link href={`/profesyoneller/${professional.id}`}>
                    {professional.total_listings}
                  </Link>
                </td>
                <td className="px-4 py-4 text-sm text-cream/70">
                  <Link href={`/profesyoneller/${professional.id}`}>
                    {professional.system_listings}
                  </Link>
                </td>
                <td className="px-4 py-4 text-sm font-medium text-primary">
                  <Link href={`/profesyoneller/${professional.id}`}>
                    {professional.public_listings}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
