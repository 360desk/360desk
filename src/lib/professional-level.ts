export const PROFESSIONAL_LEVEL_OPTIONS = [
  { value: "Yetki Belgesi Yok", label: "Yetki Belgesi Yok" },
  { value: "4. Seviye", label: "4. Seviye (Emlak Danışmanı)" },
  { value: "5. Seviye", label: "5. Seviye (Sorumlu Emlak Danışmanı)" },
] as const;

export type ProfessionalLevelValue =
  (typeof PROFESSIONAL_LEVEL_OPTIONS)[number]["value"];

const LEVEL_VALUES = new Set<string>(
  PROFESSIONAL_LEVEL_OPTIONS.map((option) => option.value)
);

export function isProfessionalLevelValue(
  value: string | null | undefined
): value is ProfessionalLevelValue {
  return Boolean(value && LEVEL_VALUES.has(value));
}

export function normalizeProfessionalLevel(
  value: unknown
): ProfessionalLevelValue | "" {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (isProfessionalLevelValue(trimmed)) {
      return trimmed;
    }
  }

  if (value === 4 || value === "4") {
    return "4. Seviye";
  }

  if (value === 5 || value === "5") {
    return "5. Seviye";
  }

  return "";
}
