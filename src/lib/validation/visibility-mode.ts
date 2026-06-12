import { normalizeTasinmazNo } from "@/lib/validation/tasinmaz-no";
import type { VisibilityMode } from "@/types/database";

export const VISIBILITY_TASINMAZ_REQUIRED_MESSAGE =
  "Bu ilanı havuzda veya dışarıda yayınlayabilmek için öncelikle Taşınmaz Bilgi Numarasını girmeniz gerekmektedir.";

const EXPANDED_VISIBILITY_MODES = new Set<VisibilityMode>([
  "internal_mls",
  "public",
]);

export function validateVisibilityChange(
  currentMode: VisibilityMode,
  nextMode: VisibilityMode,
  tasinmazNo: string | null | undefined
): { ok: true } | { ok: false; error: string } {
  if (currentMode === nextMode) {
    return { ok: true };
  }

  if (
    currentMode === "private" &&
    EXPANDED_VISIBILITY_MODES.has(nextMode) &&
    !normalizeTasinmazNo(tasinmazNo)
  ) {
    return { ok: false, error: VISIBILITY_TASINMAZ_REQUIRED_MESSAGE };
  }

  return { ok: true };
}
