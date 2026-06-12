import { notFound, redirect } from "next/navigation";
import { ListingEditClient } from "@/components/panel/ListingEditClient";
import { getSessionProfile } from "@/lib/supabase/auth-server";
import { fetchOwnedAdForEdit } from "@/lib/supabase/ads-server";

interface ListingEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function ListingEditPage({ params }: ListingEditPageProps) {
  const { id } = await params;
  const { user, profile } = await getSessionProfile();

  if (!user) {
    redirect(`/giris?next=/panel/ilanlar/${id}/edit`);
  }

  const ad = await fetchOwnedAdForEdit(id, user.id, profile);

  if (!ad) {
    notFound();
  }

  return <ListingEditClient ad={ad} vendorId={user.id} />;
}
