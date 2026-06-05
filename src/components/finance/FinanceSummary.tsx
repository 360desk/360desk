import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";
import type { FinancialSummary } from "@/types/database";

export function FinanceSummary({ summary }: { summary: FinancialSummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card className="text-center">
        <p className="text-sm text-cream/50 mb-1">Toplam Gelir</p>
        <p className="text-2xl font-bold text-emerald-400">
          {formatCurrency(summary.totalIncome)}
        </p>
      </Card>
      <Card className="text-center">
        <p className="text-sm text-cream/50 mb-1">Toplam Gider</p>
        <p className="text-2xl font-bold text-red-400">
          {formatCurrency(summary.totalExpense)}
        </p>
      </Card>
      <Card className="text-center border-primary/30">
        <p className="text-sm text-cream/50 mb-1">Net Bakiye</p>
        <p
          className={`text-2xl font-bold ${summary.netBalance >= 0 ? "text-primary" : "text-red-400"}`}
        >
          {formatCurrency(summary.netBalance)}
        </p>
      </Card>
    </div>
  );
}
