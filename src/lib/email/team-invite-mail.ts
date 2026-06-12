import type { SupabaseClient } from "@supabase/supabase-js";
import { buildTestOnboardingLink } from "@/lib/supabase/team-invitations-table";
import type { TeamInvitationRecord } from "@/lib/supabase/team-invitations-table";

function resolvePublicSiteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) {
    return configured;
  }

  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) {
    return `https://${vercelHost.replace(/^https?:\/\//, "")}`;
  }

  return "http://localhost:3000";
}

function buildAbsoluteOnboardingUrl(
  invitation: Pick<TeamInvitationRecord, "id" | "invitee_email">
): string {
  const path = buildTestOnboardingLink(invitation.id, invitation.invitee_email);
  return `${resolvePublicSiteOrigin()}${path}`;
}

function isExistingUserInviteError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("already registered") ||
    normalized.includes("already been registered") ||
    normalized.includes("user already registered") ||
    normalized.includes("email address is already")
  );
}

async function sendViaResend(
  email: string,
  absoluteLink: string
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return false;
  }

  const from =
    process.env.TEAM_INVITE_EMAIL_FROM?.trim() ??
    "360desk <onboarding@resend.dev>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "360desk — Ofis davetiniz",
      html: `
        <p>Merhaba,</p>
        <p>Ofis davetiniz yeniden gönderildi. Kayıt ve sözleşme onayını tamamlamak için aşağıdaki bağlantıyı kullanın:</p>
        <p><a href="${absoluteLink}">${absoluteLink}</a></p>
        <p>Bu bağlantı yalnızca sizin e-posta adresiniz (${email}) için geçerlidir.</p>
      `,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(
      payload?.message ?? `Resend API hatası (HTTP ${response.status}).`
    );
  }

  return true;
}

export async function sendTeamInvitationEmail(
  admin: SupabaseClient,
  invitation: Pick<TeamInvitationRecord, "id" | "invitee_email">
): Promise<{
  email_sent: boolean;
  onboarding_link: string;
  transport: "supabase_auth" | "resend";
}> {
  const email = invitation.invitee_email.trim().toLowerCase();
  const absoluteLink = buildAbsoluteOnboardingUrl(invitation);
  const redirectTo = absoluteLink;

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
  });

  if (!inviteError) {
    return {
      email_sent: true,
      onboarding_link: buildTestOnboardingLink(invitation.id, email),
      transport: "supabase_auth",
    };
  }

  if (isExistingUserInviteError(inviteError.message)) {
    const sentViaResend = await sendViaResend(email, absoluteLink);
    if (sentViaResend) {
      return {
        email_sent: true,
        onboarding_link: buildTestOnboardingLink(invitation.id, email),
        transport: "resend",
      };
    }

    throw new Error(
      `Davet e-postası gönderilemedi: ${inviteError.message} (Mevcut kullanıcılar için RESEND_API_KEY tanımlayın.)`
    );
  }

  throw new Error(`Davet e-postası gönderilemedi: ${inviteError.message}`);
}
