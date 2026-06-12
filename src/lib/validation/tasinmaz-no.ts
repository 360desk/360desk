import type { SupabaseClient } from "@supabase/supabase-js";

export const TASINMAZ_NO_REQUIRED_MESSAGE =
  "İlanı yayınlayabilmek için Taşınmaz Bilgi Numarasını girmek zorunludur.";

export const TASINMAZ_NO_DUPLICATE_MESSAGE =
  "Bu taşınmaz numarası ile sistemde aktif başka bir ilan bulunmaktadır.";

const TASINMAZ_FIELD_ERRORS = new Set([
  TASINMAZ_NO_REQUIRED_MESSAGE,
  TASINMAZ_NO_DUPLICATE_MESSAGE,
]);

export function normalizeTasinmazNo(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

export function isTasinmazNoFieldError(message: string): boolean {
  return TASINMAZ_FIELD_ERRORS.has(message);
}

export async function checkActiveTasinmazNoDuplicate(
  supabase: SupabaseClient,
  tasinmazNo: string,
  excludeAdId?: string
): Promise<{ duplicate: boolean; error: string | null }> {
  const normalized = normalizeTasinmazNo(tasinmazNo);

  if (!normalized) {
    return { duplicate: false, error: null };
  }

  let query = supabase
    .from("classified_ads")
    .select("id")
    .eq("tasinmaz_no", normalized)
    .in("status", ["pending", "approved"])
    .eq("is_archived", false);

  if (excludeAdId) {
    query = query.neq("id", excludeAdId);
  }

  const { data, error } = await query.limit(1);

  if (error) {
    return { duplicate: false, error: error.message };
  }

  return { duplicate: (data?.length ?? 0) > 0, error: null };
}

export async function validateTasinmazNoForPublish(
  supabase: SupabaseClient,
  tasinmazNo: string | null | undefined,
  excludeAdId?: string
): Promise<{ ok: true; value: string } | { ok: false; error: string }> {
  const normalized = normalizeTasinmazNo(tasinmazNo);

  if (!normalized) {
    return { ok: false, error: TASINMAZ_NO_REQUIRED_MESSAGE };
  }

  const { duplicate, error } = await checkActiveTasinmazNoDuplicate(
    supabase,
    normalized,
    excludeAdId
  );

  if (error) {
    return {
      ok: false,
      error: "Taşınmaz numarası kontrol edilirken bir hata oluştu.",
    };
  }

  if (duplicate) {
    return { ok: false, error: TASINMAZ_NO_DUPLICATE_MESSAGE };
  }

  return { ok: true, value: normalized };
}

export function mapTasinmazNoDatabaseError(
  message: string,
  code?: string
): string | null {
  if (code === "23505") {
    return TASINMAZ_NO_DUPLICATE_MESSAGE;
  }

  const lower = message.toLowerCase();

  if (
    lower.includes("idx_classified_ads_tasinmaz_active") ||
    lower.includes("tasinmaz_no") ||
    lower.includes("duplicate key")
  ) {
    return TASINMAZ_NO_DUPLICATE_MESSAGE;
  }

  return null;
}
