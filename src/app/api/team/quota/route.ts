import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchTeamQuotaSnapshot } from "@/lib/supabase/team-quota";
import { requireCorporateTeamBroker } from "@/lib/supabase/team-server";
import type { TeamInviteRole } from "@/types/office-hierarchy";

function parseInviteRole(
  value: string | null
): TeamInviteRole | null {
  if (value === "broker_owner" || value === "office_agent") {
    return value;
  }

  return null;
}

export async function GET(request: Request) {
  const auth = await requireCorporateTeamBroker();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const inviteRole = parseInviteRole(searchParams.get("invite_role"));

  const supabase = await createClient();
  const quota = await fetchTeamQuotaSnapshot(
    supabase,
    auth.profile,
    auth.brokerId,
    inviteRole
  );

  return NextResponse.json({ quota });
}
