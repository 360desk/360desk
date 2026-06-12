import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { revokeOfficeInvitation } from "@/lib/supabase/team-invitation-actions";
import { requireOfficeAdmin } from "@/lib/supabase/team-server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireOfficeAdmin();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Davet kimliği gerekli." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const result = await revokeOfficeInvitation(admin, id, auth.brokerId);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Davet iptal edilemedi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
