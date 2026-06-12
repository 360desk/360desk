import {
  isProfessionalLevelValue,
  normalizeProfessionalLevel,
  type ProfessionalLevelValue,
} from "@/lib/professional-level";
import type { Profile } from "@/types/database";

export const PROFILE_AD_GUARD_MESSAGE =
  "İlan verebilmek için öncelikle profilinizdeki TTBS belge numaralarını ve kurumsal kimlik bilgilerinizi tamamlamanız gerekmektedir.";

export interface ProfileFormFields {
  full_name: string;
  phone: string;
  ttbs_no: string;
  professional_level: ProfessionalLevelValue | "";
  is_independent_office: boolean;
  company_name: string;
  company_ttbs_no: string;
}

export type ProfileCompletionFields = Pick<
  Profile,
  | "is_profile_completed"
  | "full_name"
  | "phone"
  | "ttbs_no"
  | "is_independent_office"
  | "company_name"
  | "company_ttbs_no"
  | "role"
>;

export function isProfileComplete(
  profile: ProfileCompletionFields | null
): boolean {
  if (!profile) {
    return false;
  }

  if (profile.role === "admin") {
    return true;
  }

  if (profile.is_profile_completed) {
    return true;
  }

  const hasIdentity = Boolean(
    profile.full_name?.trim() && profile.phone?.trim() && profile.ttbs_no?.trim()
  );

  if (!hasIdentity) {
    return false;
  }

  if (profile.is_independent_office) {
    const corporateTtbs = profile.company_ttbs_no?.trim() || profile.ttbs_no?.trim();
    return Boolean(profile.company_name?.trim() && corporateTtbs);
  }

  return true;
}

export function validateProfileForm(
  fields: ProfileFormFields
): Partial<Record<keyof ProfileFormFields, string>> {
  const errors: Partial<Record<keyof ProfileFormFields, string>> = {};

  if (!fields.full_name?.trim()) {
    errors.full_name = "Ad soyad zorunludur.";
  }

  if (!fields.phone?.trim()) {
    errors.phone = "Onaylı telefon numarası zorunludur.";
  }

  if (!fields.ttbs_no?.trim()) {
    errors.ttbs_no = "Bireysel TTBS belge numarası zorunludur.";
  }

  if (!isProfessionalLevelValue(fields.professional_level)) {
    errors.professional_level = "Mesleki yeterlilik seviyesi seçiniz.";
  }

  if (fields.is_independent_office) {
    if (!fields.company_name?.trim()) {
      errors.company_name = "Firma / ajans adı zorunludur.";
    }

    if (!fields.company_ttbs_no?.trim()) {
      errors.company_ttbs_no = "Kurumsal TTBS numarası zorunludur.";
    }
  }

  return errors;
}

export function profileToFormFields(
  profile: Profile | null,
  userMetadata?: Record<string, unknown> | null
): ProfileFormFields {
  const metadataPhone =
    typeof userMetadata?.phone === "string" ? userMetadata.phone : "";
  const metadataTtbs =
    typeof userMetadata?.ttbs_no === "string" ? userMetadata.ttbs_no : "";
  const metadataIndividualTtbs =
    typeof userMetadata?.individual_ttbs_no === "string"
      ? userMetadata.individual_ttbs_no
      : "";
  const isOffice =
    profile?.is_independent_office ??
    (profile?.organization_role === "office_admin" ||
      Boolean(userMetadata?.is_independent_office));

  return {
    full_name: profile?.full_name ?? "",
    phone: profile?.phone ?? metadataPhone,
    ttbs_no: isOffice
      ? metadataIndividualTtbs || metadataTtbs
      : (profile?.ttbs_no ?? metadataTtbs),
    professional_level: normalizeProfessionalLevel(profile?.professional_level),
    is_independent_office: isOffice,
    company_name:
      profile?.company_name ??
      (typeof userMetadata?.company_name === "string"
        ? userMetadata.company_name
        : ""),
    company_ttbs_no: isOffice
      ? (profile?.ttbs_no ?? profile?.company_ttbs_no ?? "")
      : (profile?.company_ttbs_no ??
        (typeof userMetadata?.company_ttbs_no === "string"
          ? userMetadata.company_ttbs_no
          : "")),
  };
}
