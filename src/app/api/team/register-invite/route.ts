import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import {
  resolveInvitationTargetRole,
} from "@/lib/supabase/team-invite-accept";
import { REVOKED_INVITE_ERROR } from "@/lib/onboarding-lock";
import {
  TEAM_INVITATION_SELECT,
  TEAM_INVITATIONS_TABLE,
  type TeamInvitationRecord,
} from "@/lib/supabase/team-invitations-table";

interface RegisterInviteBody {
  token?: string;
  invite_token?: string;
  invite?: string;
  email?: string;
  password?: string;
  full_name?: string;
}

function resolveInviteToken(body: RegisterInviteBody): string | null {
  const token =
    body.token?.trim() ||
    body.invite_token?.trim() ||
    body.invite?.trim() ||
    null;

  return token || null;
}

async function resolveRegistrationInvitation(
  admin: ReturnType<typeof createAdminClient>,
  token: string
): Promise<
  | { ok: true; invitation: TeamInvitationRecord }
  | { ok: false; error: string; status: number }
> {
  const { data, error } = await admin
    .from(TEAM_INVITATIONS_TABLE)
    .select(TEAM_INVITATION_SELECT)
    .eq("id", token)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.status !== "pending") {
    return {
      ok: false,
      error: REVOKED_INVITE_ERROR,
      status: 410,
    };
  }

  return {
    ok: true,
    invitation: data as TeamInvitationRecord,
  };
}

function buildInvitedProfilePayload(input: {
  userId: string;
  email: string;
  fullName: string;
  phone: string | null;
}) {
  return {
    id: input.userId,
    email: input.email,
    full_name: input.fullName,
    phone: input.phone,
    role: "vendor",
    user_type: "individual",
    account_origin: "self",
    is_profile_completed: false,
    contract_accepted: false,
    contract_accepted_at: null,
    updated_at: new Date().toISOString(),
  };
}

async function upsertInvitedProfile(
  admin: ReturnType<typeof createAdminClient>,
  profilePayload: ReturnType<typeof buildInvitedProfilePayload>
): Promise<void> {
  let { error: profileError } = await admin
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" });

  if (
    profileError &&
    (profileError.message.includes("contract_accepted") ||
      profileError.message.includes("phone"))
  ) {
    const {
      contract_accepted: _contract,
      contract_accepted_at: _contractAt,
      phone: _phone,
      ...legacyPayload
    } = profilePayload;

    const retry = await admin
      .from("profiles")
      .upsert(legacyPayload, { onConflict: "id" });

    profileError = retry.error;
  }

  if (profileError) {
    throw new Error(profileError.message);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token =
    searchParams.get("token")?.trim() ||
    searchParams.get("invite_token")?.trim() ||
    searchParams.get("invite")?.trim() ||
    "";
  const email = searchParams.get("email")?.trim().toLowerCase() ?? "";

  if (!token || !email) {
    return NextResponse.json(
      { error: "Davet kodu ve e-posta gerekli." },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();
    const inviteResolution = await resolveRegistrationInvitation(admin, token);

    if (!inviteResolution.ok) {
      return NextResponse.json(
        { error: inviteResolution.error },
        { status: inviteResolution.status }
      );
    }

    const invitation = inviteResolution.invitation;

    if (invitation.invitee_email.toLowerCase() !== email) {
      return NextResponse.json(
        { error: "Davet e-postası eşleşmiyor." },
        { status: 403 }
      );
    }

    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    return NextResponse.json({
      valid: true,
      invitee_email: invitation.invitee_email,
      target_role: resolveInvitationTargetRole(invitation),
      invite_type: invitation.invite_type,
      account_exists: Boolean(existingProfile),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Davet doğrulanamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: RegisterInviteBody;

  try {
    body = (await request.json()) as RegisterInviteBody;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const token = resolveInviteToken(body);
  const email = body.email?.trim().toLowerCase();
  const password = body.password?.trim();
  const fullName = body.full_name?.trim();

  if (!token || !email || !password || !fullName) {
    return NextResponse.json(
      { error: "Davet kodu, ad soyad, e-posta ve şifre zorunludur." },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Şifre en az 6 karakter olmalıdır." },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();
    const inviteResolution = await resolveRegistrationInvitation(admin, token);

    if (!inviteResolution.ok) {
      return NextResponse.json(
        { error: inviteResolution.error },
        { status: inviteResolution.status }
      );
    }

    const invitation = inviteResolution.invitation;

    if (invitation.invitee_email.toLowerCase() !== email) {
      return NextResponse.json(
        { error: "Bu davet belirtilen e-posta adresi için oluşturulmamış." },
        { status: 403 }
      );
    }

    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        {
          error:
            "Bu e-posta zaten kayıtlı. Lütfen giriş yapın ve daveti panelinizden kabul edin.",
          redirect_to_login: true,
        },
        { status: 409 }
      );
    }

    const { data: createdUser, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      });

    if (createError || !createdUser.user) {
      const normalized = createError?.message.toLowerCase() ?? "";
      if (
        normalized.includes("already registered") ||
        normalized.includes("already been registered")
      ) {
        return NextResponse.json(
          {
            error:
              "Bu e-posta zaten kayıtlı. Lütfen giriş yapın ve daveti panelinizden kabul edin.",
            redirect_to_login: true,
          },
          { status: 409 }
        );
      }

      throw new Error(createError?.message ?? "Kullanıcı oluşturulamadı.");
    }

    const userId = createdUser.user.id;
    const profilePayload = buildInvitedProfilePayload({
      userId,
      email,
      fullName,
      phone: invitation.invitee_phone,
    });

    try {
      await upsertInvitedProfile(admin, profilePayload);
    } catch (profileError) {
      await admin.auth.admin.deleteUser(userId);
      throw profileError;
    }

    await admin
      .from(TEAM_INVITATIONS_TABLE)
      .update({ status: "accepted" })
      .eq("id", invitation.id);

    const inviteRole = resolveInvitationTargetRole(invitation);

    return NextResponse.json({
      success: true,
      user_id: userId,
      email,
      broker_id: invitation.broker_id,
      target_role: inviteRole,
      contract_pending: true,
      redirect_to: "/panelim",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Kayıt tamamlanamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
