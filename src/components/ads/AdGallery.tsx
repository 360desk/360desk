"use client";

import { useState } from "react";
import Image from "next/image";
import { getAdImages } from "@/lib/ads";
import type { ClassifiedAd } from "@/types/database";

interface AdGalleryProps {
  ad: ClassifiedAd;
  variant?: "card" | "detail" | "thumb";
  className?: string;
}

export function AdGallery({
  ad,
  variant = "card",
  className = "",
}: AdGalleryProps) {
  const images = getAdImages(ad);
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-charcoal-light ${className} ${
          variant === "card" ? "aspect-[4/3] rounded-t-xl" : "aspect-video rounded-xl"
        }`}
      >
        <div className="flex flex-col items-center gap-2 text-cream/20">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
            />
          </svg>
          <span className="text-xs">Görsel yok</span>
        </div>
      </div>
    );
  }

  if (variant === "thumb") {
    return (
      <div className={`relative overflow-hidden rounded-lg ${className}`}>
        <Image
          src={images[0]}
          alt={ad.title}
          fill
          className="object-cover"
          sizes="80px"
        />
        {images.length > 1 && (
          <span className="absolute bottom-1 right-1 rounded bg-charcoal/80 px-1.5 py-0.5 text-[10px] text-cream">
            +{images.length - 1}
          </span>
        )}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={images[0]}
            alt={ad.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 flex gap-1">
            {images.slice(0, 4).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${
                  i === 0 ? "bg-primary" : "bg-cream/40"
                }`}
              />
            ))}
            {images.length > 4 && (
              <span className="ml-0.5 text-[10px] text-cream/80 font-medium">
                +{images.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // detail variant — slider
  const goTo = (index: number) => {
    setActiveIndex((index + images.length) % images.length);
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-cream/10 bg-charcoal-light">
        <Image
          src={images[activeIndex]}
          alt={`${ad.title} — görsel ${activeIndex + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 700px"
          priority
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-charcoal/80 text-cream border border-cream/20 hover:border-primary hover:text-primary transition-colors"
              aria-label="Önceki görsel"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-charcoal/80 text-cream border border-cream/20 hover:border-primary hover:text-primary transition-colors"
              aria-label="Sonraki görsel"
            >
              ›
            </button>
            <span className="absolute top-3 right-3 rounded-full bg-charcoal/80 px-2.5 py-1 text-xs text-cream/80">
              {activeIndex + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                i === activeIndex ? "border-primary" : "border-cream/10 hover:border-cream/30"
              }`}
            >
              <Image
                src={url}
                alt={`Küçük resim ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
