import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LuxuryListingDetail } from "@/components/ads/LuxuryListingDetail";
import { isCurrentUserAdmin } from "@/lib/supabase/auth-server";
import { fetchAdById } from "@/lib/supabase/ads-server";
import { formatCategoryFromAd } from "@/lib/categories";
import { formatCurrency } from "@/lib/format";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const ad = await fetchAdById(id);

  if (!ad) {
    return { title: "İlan Bulunamadı — 360desk" };
  }

  const tierLabel =
    ad.listing_tier === "luxury"
      ? "Luxury"
      : ad.listing_tier === "premium"
        ? "Premium"
        : "";

  const titlePrefix = tierLabel ? `${tierLabel} · ` : "";

  return {
    title: `${titlePrefix}${ad.title} — 360desk`,
    description:
      ad.premium_highlight ??
      ad.description ??
      `${formatCurrency(ad.price)} — ${formatCategoryFromAd(ad)}`,
  };
}

export default async function AdDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [ad, isAdmin] = await Promise.all([
    fetchAdById(id),
    isCurrentUserAdmin(),
  ]);

  if (!ad) {
    notFound();
  }

  return <LuxuryListingDetail ad={ad} isAdmin={isAdmin} />;
}
