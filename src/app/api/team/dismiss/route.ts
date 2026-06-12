import { NextResponse } from "next/server";
import {
  dismissOfficeStaff,
  requireOfficeAdmin,
} from "@/lib/supabase/team-server";

interface DismissStaffBody {
  staff_id?: string;
  transfer_to_id?: string;
}

export async function POST(request: Request) {
  const auth = await requireOfficeAdmin();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: DismissStaffBody;

  try {
    body = (await request.json()) as DismissStaffBody;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const staffId = body.staff_id?.trim();
  const transferToId = body.transfer_to_id?.trim();

  if (!staffId || !transferToId) {
    return NextResponse.json(
      { error: "Danışman ve devralma hedefi zorunludur." },
      { status: 400 }
    );
  }

  if (staffId === transferToId) {
    return NextResponse.json(
      { error: "İlanlar aynı danışmana devredilemez." },
      { status: 400 }
    );
  }

  try {
    const result = await dismissOfficeStaff(
      auth.brokerId,
      staffId,
      transferToId
    );

    return NextResponse.json({ result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Danışman ofisten çıkarılamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
