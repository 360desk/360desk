"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";

interface FinanceFormProps {
  userId: string;
  onSuccess: () => void;
}

export function FinanceForm({ userId, onSuccess }: FinanceFormProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    type: "income" as "income" | "expense",
    amount: "",
    description: "",
    record_date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: insertError } = await supabase
      .from("financial_records")
      .insert({
        vendor_id: userId,
        type: form.type,
        amount: parseFloat(form.amount),
        description: form.description || null,
        record_date: form.record_date,
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setForm({
        type: "income",
        amount: "",
        description: "",
        record_date: new Date().toISOString().split("T")[0],
      });
      onSuccess();
    }

    setLoading(false);
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold text-cream mb-4">
        Yeni Kayıt Ekle
      </h2>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Tür"
          value={form.type}
          onChange={(e) =>
            setForm({
              ...form,
              type: e.target.value as "income" | "expense",
            })
          }
          options={[
            { value: "income", label: "Gelir" },
            { value: "expense", label: "Gider" },
          ]}
        />
        <Input
          label="Tutar (₺)"
          type="number"
          min="0.01"
          step="0.01"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
          placeholder="0"
        />
        <Input
          label="Tarih"
          type="date"
          value={form.record_date}
          onChange={(e) =>
            setForm({ ...form, record_date: e.target.value })
          }
          required
        />
        <div className="sm:col-span-2">
          <Textarea
            label="Açıklama"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            placeholder="İşlem açıklaması..."
          />
        </div>

        {error && (
          <p className="sm:col-span-2 text-sm text-red-400">{error}</p>
        )}

        <div className="sm:col-span-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
