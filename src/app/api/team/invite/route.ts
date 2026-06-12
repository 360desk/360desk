import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import {
  processSegmentedTeamInvite,
  type TeamInviteFlow,
} from "@/lib/supabase/team-invite-engine";
import {
  revokeTeamInvite,
  type RevokeTeamInviteParams,
} from "@/lib/supabase/team-invitation-actions";
import { requireCorporateTeamBroker } from "@/lib/supabase/team-server";

interface SegmentedInviteBody {
  email?: string;
  full_name?: string;
  phone?: string;
  invite_flow?: TeamInviteFlow;
}

interface RevokeInviteBody {
  invitation_id?: string;
  id?: string;
  member_id?: string;
  email?: string;
}

const VALID_FLOWS: TeamInviteFlow[] = [
  "external_agent",
  "internal_agent",
  "office_branch",
];

function parseInviteFlow(value: string | undefined): TeamInviteFlow | null {
  if (!value) {
    return null;
  }

  return VALID_FLOWS.includes(value as TeamInviteFlow)
    ? (value as TeamInviteFlow)
    : null;
}

function parseRevokeInviteParams(
  request: Request,
  body: RevokeInviteBody
): RevokeTeamInviteParams {
  const url = new URL(request.url);

  const invitationId =
    url.searchParams.get("id")?.trim() ||
    url.searchParams.get("invitation_id")?.trim() ||
    body.invitation_id?.trim() ||
    body.id?.trim();

  const memberId =
    url.searchParams.get("member_id")?.trim() || body.member_id?.trim();

  const email =
    url.searchParams.get("email")?.trim().toLowerCase() ||
    body.email?.trim().toLowerCase();

  return {
    invitationId: invitationId || undefined,
    memberId: memberId || undefined,
    email: email || undefined,
  };
}

export async function POST(request: Request) {
  const auth = await requireCorporateTeamBroker();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: SegmentedInviteBody;

  try {
    body = (await request.json()) as SegmentedInviteBody;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const fullName = body.full_name?.trim();
  const phone = body.phone?.trim() || null;
  const inviteFlow = parseInviteFlow(body.invite_flow);

  if (!inviteFlow) {
    return NextResponse.json(
      { error: "Geçerli davet akışı belirtilmelidir (invite_flow)." },
      { status: 400 }
    );
  }

  if (inviteFlow === "internal_agent") {
    if (!email && !phone) {
      return NextResponse.json(
        { error: "Kayıtlı danışman için e-posta veya telefon zorunludur." },
        { status: 400 }
      );
    }
  } else if (!email) {
    return NextResponse.json({ error: "E-posta zorunludur." }, { status: 400 });
  }

  if (inviteFlow !== "internal_agent" && !fullName) {
    return NextResponse.json(
      { error: "Ad soyad zorunludur." },
      { status: 400 }
    );
  }

  if (email && email === auth.email?.toLowerCase()) {
    return NextResponse.json(
      { error: "Kendi hesabınıza davet gönderemezsiniz." },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();
    const result = await processSegmentedTeamInvite({
      admin,
      brokerId: auth.brokerId,
      profile: auth.profile,
      flow: inviteFlow,
      email,
      fullName: fullName ?? email ?? phone ?? "Davetli",
      phone,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Davet işlemi tamamlanamadı.";
    const status = message.includes("kotanız") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireCorporateTeamBroker();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: RevokeInviteBody = {};

  try {
    const rawBody = await request.text();
    if (rawBody.trim()) {
      body = JSON.parse(rawBody) as RevokeInviteBody;
    }
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const params = parseRevokeInviteParams(request, body);

  if (!params.invitationId && !params.memberId && !params.email) {
    return NextResponse.json(
      {
        error:
          "Davet kimliği (id), üye kimliği (member_id) veya e-posta (email) zorunludur.",
      },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();
    const result = await revokeTeamInvite(admin, auth.brokerId, params);

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Davet iptal edilemedi.";
    const status = message.includes("bulunamadı") ? 404 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
