import { NextResponse } from "next/server";
import {
  processListingTransfer,
  requireTransferActor,
} from "@/lib/supabase/listing-transfer";
import type { ListingTransferRequest } from "@/types/listing-transfer";

export async function POST(request: Request) {
  const auth = await requireTransferActor();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: ListingTransferRequest;

  try {
    body = (await request.json()) as ListingTransferRequest;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  if (!body.transfer_type) {
    return NextResponse.json(
      { error: "transfer_type alanı zorunludur." },
      { status: 400 }
    );
  }

  try {
    const result = await processListingTransfer(body, {
      userId: auth.userId,
      profile: auth.profile,
    });

    return NextResponse.json({ result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "İlan devri işlenemedi.";

    const status = message.includes("yalnızca ofis yöneticileri")
      ? 403
      : message.includes("Dışarıdan davet")
        ? 403
        : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
