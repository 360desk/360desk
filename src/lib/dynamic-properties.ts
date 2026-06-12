import type { CategorySelection } from "@/lib/categories";
import { DEFAULT_CITY } from "@/lib/format";
import type {
  CommunitySpecs,
  DynamicProperties,
  LocationSpecs,
  PropertySpecs,
} from "@/types/dynamic-properties";

export const AMENITY_OPTIONS = [
  { id: "security", label: "7/24 Güvenlik" },
  { id: "parking", label: "Otopark" },
  { id: "pool", label: "Havuz" },
  { id: "gym", label: "Fitness / Spor Salonu" },
  { id: "concierge", label: "Concierge" },
] as const;

export function getDefaultPropertySpecs(): PropertySpecs {
  return {
    sq_meters_gross: null,
    sq_meters_net: null,
    room_count: null,
    floor_number: null,
    total_floors: null,
    heating_type: null,
    building_age: null,
    usage_subtype: null,
  };
}

export function getDefaultCommunitySpecs(): CommunitySpecs {
  return {
    is_in_complex: false,
    complex_name: null,
    amenities: [],
  };
}

export function getDefaultLocationSpecs(district = ""): LocationSpecs {
  return {
    city: "",
    district,
    neighborhood: "",
    subway_distance_m: null,
    highway_access: null,
    nearby_pois: null,
  };
}

export function getDefaultDynamicProperties(district = ""): DynamicProperties {
  return {
    property_specs: getDefaultPropertySpecs(),
    community_specs: getDefaultCommunitySpecs(),
    location_specs: getDefaultLocationSpecs(district),
  };
}

export function showRoomCountField(category: CategorySelection): boolean {
  return category.category_group === "KONUT";
}

export function showFloorFields(category: CategorySelection): boolean {
  return ["KONUT", "OFİS", "TİCARİ ALAN", "ENDÜSTRİYEL ALAN", "BİNA"].includes(
    category.category_group
  );
}

export function showHeatingField(category: CategorySelection): boolean {
  return ["KONUT", "OFİS", "TİCARİ ALAN", "BİNA"].includes(
    category.category_group
  );
}

export function showBuildingAgeField(category: CategorySelection): boolean {
  return ["KONUT", "OFİS", "TİCARİ ALAN", "BİNA", "ENDÜSTRİYEL ALAN"].includes(
    category.category_group
  );
}

export function showCommunityFields(category: CategorySelection): boolean {
  return (
    ["KONUT", "OFİS", "DEVRE MÜLK"].includes(category.category_group) ||
    category.category_type === "KAT KARŞILIĞI"
  );
}

export function showSqMetersFields(): boolean {
  return true;
}

export function showUsageSubtypeField(category: CategorySelection): boolean {
  return (
    !!category.category_sub &&
    ["OFİS", "TİCARİ ALAN", "ENDÜSTRİYEL ALAN", "DEVRE MÜLK", "ARSA"].includes(
      category.category_group
    )
  );
}

export function parseDynamicProperties(
  raw: unknown
): DynamicProperties | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Partial<DynamicProperties>;
  if (!obj.property_specs || !obj.community_specs || !obj.location_specs) {
    return null;
  }
  return obj as DynamicProperties;
}

export function resolveDynamicProperties(ad: {
  dynamic_properties?: unknown;
  sq_meters_gross?: number | null;
  sq_meters_net?: number | null;
  room_count?: string | null;
  floor_number?: string | null;
  total_floors?: number | null;
  heating_type?: string | null;
  building_age?: number | null;
  category_sub?: string | null;
  location?: string | null;
}): DynamicProperties {
  const parsed = parseDynamicProperties(ad.dynamic_properties);
  if (parsed) return parsed;

  const district = ad.location?.split(",")[1]?.trim() ?? "";
  return {
    property_specs: {
      sq_meters_gross: ad.sq_meters_gross ?? null,
      sq_meters_net: ad.sq_meters_net ?? null,
      room_count: ad.room_count ?? null,
      floor_number: ad.floor_number ?? null,
      total_floors: ad.total_floors ?? null,
      heating_type: ad.heating_type ?? null,
      building_age: ad.building_age ?? null,
      usage_subtype: ad.category_sub ?? null,
    },
    community_specs: getDefaultCommunitySpecs(),
    location_specs: {
      city: DEFAULT_CITY,
      district,
      neighborhood: null,
      subway_distance_m: null,
      highway_access: null,
      nearby_pois: null,
    },
  };
}

export function buildLocationString(specs: LocationSpecs): string {
  return [specs.city, specs.district, specs.neighborhood]
    .filter(Boolean)
    .join(", ");
}

export function syncLegacyColumnsFromDynamicProperties(
  dynamic: DynamicProperties
) {
  const p = dynamic.property_specs;
  return {
    sq_meters_gross: p.sq_meters_gross,
    sq_meters_net: p.sq_meters_net,
    room_count: p.room_count,
    floor_number: p.floor_number,
    total_floors: p.total_floors,
    heating_type: p.heating_type,
    building_age: p.building_age,
    location: buildLocationString(dynamic.location_specs),
  };
}
