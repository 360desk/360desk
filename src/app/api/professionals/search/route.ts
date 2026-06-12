import { NextResponse, type NextRequest } from "next/server";
import {
  parseProfessionalsSearchParams,
  searchProfessionals,
} from "@/lib/supabase/professionals-search";
import type { ProfessionalsSearchResponse } from "@/types/professionals-search";

function buildEmptyResponse(
  filters: ReturnType<typeof parseProfessionalsSearchParams>
): ProfessionalsSearchResponse {
  return {
    results: [],
    total_count: 0,
    filters,
  };
}

function parsePagination(searchParams: URLSearchParams) {
  const limit = Number.parseInt(searchParams.get("limit") ?? "100", 10);
  const offset = Number.parseInt(searchParams.get("offset") ?? "0", 10);

  return {
    limit: Number.isFinite(limit) ? Math.min(limit, 200) : 100,
    offset: Number.isFinite(offset) ? offset : 0,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filters = parseProfessionalsSearchParams(searchParams);
  const pagination = parsePagination(searchParams);

  try {
    const { data, error } = await searchProfessionals(filters, pagination);

    if (error) {
      console.error("professionals/search:", error);
      return NextResponse.json(
        { error: "Profesyonel araması sırasında bir hata oluştu." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(buildEmptyResponse(filters));
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      "professionals/search:",
      error instanceof Error ? error.message : "Beklenmeyen hata"
    );

    return NextResponse.json(
      { error: "Profesyonel araması işlenirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
