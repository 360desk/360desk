import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { processHybridTeamInvite } from "@/lib/supabase/team-invite-engine";
import { requireCorporateTeamBroker } from "@/lib/supabase/team-server";
import type { TeamInvitationType } from "@/lib/supabase/team-invitations-table";
import type { TeamInviteRole } from "@/types/office-hierarchy";

interface SpawnStaffBody {
  email?: string;
  password?: string;
  full_name?: string;
  phone?: string;
  invite_type?: TeamInvitationType;
  target_role?: TeamInviteRole;
  invite_role?: TeamInviteRole;
}

function resolveInviteRoleFromBody(body: SpawnStaffBody): TeamInviteRole | undefined {
  if (body.target_role === "broker_owner" || body.target_role === "office_agent") {
    return body.target_role;
  }

  if (body.invite_type === "office") {
    return "broker_owner";
  }

  if (body.invite_type === "agent") {
    return "office_agent";
  }

  return body.invite_role;
}

/** @deprecated Prefer POST /api/team/invite — kept for backward compatibility. */
export async function POST(request: Request) {
  const auth = await requireCorporateTeamBroker();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: SpawnStaffBody;

  try {
    body = (await request.json()) as SpawnStaffBody;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const fullName = body.full_name?.trim();

  if (!email || !fullName) {
    return NextResponse.json(
      { error: "Ad soyad ve e-posta zorunludur." },
      { status: 400 }
    );
  }

  if (body.password && body.password.trim().length < 8) {
    return NextResponse.json(
      { error: "Şifre en az 8 karakter olmalıdır." },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();
    const result = await processHybridTeamInvite({
      admin,
      brokerId: auth.brokerId,
      profile: auth.profile,
      email,
      fullName,
      phone: body.phone?.trim() || null,
      inviteRole: resolveInviteRoleFromBody(body),
      password: body.password,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ekip üyesi oluşturulamadı.";
    const status = message.includes("kotanız") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
