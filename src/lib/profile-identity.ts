import type { Profile, ProfessionalAccountType } from "@/types/database";

export type ProfileImageKind = "avatar" | "logo";

export const OFFICE_ACCOUNT_TYPES: ProfessionalAccountType[] = [
  "ofis",
  "franchise",
  "master_franchise",
];

type AccountTypeSource = {
  account_type?: ProfessionalAccountType | null;
  organization_role?: Profile["organization_role"];
  is_independent_office?: boolean;
};

export function resolveAccountType(
  profile: AccountTypeSource | null
): ProfessionalAccountType {
  if (profile?.account_type) {
    return profile.account_type;
  }

  if (profile?.organization_role === "franchise_admin") {
    return "franchise";
  }

  if (
    profile?.organization_role === "office_admin" ||
    profile?.is_independent_office
  ) {
    return "ofis";
  }

  return "bireysel";
}

export function isIndividualAccount(
  accountType: ProfessionalAccountType
): boolean {
  return accountType === "bireysel";
}

export function isOfficeStyleAccount(
  accountType: ProfessionalAccountType
): boolean {
  return OFFICE_ACCOUNT_TYPES.includes(accountType);
}

export function resolveProfileImageKind(
  accountType: ProfessionalAccountType
): ProfileImageKind {
  return isIndividualAccount(accountType) ? "avatar" : "logo";
}

export function getProfileImageUploadLabel(
  accountType: ProfessionalAccountType
): string {
  return isIndividualAccount(accountType)
    ? "Profil Fotoğrafı Yükle"
    : "Ofis Logosu Yükle";
}

export function getCorporateTitleTag(
  accountType: ProfessionalAccountType
): string {
  switch (accountType) {
    case "bireysel":
      return "PROFESYONEL";
    case "ofis":
      return "BAĞIMSIZ OFİS";
    case "franchise":
      return "FRANCHISE";
    case "master_franchise":
      return "MASTER FRANCHISE";
    default:
      return "PROFESYONEL";
  }
}

export function getProfileImageUrl(
  profile: (AccountTypeSource & {
    avatar_url?: string | null;
    logo_url?: string | null;
  }) | null
): string | null {
  if (!profile) {
    return null;
  }

  const accountType = resolveAccountType(profile);

  if (isIndividualAccount(accountType)) {
    return profile.avatar_url?.trim() || profile.logo_url?.trim() || null;
  }

  return profile.logo_url?.trim() || profile.avatar_url?.trim() || null;
}

export function buildProfileImageUpdatePayload(
  accountType: ProfessionalAccountType,
  publicUrl: string
): { avatar_url: string | null; logo_url: string | null } {
  if (isIndividualAccount(accountType)) {
    return {
      avatar_url: publicUrl,
      logo_url: null,
    };
  }

  return {
    avatar_url: null,
    logo_url: publicUrl,
  };
}
