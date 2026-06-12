export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatSqMeters(value: number | null | undefined): string {
  if (value == null) return "Belirtilmemiş";
  return `${value} m²`;
}

export function formatOptional(
  value: string | number | null | undefined,
  suffix = ""
): string {
  if (value == null || value === "") return "Belirtilmemiş";
  return `${value}${suffix}`;
}

export const ROOM_COUNTS = [
  "Stüdyo (1+0)",
  "1+1",
  "1+1 Loft",
  "2+1",
  "2+1 Dubleks",
  "3+1",
  "3+1 Dubleks",
  "4+1",
  "4+1 Dubleks",
  "5+1",
  "6+",
] as const;

export const HEATING_TYPES = [
  "Yerden Isıtma",
  "Kombi (Doğalgaz)",
  "Merkezi",
  "Klima",
  "Soba",
  "Kat Kaloriferi",
  "Yok",
] as const;

export const BURSA_DISTRICTS = [
  "Nilüfer",
  "Osmangazi",
  "Yıldırım",
  "Mudanya",
  "Gemlik",
  "İnegöl",
  "Gürsu",
  "Kestel",
  "Orhangazi",
  "İznik",
  "Mustafakemalpaşa",
  "Karacabey",
  "Orhaneli",
  "Keles",
  "Büyükorhan",
  "Harmancık",
  "Yenişehir",
] as const;

export const DEFAULT_CITY = "Bursa";

export const AD_STATUS_LABELS: Record<string, string> = {
  draft: "Taslak",
  pending: "Onay Bekliyor",
  approved: "Yayında",
  rejected: "Reddedildi",
};

export const ARCHIVE_LABELS = {
  active: "Aktif",
  passive: "Pasif / Taslak",
} as const;

export const VISIBILITY_MODE_OPTIONS = [
  { value: "private", label: "Sadece Ben" },
  { value: "internal_mls", label: "Ortak Havuz (MLS)" },
  { value: "public", label: "Herkese Açık" },
] as const;

export const VISIBILITY_MODE_LABELS: Record<string, string> = {
  private: "Sadece Ben",
  internal_mls: "Ortak Havuz (MLS)",
  public: "Herkese Açık",
};
