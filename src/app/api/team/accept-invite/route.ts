import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { getSessionProfile } from "@/lib/supabase/auth-server";
import { resolveInvitationTargetRole } from "@/lib/supabase/team-invite-accept";
import {
  TEAM_INVITATION_SELECT,
  TEAM_INVITATIONS_TABLE,
  type TeamInvitationRecord,
} from "@/lib/supabase/team-invitations-table";

interface AcceptInviteBody {
  token?: string;
}

export async function POST(request: Request) {
  const { user, profile } = await getSessionProfile();

  if (!user || !profile) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  let body: AcceptInviteBody;

  try {
    body = (await request.json()) as AcceptInviteBody;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const invitationId = body.token?.trim();

  if (!invitationId) {
    return NextResponse.json({ error: "Davet kodu zorunludur." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();

    const { data: invitation, error: inviteError } = await admin
      .from(TEAM_INVITATIONS_TABLE)
      .select(TEAM_INVITATION_SELECT)
      .eq("id", invitationId)
      .maybeSingle();

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    const pendingInvite = invitation as TeamInvitationRecord | null;

    if (!pendingInvite || pendingInvite.status !== "pending") {
      return NextResponse.json(
        { error: "Geçersiz veya süresi dolmuş davet." },
        { status: 404 }
      );
    }

    const inviteeEmail = pendingInvite.invitee_email.toLowerCase();
    const userEmail = (user.email ?? profile.email).toLowerCase();

    if (inviteeEmail !== userEmail) {
      return NextResponse.json(
        { error: "Bu davet sizin hesabınız için oluşturulmamış." },
        { status: 403 }
      );
    }

    const inviteRole = resolveInvitationTargetRole(pendingInvite);

    if (inviteRole === "broker_owner") {
      if (profile.company_leader_id) {
        return NextResponse.json(
          { error: "Zaten bir franchise ağına bağlısınız." },
          { status: 409 }
        );
      }
    } else if (profile.parent_office_id || profile.company_leader_id) {
      return NextResponse.json(
        { error: "Zaten bir ofise bağlısınız." },
        { status: 409 }
      );
    }

    const { error: updateError } = await admin
      .from(TEAM_INVITATIONS_TABLE)
      .update({ status: "accepted" })
      .eq("id", pendingInvite.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      broker_id: pendingInvite.broker_id,
      invite_type: pendingInvite.invite_type,
      target_role: inviteRole,
      contract_pending: true,
      message:
        "Davet kabul edildi. Ekibe bağlanmak için sözleşmeyi onaylamanız gerekmektedir.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Davet kabul edilemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
