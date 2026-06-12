import { NextResponse } from "next/server";
import { fetchProfileQuotaSnapshot } from "@/lib/supabase/profile-quota";
import { fetchVendorProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Oturum bulunamadı." },
      { status: 401 }
    );
  }

  const { profile } = await fetchVendorProfile(supabase, user.id);
  const quota = await fetchProfileQuotaSnapshot(supabase, profile, user.id);

  return NextResponse.json({ quota });
}
