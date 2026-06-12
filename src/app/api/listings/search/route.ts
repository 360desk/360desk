import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  parseListingsSearchParams,
  searchPublicListings,
} from "@/lib/supabase/listings-search";
import type { ListingsSearchResponse } from "@/types/listings-search";

function buildEmptyResponse(
  filters: ReturnType<typeof parseListingsSearchParams>
): ListingsSearchResponse {
  return {
    results: [],
    total_count: 0,
    filters,
  };
}

function parsePagination(searchParams: URLSearchParams) {
  const limit = Number.parseInt(searchParams.get("limit") ?? "50", 10);
  const offset = Number.parseInt(searchParams.get("offset") ?? "0", 10);

  return {
    limit: Number.isFinite(limit) ? limit : 50,
    offset: Number.isFinite(offset) ? offset : 0,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filters = parseListingsSearchParams(searchParams);
  const pagination = parsePagination(searchParams);

  try {
    const supabase = await createClient();
    const { data, error } = await searchPublicListings(
      supabase,
      filters,
      pagination
    );

    if (error) {
      console.error("listings/search:", error);
      return NextResponse.json(
        { error: "İlan araması sırasında bir hata oluştu." },
        { status: 500 }
      );
    }

    if (!data || data.total_count === 0) {
      return NextResponse.json(buildEmptyResponse(filters));
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      "listings/search:",
      error instanceof Error ? error.message : "Beklenmeyen hata"
    );

    return NextResponse.json(
      { error: "İlan araması işlenirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
