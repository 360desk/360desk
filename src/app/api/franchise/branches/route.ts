import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { fetchFranchiseNetworkSnapshot } from "@/lib/franchise-network";
import { inferOfficeUserRole } from "@/lib/office-hierarchy";
import { requireCorporateTeamBroker } from "@/lib/supabase/team-server";

export async function GET() {
  const auth = await requireCorporateTeamBroker();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const leaderRole = inferOfficeUserRole(auth.profile);

  if (leaderRole !== "franchise_master") {
    return NextResponse.json(
      { error: "Bu uç nokta yalnızca franchise master hesapları içindir." },
      { status: 403 }
    );
  }

  try {
    const admin = createAdminClient();
    const network = await fetchFranchiseNetworkSnapshot(admin, auth.brokerId);
    return NextResponse.json(network);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Franchise ağı bilgisi alınamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
