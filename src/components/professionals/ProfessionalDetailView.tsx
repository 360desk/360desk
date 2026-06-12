import Link from "next/link";
import { AdCard } from "@/components/ads/AdCard";
import { ProfessionalAvatar } from "@/components/professionals/ProfessionalAvatar";
import { ProfessionalLevelBadge } from "@/components/professionals/ProfessionalLevelBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatOptional } from "@/lib/format";
import type { ClassifiedAd } from "@/types/database";
import type { ProfessionalProfileDetail } from "@/types/professionals-search";

interface ProfessionalDetailViewProps {
  profile: ProfessionalProfileDetail;
  publicListings: ClassifiedAd[];
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  bireysel: "Bireysel Kullanıcı",
  ofis: "Ofis",
  franchise: "Franchise",
  master_franchise: "Master Franchise",
};

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <span className="shrink-0 text-sm text-cream/50">{label}</span>
      <span className="text-right text-sm font-medium text-cream">{value}</span>
    </div>
  );
}

export function ProfessionalDetailView({
  profile,
  publicListings,
}: ProfessionalDetailViewProps) {
  const accountLabel = profile.account_type
    ? (ACCOUNT_TYPE_LABELS[profile.account_type] ?? profile.account_type)
    : "Belirtilmemiş";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6">
        <Link
          href="/profesyoneller"
          className="text-sm text-cream/50 transition-colors hover:text-cream"
        >
          ← Profesyoneller Dizini
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6">
          <Card className="border-cream/10 bg-charcoal-light p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <ProfessionalAvatar
                name={profile.display_name}
                avatarUrl={profile.avatar_url}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Doğrulanmış Profil
                </p>
                <h1 className="mt-2 text-3xl font-bold text-cream">
                  {profile.display_name}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <ProfessionalLevelBadge level={profile.professional_level} />
                  <span className="rounded-full border border-cream/15 bg-charcoal px-3 py-1 text-xs font-medium text-cream/70">
                    {accountLabel}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-cream/55">
                  {[profile.city_name, profile.district_name, profile.neighborhood_name]
                    .filter(Boolean)
                    .join(" · ") || "Konum bilgisi henüz eklenmemiş"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden border-cream/10 bg-charcoal-light">
            <div className="border-b border-cream/10 px-5 py-4">
              <h2 className="text-lg font-semibold text-cream">
                Aktif Portföy
              </h2>
              <p className="mt-1 text-sm text-cream/45">
                Genele açık onaylı ilanlar
              </p>
            </div>

            {publicListings.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-cream/45">
                Bu profesyonelin şu anda genele açık ilanı bulunmuyor.
              </div>
            ) : (
              <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
                {publicListings.map((listing) => (
                  <AdCard key={listing.id} ad={listing} linkToDetail />
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden border-cream/10 bg-charcoal-light">
            <div className="border-b border-cream/10 px-5 py-4">
              <h2 className="text-lg font-semibold text-cream">
                Portföy Özeti
              </h2>
            </div>
            <div className="divide-y divide-cream/10">
              <SpecRow
                label="Toplam İlan"
                value={String(profile.total_listings)}
              />
              <SpecRow
                label="Sistem İçi"
                value={String(profile.system_listings)}
              />
              <SpecRow
                label="Genele Açık"
                value={String(profile.public_listings)}
              />
            </div>
          </Card>

          <Card className="overflow-hidden border-cream/10 bg-charcoal-light">
            <div className="border-b border-cream/10 px-5 py-4">
              <h2 className="text-lg font-semibold text-cream">
                İletişim Kanalları
              </h2>
            </div>
            <div className="divide-y divide-cream/10">
              <SpecRow label="E-posta" value={profile.email} />
              <SpecRow
                label="Telefon"
                value={formatOptional(profile.phone)}
              />
              <SpecRow
                label="TTBS No"
                value={formatOptional(profile.ttbs_no)}
              />
            </div>
            <div className="border-t border-cream/10 p-5">
              <a href={`mailto:${profile.email}`}>
                <Button className="w-full">Profesyonelle İletişime Geç</Button>
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
