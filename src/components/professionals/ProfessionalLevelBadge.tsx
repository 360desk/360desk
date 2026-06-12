interface ProfessionalLevelBadgeProps {
  level: string | null;
}

export function ProfessionalLevelBadge({ level }: ProfessionalLevelBadgeProps) {
  if (!level?.trim()) {
    return (
      <span className="inline-flex items-center rounded-full border border-cream/15 bg-cream/5 px-2.5 py-0.5 text-xs font-medium text-cream/50">
        Seviye Belirtilmemiş
      </span>
    );
  }

  const isCrimsonLevel = level.includes("5. Seviye") || level.includes("4. Seviye");

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        isCrimsonLevel
          ? "border-primary/35 bg-primary/15 text-primary"
          : "border-cream/20 bg-cream/5 text-cream/60"
      }`}
    >
      {level}
    </span>
  );
}
