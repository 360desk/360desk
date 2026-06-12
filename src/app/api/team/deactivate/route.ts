import { NextResponse } from "next/server";
import {
  deactivateOfficeAgent,
  requireCorporateTeamBroker,
} from "@/lib/supabase/team-server";

interface DeactivateAgentBody {
  staff_id?: string;
}

export async function POST(request: Request) {
  const auth = await requireCorporateTeamBroker();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: DeactivateAgentBody;

  try {
    body = (await request.json()) as DeactivateAgentBody;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const staffId = body.staff_id?.trim();

  if (!staffId) {
    return NextResponse.json(
      { error: "Danışman kimliği zorunludur." },
      { status: 400 }
    );
  }

  try {
    const result = await deactivateOfficeAgent(auth.brokerId, staffId);
    return NextResponse.json({ result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Danışman pasife alınamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
