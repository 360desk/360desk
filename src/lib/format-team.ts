import type { AccountOrigin } from "@/types/database";

export const ACCOUNT_ORIGIN_LABELS: Record<AccountOrigin, string> = {
  self: "Bağımsız Katılım",
  created_by_office: "Ofis Hesabı",
};
