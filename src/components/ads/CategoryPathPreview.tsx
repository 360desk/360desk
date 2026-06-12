import { buildCategoryPath, type CategorySelection } from "@/lib/categories";

export function CategoryPathPreview({
  selection,
}: {
  selection: CategorySelection;
}) {
  const path = buildCategoryPath(selection);
  const parts = path.split(" › ");

  return (
    <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-2">
        Seçilen Kategori Yolu
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {parts.map((part, i) => (
          <span key={`${part}-${i}`} className="inline-flex items-center gap-1.5">
            {i > 0 && <span className="text-cream/30 text-xs">›</span>}
            <span
              className={`text-xs font-medium ${
                i === parts.length - 1 ? "text-primary" : "text-cream/70"
              }`}
            >
              {part}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
