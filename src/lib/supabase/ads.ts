import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureVendorProfile } from "@/lib/supabase/profile";

export interface ClassifiedAdInsertPayload {
  title: string;
  description: string | null;
  price: number;
  category: string;
  location: string | null;
  contact_phone: string | null;
  images: string[];
}

export async function resolveAuthenticatedUserId(
  supabase: SupabaseClient,
  fallbackUserId?: string
): Promise<{ userId: string | null; error: string | null }> {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) {
    return { userId: null, error: sessionError.message };
  }

  const sessionUserId = sessionData.session?.user?.id;
  if (sessionUserId) {
    return { userId: sessionUserId, error: null };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { userId: null, error: userError.message };
  }

  if (user?.id) {
    return { userId: user.id, error: null };
  }

  if (fallbackUserId) {
    return { userId: fallbackUserId, error: null };
  }

  return { userId: null, error: "Oturum bulunamadı. Lütfen tekrar giriş yapın." };
}

export async function insertClassifiedAd(
  supabase: SupabaseClient,
  data: ClassifiedAdInsertPayload,
  fallbackUserId?: string
): Promise<{ error: string | null }> {
  const { userId, error: authError } = await resolveAuthenticatedUserId(
    supabase,
    fallbackUserId
  );

  if (authError || !userId) {
    return { error: authError ?? "Kullanıcı kimliği alınamadı." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const profileError = await ensureVendorProfile(supabase, user);
    if (profileError) {
      return { error: `Profil hatası: ${profileError}` };
    }
  }

  const insertPayload = {
    vendor_id: userId,
    title: data.title,
    description: data.description,
    price: data.price,
    category: data.category,
    location: data.location,
    contact_phone: data.contact_phone,
    images: data.images,
    status: "pending" as const,
  };

  const { error: insertError } = await supabase
    .from("classified_ads")
    .insert(insertPayload);

  if (insertError) {
    return { error: insertError.message };
  }

  return { error: null };
}
