import type { SupabaseClient } from "@supabase/supabase-js";
import { convertImageToWebp } from "@/lib/supabase/listing-images";
import {
  ACCEPTED_LISTING_IMAGE_TYPES,
  LISTINGS_BUCKET,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/supabase/storage";
import type { ProfileImageKind } from "@/lib/profile-identity";

export const PROFILE_MEDIA_PREFIX = "profiles";

export function validateProfileImageFile(file: File): string | null {
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

export function buildProfileImagePath(
  userId: string,
  kind: ProfileImageKind
): string {
  return `${PROFILE_MEDIA_PREFIX}/${userId}/${kind}.webp`;
}

export function getProfileImagePublicUrl(
  supabase: SupabaseClient,
  storagePath: string
): string {
  const { data } = supabase.storage
    .from(LISTINGS_BUCKET)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

export async function uploadProfileImage(
  supabase: SupabaseClient,
  userId: string,
  file: File,
  kind: ProfileImageKind
): Promise<{ url: string | null; error: string | null }> {
  const validationError = validateProfileImageFile(file);

  if (validationError) {
    return { url: null, error: validationError };
  }

  const storagePath = buildProfileImagePath(userId, kind);

  try {
    const blob = await convertImageToWebp(file);

    const { error: uploadError } = await supabase.storage
      .from(LISTINGS_BUCKET)
      .upload(storagePath, blob, {
        cacheControl: "3600",
        upsert: true,
        contentType: "image/webp",
      });

    if (uploadError) {
      return { url: null, error: uploadError.message };
    }

    return {
      url: getProfileImagePublicUrl(supabase, storagePath),
      error: null,
    };
  } catch (error) {
    return {
      url: null,
      error: error instanceof Error ? error.message : "Görsel yüklenemedi.",
    };
  }
}

function isMissingColumnError(message: string): boolean {
  return (
    message.includes("does not exist") || message.toLowerCase().includes("42703")
  );
}

export async function updateProfileImageUrl(
  supabase: SupabaseClient,
  userId: string,
  payload: { avatar_url: string | null; logo_url: string | null }
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userId);

  if (!error) {
    return { error: null };
  }

  if (!isMissingColumnError(error.message)) {
    return { error: error.message };
  }

  const fallbackPayload =
    payload.avatar_url != null
      ? { avatar_url: payload.avatar_url }
      : payload.logo_url != null
        ? { logo_url: payload.logo_url }
        : null;

  if (!fallbackPayload) {
    return { error: error.message };
  }

  const { error: fallbackError } = await supabase
    .from("profiles")
    .update(fallbackPayload)
    .eq("id", userId);

  if (!fallbackError) {
    return { error: null };
  }

  if (
    isMissingColumnError(fallbackError.message) &&
    payload.logo_url &&
    !payload.avatar_url
  ) {
    const { error: avatarFallbackError } = await supabase
      .from("profiles")
      .update({ avatar_url: payload.logo_url })
      .eq("id", userId);

    return { error: avatarFallbackError?.message ?? null };
  }

  return { error: fallbackError.message };
}
