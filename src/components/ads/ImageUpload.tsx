"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_AD_IMAGES,
  MAX_IMAGE_SIZE_BYTES,
  validateImageFile,
} from "@/lib/supabase/storage";

interface ImageUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  maxImages?: number;
}

export function ImageUpload({
  files,
  onChange,
  disabled,
  maxImages = MAX_AD_IMAGES,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      setError("");
      const list = Array.from(incoming);
      const remaining = maxImages - files.length;

      if (remaining <= 0) {
        setError(`En fazla ${maxImages} görsel ekleyebilirsiniz.`);
        return;
      }

      const toAdd: File[] = [];
      for (const file of list.slice(0, remaining)) {
        const validationError = validateImageFile(file);
        if (validationError) {
          setError(validationError);
          return;
        }
        toAdd.push(file);
      }

      onChange([...files, ...toAdd]);
    },
    [files, maxImages, onChange]
  );

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
    setError("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-cream/80">Görseller</label>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 transition-all cursor-pointer ${
          dragging
            ? "border-primary bg-primary/10 scale-[1.01]"
            : "border-primary/40 bg-charcoal hover:border-primary hover:bg-charcoal-light"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
          <svg
            className="h-7 w-7 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-cream">
            Görselleri sürükleyip bırakın veya{" "}
            <span className="text-primary">dosya seçin</span>
          </p>
          <p className="mt-1 text-xs text-cream/40">
            JPEG, PNG, WebP, GIF — max 5 MB — en fazla {maxImages} görsel
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          multiple
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-lg border border-cream/10 bg-charcoal-light"
            >
              <Image
                src={URL.createObjectURL(file)}
                alt={`Önizleme ${index + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                disabled={disabled}
                className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-cream text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary-dark"
                aria-label="Görseli kaldır"
              >
                ×
              </button>
              <span className="absolute bottom-1.5 left-1.5 rounded bg-charcoal/80 px-1.5 py-0.5 text-[10px] text-cream/60">
                {(file.size / 1024).toFixed(0)} KB
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-cream/30">
        {files.length}/{maxImages} görsel seçildi
      </p>
    </div>
  );
}
