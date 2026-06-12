import { NextResponse, type NextRequest } from "next/server";
import { parseLocationIdParam } from "@/lib/location-params";
import { resolveLocationTree } from "@/lib/supabase/location-server";
import type { LocationTreeResponse } from "@/types/location";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cityId = parseLocationIdParam(searchParams.get("city_id"));
  const districtId = parseLocationIdParam(searchParams.get("district_id"));

  try {
    const { level, items, error } = await resolveLocationTree(cityId, districtId);

    if (error) {
      console.error("location/tree:", error);
      return NextResponse.json(
        { error: "Konum verileri alınamadı." },
        { status: 500 }
      );
    }

    const payload: LocationTreeResponse = {
      level,
      items,
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error(
      "location/tree:",
      error instanceof Error ? error.message : "Beklenmeyen hata"
    );

    return NextResponse.json(
      { error: "Konum verileri işlenirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
