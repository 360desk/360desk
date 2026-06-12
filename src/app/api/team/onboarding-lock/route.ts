import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { getSessionProfile } from "@/lib/supabase/auth-server";
import { resolveOnboardingLockState } from "@/lib/onboarding-lock";

export async function GET() {
  const { user, profile } = await getSessionProfile();

  if (!user || !profile) {
    return NextResponse.json({ locked: false });
  }

  const email = (user.email ?? profile.email).toLowerCase();
  const admin = createAdminClient();
  const lockState = await resolveOnboardingLockState(admin, profile, email);

  return NextResponse.json({
    locked: lockState.locked,
    reason: lockState.reason,
  });
}
