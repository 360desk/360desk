"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AD_CATEGORIES } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";

interface AdFormProps {
  userId: string;
  onSuccess: () => void;
}

export function AdForm({ userId, onSuccess }: AdFormProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: AD_CATEGORIES[0] as string,
    location: "",
    contact_phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: insertError } = await supabase.from("classified_ads").insert({
      vendor_id: userId,
      title: form.title,
      description: form.description || null,
      price: parseFloat(form.price),
      category: form.category,
      location: form.location || null,
      contact_phone: form.contact_phone || null,
      status: "pending",
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setForm({
        title: "",
        description: "",
        price: "",
        category: AD_CATEGORIES[0] as string,
        location: "",
        contact_phone: "",
      });
      onSuccess();
    }

    setLoading(false);
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold text-cream mb-4">Yeni İlan Ekle</h2>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input
            label="İlan Başlığı"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            placeholder="Örn: 2020 Model BMW 320i"
          />
        </div>
        <div className="sm:col-span-2">
          <Textarea
            label="Açıklama"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            placeholder="İlan detaylarını yazın..."
          />
        </div>
        <Input
          label="Fiyat (₺)"
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
          placeholder="0"
        />
        <Select
          label="Kategori"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          options={AD_CATEGORIES.map((c) => ({ value: c, label: c }))}
        />
        <Input
          label="Konum"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder="İstanbul, Kadıköy"
        />
        <Input
          label="İletişim Telefonu"
          value={form.contact_phone}
          onChange={(e) =>
            setForm({ ...form, contact_phone: e.target.value })
          }
          placeholder="05XX XXX XX XX"
        />

        {error && (
          <p className="sm:col-span-2 text-sm text-red-400">{error}</p>
        )}

        <div className="sm:col-span-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Kaydediliyor..." : "İlanı Gönder"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
