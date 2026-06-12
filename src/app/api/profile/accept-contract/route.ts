import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { getSessionProfile } from "@/lib/supabase/auth-server";
import {
  acceptAgentOfficeInvitation,
  acceptFranchiseOfficeInvitation,
  resolveInvitationTargetRole,
} from "@/lib/supabase/team-invite-accept";
import { findAcceptedInvitationForEmail } from "@/lib/onboarding-lock";
import { requiresOnboardingContract } from "@/lib/onboarding-contract";
import { isMissingProfileColumnError } from "@/lib/supabase/profile-query";

export async function POST() {
  const { user, profile } = await getSessionProfile();

  if (!user || !profile) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const email = (user.email ?? profile.email).toLowerCase();
  const admin = createAdminClient();
  const acceptedInvite = await findAcceptedInvitationForEmail(admin, email);
  const shouldApplyInviteLink = requiresOnboardingContract(
    profile,
    Boolean(acceptedInvite)
  );

  if (!shouldApplyInviteLink) {
    return NextResponse.json({
      success: true,
      already_accepted: true,
    });
  }

  try {
    if (acceptedInvite) {
      const inviteRole = resolveInvitationTargetRole(acceptedInvite);

      if (inviteRole === "broker_owner") {
        await acceptFranchiseOfficeInvitation(admin, acceptedInvite, user.id);
      } else {
        await acceptAgentOfficeInvitation(admin, acceptedInvite, user.id);
      }
    }

    const acceptedAt = new Date().toISOString();
    const payload = {
      contract_accepted: true,
      contract_accepted_at: acceptedAt,
      updated_at: acceptedAt,
    };

    let { error } = await admin
      .from("profiles")
      .update(payload)
      .eq("id", user.id);

    if (error && isMissingProfileColumnError(error.message)) {
      const retry = await admin
        .from("profiles")
        .update({ updated_at: acceptedAt })
        .eq("id", user.id);
      error = retry.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      contract_accepted_at: acceptedAt,
      team_linked: Boolean(acceptedInvite),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Sözleşme onayı kaydedilemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
