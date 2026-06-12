import type { SupabaseClient } from "@supabase/supabase-js";

export const AD_IMAGES_BUCKET = "ad-images";
export const LISTINGS_BUCKET = "listings";
export const MAX_AD_IMAGES = 8;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const ACCEPTED_LISTING_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return "Sadece JPEG, PNG, WebP veya GIF dosyaları yüklenebilir.";
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Dosya boyutu en fazla 5 MB olabilir.";
  }
  return null;
}

function getFileExtension(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext && ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
}

export async function uploadAdImages(
  supabase: SupabaseClient,
  userId: string,
  files: File[]
): Promise<{ urls: string[]; error: string | null }> {
  if (files.length === 0) {
    return { urls: [], error: null };
  }

  if (files.length > MAX_AD_IMAGES) {
    return { urls: [], error: `En fazla ${MAX_AD_IMAGES} görsel yükleyebilirsiniz.` };
  }

  const urls: string[] = [];

  for (const file of files) {
    const validationError = validateImageFile(file);
    if (validationError) {
      return { urls: [], error: validationError };
    }

    const ext = getFileExtension(file.name);
    const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(AD_IMAGES_BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      return { urls: [], error: uploadError.message };
    }

    const { data } = supabase.storage.from(AD_IMAGES_BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return { urls, error: null };
}
