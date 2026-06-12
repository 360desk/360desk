import { NextResponse, type NextRequest } from "next/server";
import { runMarketScraper } from "@/lib/supabase/market-scraper";

function resolveCronSecret(): string | null {
  return (
    process.env.ANALYTICS_CRON_SECRET ??
    process.env.CRON_SECRET ??
    null
  );
}

function isAuthorized(request: NextRequest): boolean {
  const secret = resolveCronSecret();

  if (!secret) {
    return process.env.NODE_ENV === "development";
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) {
    return true;
  }

  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  return token === secret;
}

async function handleCron(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Yetkisiz cron isteği." },
      { status: 401 }
    );
  }

  try {
    const result = await runMarketScraper();

    if (result.inserted_count === 0) {
      return NextResponse.json({
        ok: true,
        message: "Bu hafta için tüm kayıtlar zaten mevcut.",
        ...result,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Haftalık piyasa verisi başarıyla üretildi.",
      ...result,
    });
  } catch (error) {
    console.error(
      "cron-scraper:",
      error instanceof Error ? error.message : "Beklenmeyen hata"
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Piyasa verisi üretilirken bir hata oluştu.",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}
