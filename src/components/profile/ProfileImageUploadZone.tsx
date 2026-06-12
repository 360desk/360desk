"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  buildProfileImageUpdatePayload,
  getProfileImageUploadLabel,
  getProfileImageUrl,
  resolveAccountType,
  resolveProfileImageKind,
} from "@/lib/profile-identity";
import {
  updateProfileImageUrl,
  uploadProfileImage,
  validateProfileImageFile,
} from "@/lib/supabase/profile-images";
import { ACCEPTED_LISTING_IMAGE_TYPES } from "@/lib/supabase/storage";
import type { Profile } from "@/types/database";

interface ProfileImageUploadZoneProps {
  userId: string;
  profile: Profile | null;
  onUploaded?: () => void | Promise<void>;
  disabled?: boolean;
}

export function ProfileImageUploadZone({
  userId,
  profile,
  onUploaded,
  disabled = false,
}: ProfileImageUploadZoneProps) {
  const supabase = useMemo(() => createClient(), []);
  const inputRef = useRef<HTMLInputElement>(null);

  const accountType = resolveAccountType(profile);
  const imageKind = resolveProfileImageKind(accountType);
  const uploadLabel = getProfileImageUploadLabel(accountType);
  const currentImageUrl = getProfileImageUrl(profile);

  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPreviewUrl(getProfileImageUrl(profile));
  }, [profile?.avatar_url, profile?.logo_url, profile?.account_type, profile?.organization_role, profile?.is_independent_office]);

  const displayName =
    profile?.full_name?.trim() ||
    profile?.company_name?.trim() ||
    profile?.email ||
    "Profil";

  const handleUpload = useCallback(
    async (incoming: FileList | File[]) => {
      if (disabled || uploading) {
        return;
      }

      const file = Array.from(incoming)[0];

      if (!file) {
        return;
      }

      const validationError = validateProfileImageFile(file);

      if (validationError) {
        setError(validationError);
        return;
      }

      setUploading(true);
      setError("");

      try {
        const { url, error: uploadError } = await uploadProfileImage(
          supabase,
          userId,
          file,
          imageKind
        );

        if (uploadError || !url) {
          setError(uploadError ?? "Görsel yüklenemedi.");
          return;
        }

        const { error: saveError } = await updateProfileImageUrl(
          supabase,
          userId,
          buildProfileImageUpdatePayload(accountType, url)
        );

        if (saveError) {
          setError(saveError);
          return;
        }

        setPreviewUrl(url);
        await onUploaded?.();
      } finally {
        setUploading(false);
      }
    },
    [accountType, disabled, imageKind, onUploaded, supabase, uploading, userId]
  );

  return (
    <section className="px-5 py-5 sm:px-6 flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-cream">{uploadLabel}</h3>
        <p className="mt-1 text-xs text-cream/40">
          {accountType === "bireysel"
            ? "B2B dizininde güven oluşturmak için profesyonel profil fotoğrafınızı ekleyin."
            : "Kurumsal kimliğinizi yansıtan ofis logonuzu yükleyin."}
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-cream/15 bg-charcoal">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-primary">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_LISTING_IMAGE_TYPES.join(",")}
            className="hidden"
            disabled={disabled || uploading}
            onChange={(event) => {
              if (event.target.files) {
                void handleUpload(event.target.files);
                event.target.value = "";
              }
            }}
          />

          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex w-fit items-center justify-center rounded-lg border border-cream/20 bg-charcoal px-4 py-2.5 text-sm font-medium text-cream transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? "Yükleniyor..." : uploadLabel}
          </button>

          <p className="text-xs text-cream/40">
            JPEG, PNG veya WebP · Maks. 5 MB
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
