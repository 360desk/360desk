import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import {
  getLocationSeedCounts,
  seedTurkeyLocations,
} from "@/lib/supabase/location-seed";

function resolveSeedSecret(): string | null {
  return (
    process.env.LOCATION_SEED_SECRET ??
    process.env.CRON_SECRET ??
    process.env.ANALYTICS_CRON_SECRET ??
    null
  );
}

function isAuthorized(request: NextRequest): boolean {
  const secret = resolveSeedSecret();

  if (!secret) {
    return process.env.NODE_ENV === "development";
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) {
    return true;
  }

  const { searchParams } = new URL(request.url);
  return searchParams.get("token") === secret;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Yetkisiz konum seed isteği." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "1";
  const includeNeighborhoods = searchParams.get("neighborhoods") !== "0";
  const statusOnly = searchParams.get("status") === "1";

  try {
    const admin = createAdminClient();

    if (statusOnly) {
      const counts = await getLocationSeedCounts(admin);
      return NextResponse.json({
        counts,
        ready:
          counts.cities >= 81 &&
          counts.districts >= 973 &&
          counts.neighborhoods >= 31900,
      });
    }

    const result = await seedTurkeyLocations(admin, {
      force,
      includeNeighborhoods,
    });

    const counts = await getLocationSeedCounts(admin);

    return NextResponse.json({
      ...result,
      counts,
      message: result.already_seeded
        ? "Konum verileri zaten yüklü."
        : "Türkiye konum ağacı başarıyla yüklendi.",
    });
  } catch (error) {
    console.error(
      "location/seed:",
      error instanceof Error ? error.message : "Beklenmeyen hata"
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Konum verileri yüklenirken bir hata oluştu.",
      },
      { status: 500 }
    );
  }
}
