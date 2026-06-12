"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AdForm } from "@/components/ads/AdForm";
import { resolveProfileImageLimit } from "@/lib/supabase/profile-quota";
import { ImageUploadZone } from "@/components/panel/ImageUploadZone";
import { ProfileCompletionGuard } from "@/components/profile/ProfileCompletionGuard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getAdImages } from "@/lib/ads";
import { getCustomListingId } from "@/lib/listing";
import type { ClassifiedAd } from "@/types/database";

interface ListingEditClientProps {
  ad: ClassifiedAd;
  vendorId: string;
}

export function ListingEditClient({ ad, vendorId }: ListingEditClientProps) {
  const router = useRouter();
  const { profile } = useAuth();
  const listingId = getCustomListingId(ad);
  const [galleryImages, setGalleryImages] = useState(() => getAdImages(ad));
  const maxImages = useMemo(
    () => resolveProfileImageLimit(profile),
    [profile]
  );

  const handleDone = () => {
    router.push("/panelim");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/panelim"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-cream/50 transition-colors hover:text-cream"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            İlanlarıma Dön
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-cream">İlanı Düzenle</h1>
          <p className="mt-1 text-sm text-cream/50">
            <span className="font-mono tracking-wider text-cream/40">
              {listingId}
            </span>
            <span className="mx-2 text-cream/20">·</span>
            {ad.title}
          </p>
        </div>
        <Link href="/panelim">
          <Button variant="ghost" size="sm">
            Vazgeç
          </Button>
        </Link>
      </div>

      <ProfileCompletionGuard>
        <Card className="border-cream/10 bg-charcoal-light">
          <div className="mb-5 flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-cream">İlan Galerisi</h2>
            <p className="text-sm text-cream/50">
              Görselleri yükleyin, sıralayın ve kapak fotoğrafını belirleyin.
            </p>
          </div>
          <ImageUploadZone
            listingId={ad.id}
            initialImages={galleryImages}
            onImagesChange={setGalleryImages}
            maxImages={maxImages}
          />
        </Card>

        <AdForm
          key={ad.id}
          vendorId={vendorId}
          ad={ad}
          syncedImages={galleryImages}
          onSuccess={handleDone}
          onCancel={handleDone}
        />
      </ProfileCompletionGuard>
    </div>
  );
}
