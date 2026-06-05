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

export const AD_CATEGORIES = [
  "Emlak",
  "Vasıta",
  "Yedek Parça",
  "İkinci El",
  "Elektronik",
  "Ev & Yaşam",
  "Hizmet",
  "Diğer",
] as const;

export const AD_STATUS_LABELS: Record<string, string> = {
  pending: "Onay Bekliyor",
  approved: "Yayında",
  rejected: "Reddedildi",
};
