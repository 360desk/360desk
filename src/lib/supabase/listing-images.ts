import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ACCEPTED_LISTING_IMAGE_TYPES,
  LISTINGS_BUCKET,
  MAX_AD_IMAGES,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/supabase/storage";

export { LISTINGS_BUCKET };

export function validateListingImageFile(file: File): string | null {
  if (
    !ACCEPTED_LISTING_IMAGE_TYPES.includes(
      file.type as (typeof ACCEPTED_LISTING_IMAGE_TYPES)[number]
    )
  ) {
    return "Sadece JPEG, PNG veya WebP dosyaları yüklenebilir.";
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Dosya boyutu en fazla 5 MB olabilir.";
  }

  return null;
}

export function buildListingImagePath(listingId: string): string {
  return `${listingId}/${crypto.randomUUID()}.webp`;
}

export function parseListingsStoragePath(publicUrl: string): string | null {
  const markers = [
    `/storage/v1/object/public/${LISTINGS_BUCKET}/`,
    `/object/public/${LISTINGS_BUCKET}/`,
  ];

  for (const marker of markers) {
    const index = publicUrl.indexOf(marker);
    if (index !== -1) {
      return publicUrl.slice(index + marker.length);
    }
  }

  return null;
}

export function getListingImagePublicUrl(
  supabase: SupabaseClient,
  storagePath: string
): string {
  const { data } = supabase.storage
    .from(LISTINGS_BUCKET)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

export async function convertImageToWebp(file: File): Promise<Blob> {
  if (file.type === "image/webp") {
    return file;
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const context = canvas.getContext("2d");

      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Görsel işlenemedi."));
        return;
      }

      context.drawImage(image, 0, 0);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);

          if (!blob) {
            reject(new Error("WebP dönüşümü başarısız oldu."));
            return;
          }

          resolve(blob);
        },
        "image/webp",
        0.88
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Görsel okunamadı."));
    };

    image.src = objectUrl;
  });
}

export async function uploadListingImage(
  supabase: SupabaseClient,
  listingId: string,
  file: File
): Promise<{ url: string; path: string; error: string | null }> {
  const validationError = validateListingImageFile(file);

  if (validationError) {
    return { url: "", path: "", error: validationError };
  }

  const storagePath = buildListingImagePath(listingId);

  try {
    const webpBlob = await convertImageToWebp(file);

    const { error: uploadError } = await supabase.storage
      .from(LISTINGS_BUCKET)
      .upload(storagePath, webpBlob, {
        cacheControl: "3600",
        upsert: false,
        contentType: "image/webp",
      });

    if (uploadError) {
      return { url: "", path: "", error: uploadError.message };
    }

    return {
      url: getListingImagePublicUrl(supabase, storagePath),
      path: storagePath,
      error: null,
    };
  } catch (error) {
    return {
      url: "",
      path: "",
      error:
        error instanceof Error ? error.message : "Görsel yüklenirken hata oluştu.",
    };
  }
}

export async function deleteListingImage(
  supabase: SupabaseClient,
  publicUrl: string
): Promise<{ error: string | null }> {
  const storagePath = parseListingsStoragePath(publicUrl);

  if (!storagePath) {
    return { error: null };
  }

  const { error } = await supabase.storage
    .from(LISTINGS_BUCKET)
    .remove([storagePath]);

  return { error: error?.message ?? null };
}

export async function updateListingImages(
  supabase: SupabaseClient,
  listingId: string,
  images: string[]
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("classified_ads")
    .update({ images })
    .eq("id", listingId);

  return { error: error?.message ?? null };
}

export function canAddMoreImages(
  currentCount: number,
  maxImages: number = MAX_AD_IMAGES
): boolean {
  return currentCount < maxImages;
}
