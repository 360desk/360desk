import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { getSessionProfile } from "@/lib/supabase/auth-server";
import {
  TEAM_INVITATION_SELECT,
  TEAM_INVITATIONS_TABLE,
} from "@/lib/supabase/team-invitations-table";

interface RejectInviteBody {
  token?: string;
}

export async function POST(request: Request) {
  const { user, profile } = await getSessionProfile();

  if (!user || !profile) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  let body: RejectInviteBody;

  try {
    body = (await request.json()) as RejectInviteBody;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const invitationId = body.token?.trim();

  if (!invitationId) {
    return NextResponse.json({ error: "Davet kodu zorunludur." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const userEmail = (user.email ?? profile.email).toLowerCase();

    const { data: invitation, error: inviteError } = await admin
      .from(TEAM_INVITATIONS_TABLE)
      .select(TEAM_INVITATION_SELECT)
      .eq("id", invitationId)
      .maybeSingle();

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    if (!invitation || invitation.status !== "pending") {
      return NextResponse.json(
        { error: "Geçersiz veya süresi dolmuş davet." },
        { status: 404 }
      );
    }

    if (invitation.invitee_email.toLowerCase() !== userEmail) {
      return NextResponse.json(
        { error: "Bu davet sizin hesabınız için oluşturulmamış." },
        { status: 403 }
      );
    }

    const { error: updateError } = await admin
      .from(TEAM_INVITATIONS_TABLE)
      .update({ status: "rejected" })
      .eq("id", invitation.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      invitation_id: invitation.id,
      status: "rejected",
      message: "Ofis daveti reddedildi. Mevcut ofis bağlantınız korunmuştur.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Davet reddedilemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
