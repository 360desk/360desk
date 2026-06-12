"use client";

import { useEffect, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKey);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const maxWidth = size === "lg" ? "max-w-2xl" : "max-w-lg";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-charcoal-dark/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={`relative z-10 w-full ${maxWidth} overflow-hidden rounded-2xl border border-cream/10 bg-charcoal shadow-2xl shadow-black/40`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-cream/10 px-6 py-5">
          <h2 className="text-lg font-semibold text-cream">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-cream/10 bg-charcoal-light text-cream/60 transition-colors hover:border-primary hover:text-primary"
            aria-label="Kapat"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-cream/10 bg-charcoal-light/40 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
