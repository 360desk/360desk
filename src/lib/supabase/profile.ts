import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isProfileComplete, type ProfileFormFields } from "@/lib/profile";
import {
  CORE_PROFILE_SELECT,
  enrichProfileFromAuth,
  fetchProfileRowSafely,
  isMissingProfileColumnError,
  PROFILE_SELECT_COLUMNS,
} from "@/lib/supabase/profile-query";
import {
  buildProfileSubscriptionSeed,
  resolveSignupTierFromMetadata,
} from "@/lib/subscription-packages";
import type { Profile } from "@/types/database";

export async function ensureVendorProfile(
  supabase: SupabaseClient,
  user: User
): Promise<string | null> {
  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    return selectError.message;
  }

  if (existing) {
    return null;
  }

  const signupTier = resolveSignupTierFromMetadata(
    user.user_metadata?.subscription_tier as string | undefined
  );
  const subscriptionSeed = buildProfileSubscriptionSeed(signupTier);

  const basePayload = {
    id: user.id,
    email: user.email ?? "",
    full_name: (user.user_metadata?.full_name as string) ?? "",
    role: "vendor",
    user_type: "individual",
    account_origin: "self",
    is_profile_completed: false,
    ...subscriptionSeed,
  };

  let { error: insertError } = await supabase.from("profiles").insert(basePayload);

  if (insertError && isMissingProfileColumnError(insertError.message)) {
    const { subscription_tier: _tier, max_listing_limit: _listings, max_image_per_listing: _images, account_type: _accountType, ...corePayload } =
      basePayload;

    const retry = await supabase.from("profiles").insert(corePayload);
    insertError = retry.error;
  }

  return insertError?.message ?? null;
}

export async function fetchVendorProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<{ profile: Profile | null; error: string | null }> {
  const { data, error } = await fetchProfileRowSafely(supabase, userId);

  if (error && !data) {
    return { profile: null, error };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    profile: data ? enrichProfileFromAuth(data, user) : null,
    error: null,
  };
}

function buildProfileUpdatePayload(fields: ProfileFormFields) {
  const isIndependentOffice = Boolean(fields.is_independent_office);

  return {
    full_name: fields.full_name.trim(),
    company_name: isIndependentOffice ? fields.company_name.trim() : null,
    ttbs_no: isIndependentOffice
      ? fields.company_ttbs_no.trim()
      : fields.ttbs_no.trim(),
    user_type: isIndependentOffice ? "office_admin" : "individual",
    account_type: isIndependentOffice ? "ofis" : "bireysel",
    professional_level: fields.professional_level,
    is_profile_completed: true,
    user_role: isIndependentOffice ? "broker_owner" : null,
  };
}

export async function updateVendorProfile(
  supabase: SupabaseClient,
  userId: string,
  fields: ProfileFormFields
): Promise<{ profile: Profile | null; error: string | null }> {
  const isIndependentOffice = Boolean(fields.is_independent_office);

  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      phone: fields.phone.trim(),
      is_independent_office: isIndependentOffice,
      individual_ttbs_no: isIndependentOffice ? fields.ttbs_no.trim() : null,
    },
  });

  if (metadataError) {
    return { profile: null, error: metadataError.message };
  }

  const payload = buildProfileUpdatePayload(fields);

  let data: Record<string, unknown> | null = null;
  let error: { message: string } | null = null;

  const primary = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userId)
    .select(PROFILE_SELECT_COLUMNS)
    .single();

  data = (primary.data as Record<string, unknown> | null) ?? null;
  error = primary.error;

  if (error && isMissingProfileColumnError(error.message)) {
    const {
      professional_level: _level,
      user_role: _hierarchyRole,
      ...fallbackPayload
    } = payload;
    const retry = await supabase
      .from("profiles")
      .update(fallbackPayload)
      .eq("id", userId)
      .select(CORE_PROFILE_SELECT)
      .single();

    data = (retry.data as Record<string, unknown> | null) ?? null;
    error = retry.error;
  }

  if (error) {
    return { profile: null, error: error.message };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = enrichProfileFromAuth(data ?? {}, user);

  if (!isProfileComplete(profile)) {
    return {
      profile: null,
      error: "Profil bilgileri eksik. Lütfen zorunlu alanları doldurun.",
    };
  }

  return { profile, error: null };
}
