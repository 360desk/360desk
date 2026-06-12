import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfessionalDetailView } from "@/components/professionals/ProfessionalDetailView";
import { fetchProfessionalById } from "@/lib/supabase/professionals-detail";
import { fetchProfessionalPublicListings } from "@/lib/supabase/professionals-search";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { data: profile } = await fetchProfessionalById(id);

  if (!profile) {
    return { title: "Profesyonel Bulunamadı — 360desk" };
  }

  return {
    title: `${profile.display_name} — 360desk Profesyoneller`,
    description: `${profile.display_name} doğrulanmış emlak profesyoneli profili ve aktif portföyü.`,
  };
}

export default async function ProfessionalDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [{ data: profile, error }, { data: publicListings }] = await Promise.all([
    fetchProfessionalById(id),
    fetchProfessionalPublicListings(id),
  ]);

  if (error) {
    throw new Error(error);
  }

  if (!profile) {
    notFound();
  }

  return (
    <ProfessionalDetailView
      profile={profile}
      publicListings={publicListings}
    />
  );
}
