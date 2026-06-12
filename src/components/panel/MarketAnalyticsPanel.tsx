"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import type { MarketTrendsResponse } from "@/types/market-analytics";

const CHART_CREAM = "#ffeede";
const CHART_SILVER = "#b8b5b0";
const CHART_CRIMSON = "#ee254b";

function formatChartDate(date: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

function formatCount(value: number) {
  return new Intl.NumberFormat("tr-TR").format(value);
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number; dataKey?: string }>;
  label?: string;
}

function TrendTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-cream/15 bg-charcoal px-3 py-2 shadow-xl">
      <p className="text-xs text-cream/50">{label}</p>
      <p className="text-sm font-semibold text-cream">
        {formatCount(Number(payload[0]?.value ?? 0))}
      </p>
    </div>
  );
}

export function MarketAnalyticsPanel() {
  const [data, setData] = useState<MarketTrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/analytics/market-trends?district=Nilüfer"
      );
      const payload = (await response.json()) as
        | MarketTrendsResponse
        | { error?: string };

      if (!response.ok) {
        setError(
          "error" in payload && payload.error
            ? payload.error
            : "Piyasa verileri alınamadı."
        );
        setData(null);
        return;
      }

      setData(payload as MarketTrendsResponse);
    } catch {
      setError("Piyasa verileri yüklenirken bir hata oluştu.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTrends();
  }, [fetchTrends]);

  const chartData = useMemo(
    () =>
      (data?.history ?? []).map((point) => ({
        ...point,
        label: formatChartDate(point.recorded_date),
      })),
    [data?.history]
  );

  if (loading) {
    return (
      <Card className="py-16 text-center border-cream/10 bg-charcoal-light">
        <p className="text-cream/40">Piyasa analitiği yükleniyor...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="py-12 text-center border-red-500/20 bg-charcoal-light">
        <p className="text-red-300 text-sm">{error}</p>
      </Card>
    );
  }

  if (!data || data.isEmpty || chartData.length === 0) {
    return (
      <Card className="border-cream/10 bg-charcoal-light py-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Pazar Analitiği
        </p>
        <p className="mt-4 max-w-md mx-auto text-cream/60 leading-relaxed">
          Nilüfer bölgesi için bu haftanın veri taraması bekleniyor...
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-cream/10 bg-charcoal-light p-0 overflow-hidden">
        <div className="border-b border-cream/10 px-5 py-5 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Kurumsal Pazar İstihbaratı
          </p>
          <h2 className="mt-1 text-xl font-bold text-cream sm:text-2xl">
            Bursa Emlak Pazarı Haftalık Değişim Raporu
          </h2>
          <p className="mt-2 text-sm text-cream/50">
            {data.district} bölgesi · {data.count} haftalık kayıt
          </p>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-cream/10 bg-charcoal-light p-0 overflow-hidden">
          <div className="border-b border-cream/10 px-5 py-4">
            <h3 className="text-sm font-semibold text-cream">
              Toplam Canlı Arz Trendi
            </h3>
            <p className="text-xs text-cream/40 mt-1">
              Haftalık aktif ilan envanteri
            </p>
          </div>
          <div className="h-72 px-2 py-4 sm:px-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid
                  stroke="rgba(255,238,222,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: CHART_SILVER, fontSize: 11 }}
                  axisLine={{ stroke: "rgba(255,238,222,0.12)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: CHART_SILVER, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip content={<TrendTooltip />} />
                <Line
                  type="monotone"
                  dataKey="total_listings_count"
                  stroke={CHART_CREAM}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: CHART_CREAM,
                    stroke: CHART_SILVER,
                    strokeWidth: 1,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-cream/10 bg-charcoal-light p-0 overflow-hidden">
          <div className="border-b border-cream/10 px-5 py-4">
            <h3 className="text-sm font-semibold text-cream">
              Haftalık Yeni Giriş Kaldıracı
            </h3>
            <p className="text-xs text-cream/40 mt-1">
              Pazara yeni eklenen ilan hızı
            </p>
          </div>
          <div className="h-72 px-2 py-4 sm:px-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="newListingsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_CRIMSON} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={CHART_CRIMSON} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="rgba(255,238,222,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: CHART_SILVER, fontSize: 11 }}
                  axisLine={{ stroke: "rgba(255,238,222,0.12)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: CHART_SILVER, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip content={<TrendTooltip />} />
                <Area
                  type="monotone"
                  dataKey="new_listings_count"
                  stroke={CHART_CRIMSON}
                  strokeWidth={2}
                  fill="url(#newListingsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
