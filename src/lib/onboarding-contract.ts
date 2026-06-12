import type { Profile } from "@/types/database";
import {
  profileHasInvitedHierarchyRole,
  requiresOnboardingContract as requiresOnboardingContractLock,
} from "@/lib/onboarding-lock";

export function requiresOnboardingContract(
  profile: Profile | null | undefined,
  hasAcceptedInvite = false
): boolean {
  return requiresOnboardingContractLock(profile, hasAcceptedInvite);
}

export { profileHasInvitedHierarchyRole };

export const ONBOARDING_LEGAL_SECTIONS = [
  {
    title: "Kullanıcı Sözleşmesi",
    body: "360desk B2B platformuna katılarak, hesabınızın bağlı olduğu kurumsal ofis veya franchise yapısı kapsamında portföy, ekip ve görünürlük kurallarına uyacağınızı kabul edersiniz. Platform üzerinden oluşturduğunuz tüm ilan ve müşteri kayıtlarından hukuken siz sorumlusunuz.",
  },
  {
    title: "Hizmet Şartları",
    body: "Abonelik kotanız, ekip hiyerarşiniz ve MLS görünürlük haklarınız bağlı olduğunuz lider hesabın paket sınırları ile yönetilir. Sistem davetinizi kabul ettiğiniz anda geçici erişim sağlanır; sözleşme onayı olmadan panel fonksiyonları kilitli kalır.",
  },
  {
    title: "KVKK Aydınlatma Metni",
    body: "Kimlik, iletişim, mesleki yeterlilik ve portföy verileriniz; hizmet sunumu, ekip yönetimi, faturalama ve yasal yükümlülükler kapsamında işlenir. Verileriniz üçüncü taraflarla yalnızca açık rızanız veya kanuni zorunluluk halinde paylaşılır.",
  },
] as const;
