"use client";

import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  canAddMoreImages,
  deleteListingImage,
  updateListingImages,
  uploadListingImage,
  validateListingImageFile,
} from "@/lib/supabase/listing-images";
import { ACCEPTED_LISTING_IMAGE_TYPES, MAX_AD_IMAGES } from "@/lib/supabase/storage";

interface ImageUploadZoneProps {
  listingId: string;
  initialImages?: string[];
  onImagesChange?: (images: string[]) => void;
  disabled?: boolean;
  maxImages?: number;
}

function reorderImages<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function ImageUploadZone({
  listingId,
  initialImages = [],
  onImagesChange,
  disabled = false,
  maxImages = MAX_AD_IMAGES,
}: ImageUploadZoneProps) {
  const supabase = useMemo(() => createClient(), []);
  const inputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<string[]>(initialImages);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [error, setError] = useState("");

  const persistImages = useCallback(
    async (nextImages: string[]) => {
      const { error: updateError } = await updateListingImages(
        supabase,
        listingId,
        nextImages
      );

      if (updateError) {
        throw new Error(updateError);
      }

      setImages(nextImages);
      onImagesChange?.(nextImages);
    },
    [listingId, onImagesChange, supabase]
  );

  const handleUpload = useCallback(
    async (incoming: FileList | File[]) => {
      if (disabled || uploading) return;

      setError("");
      const files = Array.from(incoming);
      const remaining = maxImages - images.length;

      if (remaining <= 0) {
        setError(`En fazla ${maxImages} görsel ekleyebilirsiniz.`);
        return;
      }

      const batch = files.slice(0, remaining);
      setUploading(true);

      try {
        const uploadedUrls: string[] = [];

        for (const file of batch) {
          const validationError = validateListingImageFile(file);

          if (validationError) {
            setError(validationError);
            return;
          }

          const { url, error: uploadError } = await uploadListingImage(
            supabase,
            listingId,
            file
          );

          if (uploadError || !url) {
            setError(uploadError ?? "Görsel yüklenemedi.");
            return;
          }

          uploadedUrls.push(url);
        }

        await persistImages([...images, ...uploadedUrls]);
      } catch (persistError) {
        setError(
          persistError instanceof Error
            ? persistError.message
            : "Görseller kaydedilemedi."
        );
      } finally {
        setUploading(false);
      }
    },
    [disabled, images, listingId, maxImages, persistImages, supabase, uploading]
  );

  const handleDelete = async (index: number) => {
    if (disabled || uploading || busyIndex !== null) return;

    const targetUrl = images[index];
    setBusyIndex(index);
    setError("");

    try {
      const { error: deleteError } = await deleteListingImage(
        supabase,
        targetUrl
      );

      if (deleteError) {
        setError(deleteError);
        return;
      }

      await persistImages(images.filter((_, i) => i !== index));
    } catch (persistError) {
      setError(
        persistError instanceof Error
          ? persistError.message
          : "Görsel silinemedi."
      );
    } finally {
      setBusyIndex(null);
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= images.length || disabled) {
      return;
    }

    setError("");

    try {
      await persistImages(reorderImages(images, index, targetIndex));
    } catch (persistError) {
      setError(
        persistError instanceof Error
          ? persistError.message
          : "Sıralama güncellenemedi."
      );
    }
  };

  const handleDropReorder = async (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex || disabled) {
      setDragIndex(null);
      return;
    }

    setError("");

    try {
      await persistImages(reorderImages(images, dragIndex, targetIndex));
    } catch (persistError) {
      setError(
        persistError instanceof Error
          ? persistError.message
          : "Sıralama güncellenemedi."
      );
    } finally {
      setDragIndex(null);
    }
  };

  const acceptTypes = ACCEPTED_LISTING_IMAGE_TYPES.join(",");

  return (
    <div className="flex flex-col gap-5">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            inputRef.current?.click();
          }
        }}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled && canAddMoreImages(images.length, maxImages)) {
            setDragging(true);
          }
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (event.dataTransfer.files.length > 0) {
            void handleUpload(event.dataTransfer.files);
          }
        }}
        className={`relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-12 transition-all duration-300 ${
          dragging
            ? "scale-[1.01] border-primary bg-primary/10 shadow-lg shadow-primary/10"
            : "border-cream/20 bg-[#1E1F22] hover:border-primary/60 hover:bg-[#232428]"
        } ${disabled || uploading ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      >
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl border transition-colors ${
            dragging
              ? "border-primary/50 bg-primary/15"
              : "border-cream/15 bg-charcoal"
          }`}
        >
          <svg
            className={`h-8 w-8 transition-colors ${
              dragging ? "text-primary" : "text-cream/55"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
        </div>

        <div className="text-center">
          <p className="text-base font-medium text-cream">
            {uploading
              ? "Görseller yükleniyor..."
              : "Yüksek çözünürlüklü görselleri sürükleyin"}
          </p>
          <p className="mt-1 text-sm text-cream/45">
            veya{" "}
            <span className="font-medium text-primary">dosya seçin</span>
          </p>
          <p className="mt-3 text-xs tracking-wide text-cream/35">
            JPG · JPEG · PNG · WebP — maks. 5 MB — {images.length}/
            {maxImages}
          </p>
        </div>

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-charcoal/50 backdrop-blur-[1px]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cream/20 border-t-primary" />
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={acceptTypes}
          multiple
          className="hidden"
          disabled={
            disabled || uploading || !canAddMoreImages(images.length, maxImages)
          }
          onChange={(event) => {
            if (event.target.files) {
              void handleUpload(event.target.files);
            }
            event.target.value = "";
          }}
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {images.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-cream/80">Galeri Sırası</p>
            <p className="text-xs text-cream/40">
              İlk görsel kapak fotoğrafıdır
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((url, index) => {
              const isCover = index === 0;
              const isBusy = busyIndex === index;

              return (
                <div
                  key={url}
                  draggable={!disabled && !uploading}
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    void handleDropReorder(index);
                  }}
                  className={`group relative overflow-hidden rounded-xl border bg-charcoal transition-all duration-200 ${
                    dragIndex === index
                      ? "scale-[0.98] border-primary/50 opacity-70"
                      : "border-cream/10 hover:border-primary/35"
                  } ${isBusy ? "opacity-50" : ""}`}
                >
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={url}
                      alt={`İlan görseli ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  </div>

                  {isCover && (
                    <span className="absolute left-2 top-2 rounded-full border border-primary/35 bg-primary/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary backdrop-blur-sm">
                      Kapak
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => void handleDelete(index)}
                    disabled={disabled || uploading || isBusy}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-cream/15 bg-charcoal/85 text-cream/70 opacity-0 transition-all duration-200 hover:border-red-400/40 hover:bg-red-950/70 hover:text-red-200 group-hover:opacity-100"
                    aria-label="Görseli sil"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>

                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-charcoal/95 via-charcoal/70 to-transparent px-2 pb-2 pt-8 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => void handleMove(index, -1)}
                      disabled={disabled || index === 0 || uploading}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-cream/15 bg-charcoal/90 text-cream/70 transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-30"
                      aria-label="Sola taşı"
                    >
                      ←
                    </button>
                    <span className="text-[10px] font-mono text-cream/45">
                      {index + 1}/{images.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleMove(index, 1)}
                      disabled={
                        disabled || index === images.length - 1 || uploading
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-cream/15 bg-charcoal/90 text-cream/70 transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-30"
                      aria-label="Sağa taşı"
                    >
                      →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
