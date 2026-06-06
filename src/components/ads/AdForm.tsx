"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { insertClassifiedAd } from "@/lib/supabase/ads";
import { uploadAdImages } from "@/lib/supabase/storage";
import { AD_CATEGORIES } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { ImageUpload } from "@/components/ads/ImageUpload";

interface AdFormProps {
  vendorId: string;
  onSuccess: () => void;
}

export function AdForm({ vendorId, onSuccess }: AdFormProps) {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const activeVendorId = user?.id ?? vendorId;

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

    if (!activeVendorId) {
      setError("Kullanıcı kimliği bulunamadı. Lütfen tekrar giriş yapın.");
      setLoading(false);
      return;
    }

    const { urls, error: uploadError } = await uploadAdImages(
      supabase,
      activeVendorId,
      imageFiles
    );

    if (uploadError) {
      setError(`Görsel yükleme hatası: ${uploadError}`);
      setLoading(false);
      return;
    }

    const { error: insertError } = await insertClassifiedAd(
      supabase,
      {
        title: form.title.trim(),
        description: form.description.trim() || null,
        price: parseFloat(form.price),
        category: form.category,
        location: form.location.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        images: urls,
      },
      activeVendorId
    );

    if (insertError) {
      setError(insertError);
    } else {
      setForm({
        title: "",
        description: "",
        price: "",
        category: AD_CATEGORIES[0] as string,
        location: "",
        contact_phone: "",
      });
      setImageFiles([]);
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

        <div className="sm:col-span-2">
          <ImageUpload
            files={imageFiles}
            onChange={setImageFiles}
            disabled={loading}
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
          <Button type="submit" disabled={loading || !activeVendorId}>
            {loading ? "Kaydediliyor..." : "İlanı Gönder"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
