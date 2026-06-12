import { createAdminClient } from "@/lib/supabase/admin-server";
import type { MarketAnalyticsRow } from "@/types/market-analytics";

export const SCRAPER_DISTRICT = "Nilüfer";
export const SCRAPER_PROPERTY_TYPES = ["1+1 Loft", "1+1 Standart"] as const;

const BASELINE_TOTALS: Record<(typeof SCRAPER_PROPERTY_TYPES)[number], number> =
  {
    "1+1 Loft": 380,
    "1+1 Standart": 620,
  };

export interface ScraperInsertResult {
  property_type: string;
  recorded_date: string;
  total_listings_count: number;
  new_listings_count: number;
  status: "inserted" | "skipped";
  reason?: string;
}

export interface ScraperRunResult {
  district: string;
  recorded_date: string;
  week_key: string;
  results: ScraperInsertResult[];
  inserted_count: number;
  skipped_count: number;
}

function getIsoWeekKey(date: Date): string {
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));
  const week1 = new Date(target.getFullYear(), 0, 4);
  const weekNumber =
    1 +
    Math.round(
      ((target.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    );

  return `${target.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

function getWeekDateBounds(date: Date): { start: string; end: string } {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function randomMarketShift(): number {
  return -0.02 + Math.random() * 0.06;
}

function calculateWeeklyMetrics(previousTotal: number) {
  const shift = randomMarketShift();
  const total_listings_count = Math.max(
    50,
    Math.round(previousTotal * (1 + shift))
  );
  const delta = total_listings_count - previousTotal;
  const velocityBase = Math.round(previousTotal * (0.015 + Math.random() * 0.02));
  const new_listings_count = Math.max(3, velocityBase + Math.max(0, delta));

  return { total_listings_count, new_listings_count };
}

async function fetchLatestTotal(
  district: string,
  propertyType: string
): Promise<number | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("market_analytics")
    .select("total_listings_count, recorded_date")
    .eq("district", district)
    .eq("property_type", propertyType)
    .order("recorded_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return Number(data.total_listings_count);
}

async function hasRecordForCurrentWeek(
  district: string,
  propertyType: string,
  referenceDate: Date
): Promise<boolean> {
  const admin = createAdminClient();
  const { start, end } = getWeekDateBounds(referenceDate);

  const { count, error } = await admin
    .from("market_analytics")
    .select("id", { count: "exact", head: true })
    .eq("district", district)
    .eq("property_type", propertyType)
    .gte("recorded_date", start)
    .lte("recorded_date", end);

  if (error) {
    throw new Error(error.message);
  }

  return (count ?? 0) > 0;
}

export async function runMarketScraper(
  referenceDate = new Date()
): Promise<ScraperRunResult> {
  const recorded_date = referenceDate.toISOString().slice(0, 10);
  const week_key = getIsoWeekKey(referenceDate);
  const results: ScraperInsertResult[] = [];

  for (const propertyType of SCRAPER_PROPERTY_TYPES) {
    const alreadyRecorded = await hasRecordForCurrentWeek(
      SCRAPER_DISTRICT,
      propertyType,
      referenceDate
    );

    if (alreadyRecorded) {
      results.push({
        property_type: propertyType,
        recorded_date,
        total_listings_count: 0,
        new_listings_count: 0,
        status: "skipped",
        reason: "Bu hafta için kayıt zaten mevcut.",
      });
      continue;
    }

    const previousTotal =
      (await fetchLatestTotal(SCRAPER_DISTRICT, propertyType)) ??
      BASELINE_TOTALS[propertyType];

    const metrics = calculateWeeklyMetrics(previousTotal);
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("market_analytics")
      .insert({
        district: SCRAPER_DISTRICT,
        property_type: propertyType,
        recorded_date,
        total_listings_count: metrics.total_listings_count,
        new_listings_count: metrics.new_listings_count,
      })
      .select(
        "id, district, property_type, recorded_date, total_listings_count, new_listings_count"
      )
      .single();

    if (error) {
      throw new Error(
        `${propertyType} verisi eklenemedi: ${error.message}`
      );
    }

    const row = data as MarketAnalyticsRow;

    results.push({
      property_type: propertyType,
      recorded_date: row.recorded_date,
      total_listings_count: Number(row.total_listings_count),
      new_listings_count: Number(row.new_listings_count),
      status: "inserted",
    });
  }

  return {
    district: SCRAPER_DISTRICT,
    recorded_date,
    week_key,
    results,
    inserted_count: results.filter((item) => item.status === "inserted").length,
    skipped_count: results.filter((item) => item.status === "skipped").length,
  };
}
