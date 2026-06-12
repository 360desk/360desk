import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type {
  MarketAnalyticsRow,
  MarketTrendPoint,
  MarketTrendsResponse,
} from "@/types/market-analytics";

const DEFAULT_DISTRICT = "Nilüfer";

function parseQueryParams(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const district = searchParams.get("district")?.trim() || DEFAULT_DISTRICT;
  const propertyType = searchParams.get("property_type")?.trim() || null;

  return { district, propertyType };
}

function mapTrendPoint(row: MarketAnalyticsRow): MarketTrendPoint {
  return {
    recorded_date: row.recorded_date,
    total_listings_count: Number(row.total_listings_count),
    new_listings_count: Number(row.new_listings_count),
  };
}

function buildEmptyResponse(
  district: string,
  propertyType: string | null
): MarketTrendsResponse {
  return {
    district,
    property_type: propertyType,
    history: [],
    count: 0,
    isEmpty: true,
  };
}

export async function GET(request: NextRequest) {
  const { district, propertyType } = parseQueryParams(request);

  try {
    const supabase = await createClient();

    let query = supabase
      .from("market_analytics")
      .select(
        "id, district, property_type, recorded_date, total_listings_count, new_listings_count"
      )
      .eq("district", district)
      .order("recorded_date", { ascending: true });

    if (propertyType) {
      query = query.eq("property_type", propertyType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("market-trends:", error.message);
      return NextResponse.json(
        { error: "Piyasa trend verileri alınamadı." },
        { status: 500 }
      );
    }

    const rows = (data ?? []) as MarketAnalyticsRow[];

    if (rows.length === 0) {
      return NextResponse.json(buildEmptyResponse(district, propertyType));
    }

    const history = rows.map(mapTrendPoint);

    const payload: MarketTrendsResponse = {
      district,
      property_type: propertyType,
      history,
      count: history.length,
      isEmpty: false,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error(
      "market-trends:",
      error instanceof Error ? error.message : "Beklenmeyen hata"
    );

    return NextResponse.json(
      { error: "Piyasa trend verileri işlenirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
