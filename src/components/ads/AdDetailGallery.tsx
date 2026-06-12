"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { getAdImages } from "@/lib/ads";
import type { ClassifiedAd } from "@/types/database";

interface AdDetailGalleryProps {
  ad: ClassifiedAd;
}

export function AdDetailGallery({ ad }: AdDetailGalleryProps) {
  const images = getAdImages(ad);
  const [activeIndex, setActiveIndex] = useState(0);

  const goTo = useCallback(
    (index: number) => {
      if (images.length === 0) return;
      setActiveIndex((index + images.length) % images.length);
    },
    [images.length]
  );

  if (images.length === 0) {
    return (
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-cream/10 bg-charcoal-light">
        <div className="absolute inset-0 bg-gradient-to-br from-charcoal-light via-charcoal to-charcoal-dark" />
        <div className="relative flex h-full flex-col items-center justify-center gap-4 p-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-cream/10 bg-charcoal/60">
            <svg
              className="h-10 w-10 text-cream/20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-cream/30">
            Bu ilan için görsel eklenmemiş
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="group relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-cream/10 bg-charcoal-light shadow-xl shadow-black/20">
        <Image
          src={images[activeIndex]}
          alt={`${ad.title} — görsel ${activeIndex + 1}`}
          fill
          className="object-cover transition-opacity duration-300"
          sizes="(max-width: 1024px) 100vw, 66vw"
          priority
        />

        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 via-transparent to-transparent pointer-events-none" />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-charcoal/90 text-cream border border-cream/20 opacity-0 group-hover:opacity-100 hover:border-primary hover:bg-primary hover:text-cream transition-all duration-200 shadow-lg"
              aria-label="Önceki görsel"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-charcoal/90 text-cream border border-cream/20 opacity-0 group-hover:opacity-100 hover:border-primary hover:bg-primary hover:text-cream transition-all duration-200 shadow-lg"
              aria-label="Sonraki görsel"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        <span className="absolute top-4 right-4 rounded-full border border-cream/20 bg-charcoal/80 px-3 py-1 text-xs font-medium text-cream backdrop-blur-sm">
          {activeIndex + 1} / {images.length}
        </span>
      </div>

      {images.length > 1 && (
        <>
          <div className="flex justify-center gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`h-2 rounded-full transition-all duration-200 ${
                  i === activeIndex
                    ? "w-8 bg-primary"
                    : "w-2 bg-cream/30 hover:bg-cream/50"
                }`}
                aria-label={`Görsel ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {images.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                  i === activeIndex
                    ? "border-primary shadow-lg shadow-primary/20"
                    : "border-cream/10 hover:border-cream/30 opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={url}
                  alt={`Küçük resim ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
