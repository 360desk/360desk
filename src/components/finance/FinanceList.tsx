"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { FinancialRecord, FinancialSummary } from "@/types/database";
import { FinanceSummary } from "@/components/finance/FinanceSummary";

interface FinanceListProps {
  vendorId: string;
}

export function FinanceList({ vendorId }: FinanceListProps) {
  const supabase = createClient();
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("financial_records")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("record_date", { ascending: false });

    const items = (data as FinancialRecord[]) ?? [];
    setRecords(items);

    const totalIncome = items
      .filter((r) => r.type === "income")
      .reduce((sum, r) => sum + Number(r.amount), 0);
    const totalExpense = items
      .filter((r) => r.type === "expense")
      .reduce((sum, r) => sum + Number(r.amount), 0);

    setSummary({
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
    });
    setLoading(false);
  }, [supabase, vendorId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("financial_records")
      .delete()
      .eq("id", id);

    if (!error) {
      fetchRecords();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-cream/40">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <FinanceSummary summary={summary} />

      {records.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-cream/40">Henüz finansal kayıt bulunmuyor.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {records.map((record) => (
            <Card
              key={record.id}
              className="flex items-center justify-between gap-4 !py-3"
            >
              <div className="flex items-center gap-4">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${
                    record.type === "income"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-red-500/15 text-red-400"
                  }`}
                >
                  {record.type === "income" ? "+" : "−"}
                </span>
                <div>
                  <p className="text-sm font-medium text-cream">
                    {record.description || (record.type === "income" ? "Gelir" : "Gider")}
                  </p>
                  <p className="text-xs text-cream/40">
                    {formatDate(record.record_date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p
                  className={`text-lg font-bold ${
                    record.type === "income"
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {record.type === "income" ? "+" : "−"}
                  {formatCurrency(Number(record.amount))}
                </p>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(record.id)}
                >
                  Sil
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
