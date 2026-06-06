import type { SupabaseClient, User } from "@supabase/supabase-js";

export async function ensureVendorProfile(
  supabase: SupabaseClient,
  user: User
): Promise<string | null> {
  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    return selectError.message;
  }

  if (existing) {
    return null;
  }

  const { error: insertError } = await supabase.from("profiles").insert({
    id: user.id,
    email: user.email ?? "",
    full_name: (user.user_metadata?.full_name as string) ?? "",
    role: "vendor",
  });

  return insertError?.message ?? null;
}
