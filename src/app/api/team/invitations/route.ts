import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { getSessionProfile } from "@/lib/supabase/auth-server";
import { requireOfficeAdmin } from "@/lib/supabase/team-server";
import {
  TEAM_INVITATION_INBOX_SELECT,
  TEAM_INVITATION_SENT_SELECT,
  TEAM_INVITATIONS_TABLE,
} from "@/lib/supabase/team-invitations-table";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");

  if (scope === "sent") {
    const auth = await requireOfficeAdmin();

    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from(TEAM_INVITATIONS_TABLE)
        .select(TEAM_INVITATION_SENT_SELECT)
        .eq("broker_id", auth.brokerId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ invitations: data ?? [] });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Davetler alınamadı.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const { user, profile } = await getSessionProfile();

  if (!user || !profile) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const email = (user.email ?? profile.email).toLowerCase();

    const { data: invitations, error } = await admin
      .from(TEAM_INVITATIONS_TABLE)
      .select(TEAM_INVITATION_INBOX_SELECT)
      .eq("invitee_email", email)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const brokerIds = [
      ...new Set((invitations ?? []).map((item) => item.broker_id as string)),
    ];

    let brokerMap = new Map<
      string,
      { full_name: string | null; company_name: string | null }
    >();

    if (brokerIds.length > 0) {
      const { data: brokers } = await admin
        .from("profiles")
        .select("id, full_name, company_name")
        .in("id", brokerIds);

      brokerMap = new Map(
        (brokers ?? []).map((broker) => [
          broker.id as string,
          {
            full_name: broker.full_name as string | null,
            company_name: broker.company_name as string | null,
          },
        ])
      );
    }

    const enriched = (invitations ?? []).map((invitation) => ({
      ...invitation,
      broker: brokerMap.get(invitation.broker_id as string) ?? null,
    }));

    return NextResponse.json({ invitations: enriched });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Davetler alınamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
