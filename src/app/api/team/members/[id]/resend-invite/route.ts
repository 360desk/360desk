import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { resendPendingMemberInvite } from "@/lib/supabase/team-invitation-actions";
import { requireOfficeAdmin } from "@/lib/supabase/team-server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireOfficeAdmin();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Üye kimliği gerekli." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const result = await resendPendingMemberInvite(admin, id, auth.brokerId);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Davet yeniden gönderilemedi.";
    const status = message.includes("bulunamadı") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
