import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildCategoryPath,
  type CategorySelection,
} from "@/lib/categories";
import { syncLegacyColumnsFromDynamicProperties } from "@/lib/dynamic-properties";
import {
  buildListingLocationColumns,
  isMissingGeoColumnError,
} from "@/lib/supabase/listing-location-payload";
import { fetchListingOwnershipRow } from "@/lib/supabase/listing-update-access";
import {
  listingMatchesEditScope,
  logListingUpdateDenied,
  resolveOwnershipContext,
} from "@/lib/supabase/ownership";
import {
  ensureVendorProfile,
  fetchVendorProfile,
} from "@/lib/supabase/profile";
import {
  resolveProfileImageLimit,
  validateListingCreationQuota,
} from "@/lib/supabase/profile-quota";
import {
  mapTasinmazNoDatabaseError,
  normalizeTasinmazNo,
  validateTasinmazNoForPublish,
} from "@/lib/validation/tasinmaz-no";
import type { DynamicProperties } from "@/types/dynamic-properties";
import type { AdStatus } from "@/types/database";

export type AdSaveMode = "draft" | "publish";

export interface ClassifiedAdInsertPayload {
  title: string;
  description: string | null;
  price: number;
  category: CategorySelection;
  contact_phone: string | null;
  images: string[];
  dynamic_properties: DynamicProperties;
  city_id?: string | null;
  district_id?: string | null;
  neighborhood_id?: string | null;
  full_address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  tasinmaz_no?: string | null;
}

export interface ClassifiedAdUpdatePayload extends ClassifiedAdInsertPayload {
  id: string;
}

export async function resolveAuthenticatedUserId(
  supabase: SupabaseClient,
  fallbackUserId?: string
): Promise<{ userId: string | null; error: string | null }> {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) {
    return { userId: null, error: sessionError.message };
  }

  const sessionUserId = sessionData.session?.user?.id;
  if (sessionUserId) {
    return { userId: sessionUserId, error: null };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { userId: null, error: userError.message };
  }

  if (user?.id) {
    return { userId: user.id, error: null };
  }

  if (fallbackUserId) {
    return { userId: fallbackUserId, error: null };
  }

  return { userId: null, error: "Oturum bulunamadı. Lütfen tekrar giriş yapın." };
}

function buildAdRecordPayload(
  data: ClassifiedAdInsertPayload,
  userId: string,
  mode: AdSaveMode,
  validatedTasinmazNo?: string
) {
  const categoryPath = buildCategoryPath(data.category);
  const legacy = syncLegacyColumnsFromDynamicProperties(data.dynamic_properties);
  const normalizedTasinmazNo =
    mode === "publish" && validatedTasinmazNo
      ? validatedTasinmazNo
      : normalizeTasinmazNo(data.tasinmaz_no);

  const status: AdStatus = mode === "draft" ? "draft" : "pending";
  const locationColumns = buildListingLocationColumns(data);

  return {
    vendor_id: userId,
    title: data.title,
    description: data.description,
    price: data.price,
    category: categoryPath,
    category_main: data.category.category_main,
    category_type: data.category.category_type,
    category_group: data.category.category_group,
    category_sub: data.category.category_sub,
    contact_phone: data.contact_phone,
    images: data.images,
    dynamic_properties: data.dynamic_properties,
    ...locationColumns,
    tasinmaz_no: normalizedTasinmazNo || null,
    ...legacy,
    status,
    is_archived: mode === "draft",
    ...(mode === "publish" ? { rejection_reason: null } : {}),
  };
}

function buildAdUpdateRecordPayload(
  data: ClassifiedAdInsertPayload,
  mode: AdSaveMode,
  validatedTasinmazNo?: string
) {
  const { vendor_id: _vendorId, ...updatePayload } = buildAdRecordPayload(
    data,
    "",
    mode,
    validatedTasinmazNo
  );

  return updatePayload;
}

function mapDatabaseError(error: { message: string; code?: string }): string {
  const friendly = mapTasinmazNoDatabaseError(error.message, error.code);
  return friendly ?? error.message;
}

async function resolvePublishValidation(
  supabase: SupabaseClient,
  tasinmazNo: string | null | undefined,
  mode: AdSaveMode,
  excludeAdId?: string
): Promise<
  | { ok: true; validatedTasinmazNo?: string }
  | { ok: false; error: string }
> {
  if (mode === "draft") {
    return { ok: true };
  }

  const validation = await validateTasinmazNoForPublish(
    supabase,
    tasinmazNo,
    excludeAdId
  );

  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  return { ok: true, validatedTasinmazNo: validation.value };
}

async function resolveAdOwnership(
  supabase: SupabaseClient,
  userId: string
): Promise<{ owner_id: string; managed_by_id: string }> {
  const { profile } = await fetchVendorProfile(supabase, userId);
  const { ownerId, managedById } = resolveOwnershipContext(profile, userId);

  return {
    owner_id: ownerId,
    managed_by_id: managedById,
  };
}

export async function saveClassifiedAd(
  supabase: SupabaseClient,
  data: ClassifiedAdInsertPayload,
  mode: AdSaveMode,
  fallbackUserId?: string
): Promise<{ error: string | null }> {
  const { userId, error: authError } = await resolveAuthenticatedUserId(
    supabase,
    fallbackUserId
  );

  if (authError || !userId) {
    return { error: authError ?? "Kullanıcı kimliği alınamadı." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const profileError = await ensureVendorProfile(supabase, user);
    if (profileError) {
      return { error: `Profil hatası: ${profileError}` };
    }
  }

  const publishValidation = await resolvePublishValidation(
    supabase,
    data.tasinmaz_no,
    mode
  );

  if (!publishValidation.ok) {
    return { error: publishValidation.error };
  }

  const { profile } = await fetchVendorProfile(supabase, userId);

  const quotaValidation = await validateListingCreationQuota(
    supabase,
    profile,
    userId
  );

  if (!quotaValidation.ok) {
    return { error: quotaValidation.error };
  }

  const maxImages = resolveProfileImageLimit(profile);
  if (data.images.length > maxImages) {
    return {
      error: `Paketiniz ilan başına en fazla ${maxImages} görsele izin veriyor.`,
    };
  }

  const ownership = await resolveAdOwnership(supabase, userId);

  const insertPayload = {
    ...buildAdRecordPayload(
      data,
      userId,
      mode,
      publishValidation.validatedTasinmazNo
    ),
    owner_id: ownership.owner_id,
    managed_by_id: ownership.managed_by_id,
  };

  const { error: insertError } = await supabase
    .from("classified_ads")
    .insert(insertPayload);

  if (insertError) {
    return { error: mapDatabaseError(insertError) };
  }

  return { error: null };
}

export async function updateClassifiedAd(
  supabase: SupabaseClient,
  data: ClassifiedAdUpdatePayload,
  mode: AdSaveMode,
  fallbackUserId?: string
): Promise<{ error: string | null }> {
  const { userId, error: authError } = await resolveAuthenticatedUserId(
    supabase,
    fallbackUserId
  );

  if (authError || !userId) {
    return { error: authError ?? "Kullanıcı kimliği alınamadı." };
  }

  const publishValidation = await resolvePublishValidation(
    supabase,
    data.tasinmaz_no,
    mode,
    data.id
  );

  if (!publishValidation.ok) {
    return { error: publishValidation.error };
  }

  const ownership = await resolveAdOwnership(supabase, userId);
  const updatePayload = buildAdUpdateRecordPayload(
    data,
    mode,
    publishValidation.validatedTasinmazNo
  );

  const { listing, error: listingLookupError } = await fetchListingOwnershipRow(
    supabase,
    data.id
  );

  if (listingLookupError) {
    logListingUpdateDenied("listing_lookup_failed", {
      userId,
      listingId: data.id,
      ownerId: ownership.owner_id,
      details: listingLookupError,
    });

    return { error: mapDatabaseError({ message: listingLookupError }) };
  }

  if (!listing) {
    logListingUpdateDenied("listing_not_visible", {
      userId,
      listingId: data.id,
      ownerId: ownership.owner_id,
    });

    return {
      error:
        "İlan güncellenemedi. Kayıt bulunamadı veya düzenleme yetkiniz yok.",
    };
  }

  if (!listingMatchesEditScope(listing, userId, ownership.owner_id)) {
    logListingUpdateDenied("ownership_scope_mismatch", {
      userId,
      listingId: data.id,
      ownerId: ownership.owner_id,
      listing,
    });

    return {
      error:
        "İlan güncellenemedi. Kayıt bulunamadı veya düzenleme yetkiniz yok.",
    };
  }

  async function runUpdate(payload: Record<string, unknown>) {
    return supabase
      .from("classified_ads")
      .update(payload)
      .eq("id", data.id)
      .select("id")
      .maybeSingle();
  }

  const { data: updatedRow, error: updateError } = await runUpdate(updatePayload);

  if (updateError) {
    if (isMissingGeoColumnError(updateError)) {
      const {
        full_address: _fullAddress,
        latitude: _latitude,
        longitude: _longitude,
        ...payloadWithoutGeo
      } = updatePayload;

      const { data: fallbackRow, error: fallbackError } =
        await runUpdate(payloadWithoutGeo);

      if (fallbackError) {
        logListingUpdateDenied("geo_fallback_update_failed", {
          userId,
          listingId: data.id,
          ownerId: ownership.owner_id,
          listing,
          details: fallbackError.message,
        });

        return { error: mapDatabaseError(fallbackError) };
      }

      if (!fallbackRow) {
        logListingUpdateDenied("geo_fallback_zero_rows", {
          userId,
          listingId: data.id,
          ownerId: ownership.owner_id,
          listing,
        });

        return {
          error:
            "İlan güncellenemedi. Kayıt bulunamadı veya düzenleme yetkiniz yok.",
        };
      }

      return {
        error:
          "Konum koordinatları kaydedilemedi. Lütfen veritabanı migrasyonu 019_add_listing_geo_columns uygulandıktan sonra tekrar deneyin.",
      };
    }

    logListingUpdateDenied("update_query_failed", {
      userId,
      listingId: data.id,
      ownerId: ownership.owner_id,
      listing,
      details: updateError.message,
    });

    return { error: mapDatabaseError(updateError) };
  }

  if (!updatedRow) {
    logListingUpdateDenied("update_zero_rows", {
      userId,
      listingId: data.id,
      ownerId: ownership.owner_id,
      listing,
    });

    return {
      error:
        "İlan güncellenemedi. Kayıt bulunamadı veya düzenleme yetkiniz yok.",
    };
  }

  return { error: null };
}

/** @deprecated Use saveClassifiedAd */
export async function insertClassifiedAd(
  supabase: SupabaseClient,
  data: ClassifiedAdInsertPayload,
  fallbackUserId?: string
): Promise<{ error: string | null }> {
  return saveClassifiedAd(supabase, data, "publish", fallbackUserId);
}
