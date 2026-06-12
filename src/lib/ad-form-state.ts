import {
  getDefaultCategorySelection,
  normalizeCategorySelection,
  type CategorySelection,
} from "@/lib/categories";
import { resolveDynamicProperties } from "@/lib/dynamic-properties";
import type { ClassifiedAd } from "@/types/database";
import type { DynamicProperties } from "@/types/dynamic-properties";

export function getCategoryFromAd(ad: ClassifiedAd): CategorySelection {
  if (ad.category_main && ad.category_type && ad.category_group) {
    return normalizeCategorySelection({
      category_main: ad.category_main,
      category_type: ad.category_type,
      category_group: ad.category_group,
      category_sub: ad.category_sub,
    });
  }

  return getDefaultCategorySelection();
}

export interface AdFormInitialState {
  category: CategorySelection;
  dynamicProperties: DynamicProperties;
  tasinmazNo: string;
  basic: {
    title: string;
    description: string;
    price: string;
    contact_phone: string;
  };
  existingImages: string[];
}

export function createFormStateFromAd(ad: ClassifiedAd): AdFormInitialState {
  return {
    category: getCategoryFromAd(ad),
    dynamicProperties: resolveDynamicProperties(ad),
    tasinmazNo: ad.tasinmaz_no ?? "",
    basic: {
      title: ad.title,
      description: ad.description ?? "",
      price: String(ad.price),
      contact_phone: ad.contact_phone ?? "",
    },
    existingImages: ad.images ?? [],
  };
}

export function getPublishButtonLabel(ad?: ClassifiedAd | null): string {
  if (ad?.status === "approved") {
    return "Yayınla";
  }

  return "Onaya Gönder";
}
