import { formatCategoryFromAd } from "@/lib/categories";
import type { ClassifiedAd } from "@/types/database";

interface CategoryBadgeProps {
  ad: ClassifiedAd;
  size?: "sm" | "md";
}

export function CategoryBadge({ ad, size = "sm" }: CategoryBadgeProps) {
  const path = formatCategoryFromAd(ad);
  const parts = path.split(" › ");

  return (
    <div className="flex flex-wrap items-center gap-1">
      {parts.map((part, i) => (
        <span key={`${part}-${i}`} className="inline-flex items-center gap-1">
          {i > 0 && (
            <span className="text-cream/20 text-xs">›</span>
          )}
          <span
            className={`inline-flex items-center rounded-md font-medium ${
              i === parts.length - 1
                ? "bg-primary/15 text-primary"
                : "bg-cream/5 text-cream/60"
            } ${
              size === "sm"
                ? "px-2 py-0.5 text-xs"
                : "px-2.5 py-1 text-sm"
            }`}
          >
            {part}
          </span>
        </span>
      ))}
    </div>
  );
}
