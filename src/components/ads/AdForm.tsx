"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createFormStateFromAd, getPublishButtonLabel } from "@/lib/ad-form-state";
import { createClient } from "@/lib/supabase/client";
import { saveClassifiedAd, type AdSaveMode } from "@/lib/supabase/ads";
import { buildListingLocationColumns } from "@/lib/supabase/listing-location-payload";
import { uploadAdImages } from "@/lib/supabase/storage";
import {
  getDefaultCategorySelection,
  type CategorySelection,
} from "@/lib/categories";
import {
  getDefaultDynamicProperties,
  getDefaultLocationSpecs,
} from "@/lib/dynamic-properties";
import {
  isTasinmazNoFieldError,
  validateTasinmazNoForPublish,
} from "@/lib/validation/tasinmaz-no";
import {
  createEmptyListingLocation,
  createListingLocationFromAd,
  validateListingLocation,
  type ListingLocationIds,
  type ListingLocationSelection,
} from "@/types/listing-location";
import type { DynamicProperties } from "@/types/dynamic-properties";
import type { ClassifiedAd } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { ImageUpload } from "@/components/ads/ImageUpload";
import { ListingLimitReachedModal } from "@/components/ads/ListingLimitReachedModal";
import { useProfileQuota } from "@/hooks/useProfileQuota";
import { CategoryCascadingSelect } from "@/components/ads/CategoryCascadingSelect";
import { FormSection } from "@/components/ads/form/FormSection";
import { FormStepNav } from "@/components/ads/form/FormStepNav";
import { PropertySpecsSection } from "@/components/ads/form/PropertySpecsSection";
import { CommunitySpecsSection } from "@/components/ads/form/CommunitySpecsSection";
import { LocationSpecsSection } from "@/components/ads/form/LocationSpecsSection";
import {
  createEmptyListingGeo,
  createListingGeoFromAd,
  resolveMapFocusTarget,
} from "@/lib/listing-geo";
import type { ListingGeoState, MapFocusTarget } from "@/types/listing-geo";

interface AdFormProps {
  vendorId: string;
  ad?: ClassifiedAd;
  syncedImages?: string[];
  onSuccess: () => void;
  onCancel?: () => void;
}

const FORM_STEPS = [
  { id: "category", label: "Kategori" },
  { id: "basic", label: "Temel" },
  { id: "property", label: "Yapı" },
  { id: "community", label: "Site" },
  { id: "location", label: "Konum" },
  { id: "media", label: "Görseller" },
] as const;

type FormStepId = (typeof FORM_STEPS)[number]["id"];

export function AdForm({
  vendorId,
  ad,
  syncedImages,
  onSuccess,
  onCancel,
}: AdFormProps) {
  const isEditing = Boolean(ad);
  const initialState = useMemo(
    () => (ad ? createFormStateFromAd(ad) : null),
    [ad]
  );

  const { user, profile } = useAuth();
  const { quota, loading: quotaLoading } = useProfileQuota();
  const supabase = useMemo(() => createClient(), []);
  const isListingQuotaBlocked = !isEditing && quota.isAtListingLimit;
  const [loading, setLoading] = useState(false);
  const [saveMode, setSaveMode] = useState<AdSaveMode | null>(null);
  const [error, setError] = useState("");
  const [tasinmazNoError, setTasinmazNoError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [activeStep, setActiveStep] = useState<FormStepId>("category");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(
    initialState?.existingImages ?? []
  );
  const activeVendorId = user?.id ?? vendorId;

  const [category, setCategory] = useState<CategorySelection>(
    initialState?.category ?? getDefaultCategorySelection()
  );

  const [dynamicProperties, setDynamicProperties] = useState<DynamicProperties>(
    initialState?.dynamicProperties ?? getDefaultDynamicProperties()
  );

  const [listingLocation, setListingLocation] = useState<ListingLocationIds>(
    () => createListingLocationFromAd(ad)
  );

  const [listingGeo, setListingGeo] = useState<ListingGeoState>(() =>
    createListingGeoFromAd(ad)
  );

  const [locationMapFocus, setLocationMapFocus] = useState<MapFocusTarget | null>(
    () => {
      if (!ad) {
        return null;
      }

      const locationIds = createListingLocationFromAd(ad);
      const locationSpecs =
        initialState?.dynamicProperties.location_specs ??
        getDefaultDynamicProperties().location_specs;

      return resolveMapFocusTarget(locationIds, {
        city_name: locationSpecs.city,
      });
    }
  );

  const [tasinmazNo, setTasinmazNo] = useState(initialState?.tasinmazNo ?? "");

  const [basic, setBasic] = useState(
    initialState?.basic ?? {
      title: "",
      description: "",
      price: "",
      contact_phone: "",
    }
  );

  const profilePhone = useMemo(() => {
    const fromProfile = profile?.phone?.trim();
    if (fromProfile) {
      return fromProfile;
    }

    const metadataPhone = user?.user_metadata?.phone;
    return typeof metadataPhone === "string" ? metadataPhone.trim() : "";
  }, [profile?.phone, user?.user_metadata?.phone]);

  useEffect(() => {
    if (!isEditing) {
      setBasic((current) => ({
        ...current,
        contact_phone: profilePhone,
      }));
    }
  }, [isEditing, profilePhone]);

  const stepIndex = FORM_STEPS.findIndex((s) => s.id === activeStep);
  const isLastStep = stepIndex === FORM_STEPS.length - 1;
  const publishLabel = getPublishButtonLabel(ad);

  const handleCategoryChange = (next: CategorySelection) => {
    setCategory(next);
    setDynamicProperties((prev) => ({
      ...prev,
      property_specs: {
        ...prev.property_specs,
        usage_subtype: next.category_sub,
      },
    }));
  };

  const resetForm = () => {
    if (isEditing && ad) {
      const next = createFormStateFromAd(ad);
      setCategory(next.category);
      setDynamicProperties(next.dynamicProperties);
      setListingLocation(createListingLocationFromAd(ad));
      setListingGeo(createListingGeoFromAd(ad));
      setLocationMapFocus(
        resolveMapFocusTarget(createListingLocationFromAd(ad), {
          city_name: next.dynamicProperties.location_specs.city,
        })
      );
      setBasic(next.basic);
      setTasinmazNo(next.tasinmazNo);
      setExistingImages(next.existingImages);
    } else {
      setCategory(getDefaultCategorySelection());
      setDynamicProperties(getDefaultDynamicProperties());
      setListingLocation(createEmptyListingLocation());
      setListingGeo(createEmptyListingGeo());
      setLocationMapFocus(null);
      setBasic({ title: "", description: "", price: "", contact_phone: "" });
      setTasinmazNo("");
      setExistingImages([]);
    }

    setTasinmazNoError("");
    setLocationError("");
    setImageFiles([]);
    setActiveStep("category");
  };

  const goNext = () => {
    if (!isLastStep) {
      setActiveStep(FORM_STEPS[stepIndex + 1].id);
    }
  };

  const goPrev = () => {
    if (stepIndex > 0) {
      setActiveStep(FORM_STEPS[stepIndex - 1].id);
    }
  };

  const applyTasinmazFieldError = (message: string) => {
    if (!isTasinmazNoFieldError(message)) {
      return;
    }

    setTasinmazNoError(message);
    setActiveStep("property");
  };

  const handleListingLocationChange = (selection: ListingLocationSelection) => {
    setLocationError("");
    setListingLocation({
      city_id: selection.city_id,
      district_id: selection.district_id,
      neighborhood_id: selection.neighborhood_id,
    });
    if (selection.map_focus) {
      setLocationMapFocus(selection.map_focus);
    }
    setDynamicProperties((prev) => ({
      ...prev,
      location_specs: {
        ...prev.location_specs,
        city: selection.city_name,
        district: selection.district_name,
        neighborhood: selection.neighborhood_name,
      },
    }));
  };

  const validateBeforeSave = async (mode: AdSaveMode): Promise<boolean> => {
    if (mode === "draft") {
      return true;
    }

    const locationValidation = validateListingLocation(listingLocation);

    if (locationValidation) {
      setLocationError(locationValidation);
      setError(locationValidation);
      setActiveStep("location");
      return false;
    }

    const validation = await validateTasinmazNoForPublish(
      supabase,
      tasinmazNo,
      ad?.id
    );

    if (!validation.ok) {
      setError(validation.error);
      applyTasinmazFieldError(validation.error);
      return false;
    }

    return true;
  };

  const handleSave = async (mode: AdSaveMode) => {
    setError("");
    setTasinmazNoError("");

    if (!activeVendorId) {
      setError("Kullanıcı kimliği bulunamadı. Lütfen tekrar giriş yapın.");
      return;
    }

    setLoading(true);
    setSaveMode(mode);

    const isValid = await validateBeforeSave(mode);
    if (!isValid) {
      setLoading(false);
      setSaveMode(null);
      return;
    }

    const { urls, error: uploadError } = await uploadAdImages(
      supabase,
      activeVendorId,
      imageFiles
    );

    if (uploadError) {
      setError(`Görsel yükleme hatası: ${uploadError}`);
      setLoading(false);
      setSaveMode(null);
      return;
    }

    const payload: DynamicProperties = {
      ...dynamicProperties,
      property_specs: {
        ...dynamicProperties.property_specs,
        usage_subtype: category.category_sub,
      },
    };

    const locationColumns = buildListingLocationColumns({
      city_id: listingLocation.city_id,
      district_id: listingLocation.district_id,
      neighborhood_id: listingLocation.neighborhood_id,
      full_address: listingGeo.full_address,
      latitude: listingGeo.latitude,
      longitude: listingGeo.longitude,
    });

    const formPayload = {
      title: basic.title.trim(),
      description: basic.description.trim() || null,
      price: parseFloat(basic.price),
      category,
      contact_phone: basic.contact_phone.trim() || null,
      images: syncedImages ?? [...existingImages, ...urls],
      dynamic_properties: payload,
      ...locationColumns,
      tasinmaz_no: tasinmazNo,
    };

    let saveError: string | null = null;

    if (isEditing && ad) {
      const response = await fetch("/api/listings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formPayload,
          id: ad.id,
          mode,
        }),
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        saveError = result.error ?? "İlan güncellenemedi.";
      }
    } else {
      const result = await saveClassifiedAd(
        supabase,
        formPayload,
        mode,
        activeVendorId
      );
      saveError = result.error;
    }

    if (saveError) {
      setError(saveError);
      applyTasinmazFieldError(saveError);
    } else {
      if (!isEditing) {
        resetForm();
      }
      onSuccess();
    }

    setLoading(false);
    setSaveMode(null);
  };

  const handleStepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLastStep) {
      goNext();
    }
  };

  const handleTasinmazNoChange = (value: string) => {
    setTasinmazNo(value);
    if (tasinmazNoError) {
      setTasinmazNoError("");
    }
    if (error) {
      setError("");
    }
  };

  if (!isEditing && quotaLoading) {
    return (
      <Card className="py-12 text-center">
        <p className="text-cream/50">Paket kotası kontrol ediliyor...</p>
      </Card>
    );
  }

  if (isListingQuotaBlocked) {
    return (
      <>
        <ListingLimitReachedModal
          open
          currentCount={quota.currentListingCount}
          maxLimit={quota.maxListingLimit}
        />
        <Card className="border-primary/20 bg-gradient-to-br from-charcoal via-charcoal-light to-charcoal py-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            İlan Oluşturma Durduruldu
          </p>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-cream/65">
            Aktif ilan kotanız doldu. Yeni portföy eklemek için paketinizi
            yükseltin.
          </p>
        </Card>
      </>
    );
  }

  return (
    <Card>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-cream">
            {isEditing ? "İlanı Düzenle" : "Yeni Emlak İlanı"}
          </h2>
          <p className="text-sm text-cream/50 mt-1">
            {isEditing
              ? "Değişiklikleri taslak olarak kaydedin veya onaya gönderin."
              : "Kategori ağacı ve bölümlü JSONB özelliklerle profesyonel ilan oluşturun"}
          </p>
        </div>
        {isEditing && onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Vazgeç
          </Button>
        )}
      </div>

      <FormStepNav
        steps={[...FORM_STEPS]}
        activeStep={activeStep}
        onStepClick={(id) => setActiveStep(id as FormStepId)}
      />

      <form onSubmit={handleStepSubmit} className="flex flex-col gap-8 mt-6">
        {activeStep === "category" && (
          <FormSection
            title="Emlak Kategorisi"
            description="CSV matrix'e göre dinamik cascading seçim"
          >
            <CategoryCascadingSelect
              value={category}
              onChange={handleCategoryChange}
              disabled={loading}
            />
          </FormSection>
        )}

        {activeStep === "basic" && (
          <FormSection title="Temel Bilgiler">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="İlan Başlığı"
                  value={basic.title}
                  onChange={(e) =>
                    setBasic({ ...basic, title: e.target.value })
                  }
                  required
                  placeholder="Örn: Nilüfer'de 3+1 Satılık Rezidans"
                />
              </div>
              <div className="sm:col-span-2">
                <Textarea
                  label="Açıklama"
                  value={basic.description}
                  onChange={(e) =>
                    setBasic({ ...basic, description: e.target.value })
                  }
                  placeholder="Emlak detaylarını yazın..."
                />
              </div>
              <Input
                label="Fiyat (₺)"
                type="number"
                min="0"
                step="1"
                value={basic.price}
                onChange={(e) =>
                  setBasic({ ...basic, price: e.target.value })
                }
                required
                placeholder="0"
              />
              <Input
                label="İletişim Telefonu"
                value={basic.contact_phone}
                readOnly={!isEditing}
                disabled={!isEditing}
                placeholder={profilePhone || "05XX XXX XX XX"}
                className={!isEditing ? "cursor-not-allowed opacity-80" : ""}
              />
              {!isEditing && (
                <p className="sm:col-span-2 text-xs text-cream/45">
                  İlan iletişim telefonu, doğrulanmış profil numaranızdan
                  otomatik alınır ve değiştirilemez.
                </p>
              )}
            </div>
          </FormSection>
        )}

        {activeStep === "property" && (
          <PropertySpecsSection
            category={category}
            value={dynamicProperties.property_specs}
            tasinmazNo={tasinmazNo}
            onTasinmazNoChange={handleTasinmazNoChange}
            tasinmazNoError={tasinmazNoError}
            onChange={(property_specs) =>
              setDynamicProperties({ ...dynamicProperties, property_specs })
            }
            disabled={loading}
          />
        )}

        {activeStep === "community" && (
          <CommunitySpecsSection
            category={category}
            value={dynamicProperties.community_specs}
            onChange={(community_specs) =>
              setDynamicProperties({ ...dynamicProperties, community_specs })
            }
            disabled={loading}
          />
        )}

        {activeStep === "location" && (
          <LocationSpecsSection
            value={dynamicProperties.location_specs}
            locationIds={listingLocation}
            onLocationChange={handleListingLocationChange}
            geo={listingGeo}
            onGeoChange={setListingGeo}
            mapFocus={locationMapFocus}
            onChange={(location_specs) =>
              setDynamicProperties({
                ...dynamicProperties,
                location_specs: {
                  ...getDefaultLocationSpecs(location_specs.district),
                  ...location_specs,
                },
              })
            }
            disabled={loading}
            locationError={locationError}
          />
        )}

        {activeStep === "media" && (
          <FormSection title="Görseller">
            {isEditing && syncedImages ? (
              <p className="text-sm leading-relaxed text-cream/55">
                Görselleri sayfanın üstündeki{" "}
                <span className="font-medium text-cream/75">İlan Galerisi</span>{" "}
                bölümünden yönetebilirsiniz. Kapak fotoğrafı galerideki ilk
                sıradaki görseldir.
              </p>
            ) : (
              <ImageUpload
                files={imageFiles}
                onChange={setImageFiles}
                disabled={loading}
                maxImages={quota.maxImagePerListing}
              />
            )}
          </FormSection>
        )}

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          {stepIndex > 0 && (
            <Button
              type="button"
              variant="secondary"
              onClick={goPrev}
              disabled={loading}
            >
              Geri
            </Button>
          )}

          {!isLastStep ? (
            <Button
              type="submit"
              disabled={loading || !activeVendorId}
              className="flex-1"
            >
              İleri
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="secondary"
                disabled={loading || !activeVendorId}
                className="flex-1"
                onClick={() => handleSave("draft")}
              >
                {loading && saveMode === "draft"
                  ? "Kaydediliyor..."
                  : "Taslak Olarak Kaydet"}
              </Button>
              <Button
                type="button"
                disabled={loading || !activeVendorId}
                className="flex-1"
                onClick={() => handleSave("publish")}
              >
                {loading && saveMode === "publish"
                  ? "Gönderiliyor..."
                  : publishLabel}
              </Button>
            </>
          )}
        </div>
      </form>
    </Card>
  );
}
