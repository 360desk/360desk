import { NextResponse, type NextRequest } from "next/server";
import { upgradeProfileSubscription } from "@/lib/supabase/billing";
import { normalizeSubscriptionTier } from "@/lib/subscription-packages";
import { createClient } from "@/lib/supabase/server";
import type { SubscriptionTier } from "@/types/subscription-tier";

interface UpgradeRequestBody {
  tier: SubscriptionTier;
  contract_accepted: boolean;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Oturum bulunamadı. Lütfen tekrar giriş yapın." },
      { status: 401 }
    );
  }

  let body: UpgradeRequestBody;

  try {
    body = (await request.json()) as UpgradeRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Geçersiz istek gövdesi." },
      { status: 400 }
    );
  }

  const tier = normalizeSubscriptionTier(body.tier);

  const { error } = await upgradeProfileSubscription(supabase, {
    userId: user.id,
    tier,
    contractAccepted: Boolean(body.contract_accepted),
  });

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    tier,
    message: "Paketiniz başarıyla yükseltildi.",
  });
}
