import { NextResponse } from "next/server";
import {
  fetchEnterpriseTeamTree,
  flattenEnterpriseTree,
  requireOfficeAdmin,
} from "@/lib/supabase/team-server";

export async function GET() {
  const auth = await requireOfficeAdmin();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const tree = await fetchEnterpriseTeamTree(
      auth.brokerId,
      auth.profile
    );
    const members = flattenEnterpriseTree(tree);

    return NextResponse.json({ tree, members });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ekip listesi alınamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
