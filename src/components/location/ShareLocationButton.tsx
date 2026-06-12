"use client";

import { useState } from "react";
import { ShareLocationModal } from "@/components/location/ShareLocationModal";
import { Button } from "@/components/ui/Button";
import type { ShareLocationPayload } from "@/types/listing-geo";

interface ShareLocationButtonProps {
  payload: ShareLocationPayload;
  size?: "sm" | "md";
  variant?: "outline" | "secondary" | "ghost";
}

export function ShareLocationButton({
  payload,
  size = "sm",
  variant = "outline",
}: ShareLocationButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        size={size}
        variant={variant}
        className="gap-1.5"
        onClick={() => setOpen(true)}
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        Konumu Paylaş
      </Button>

      <ShareLocationModal
        open={open}
        onClose={() => setOpen(false)}
        payload={payload}
      />
    </>
  );
}
