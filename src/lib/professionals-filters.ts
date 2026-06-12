import { isLocationAllValue } from "@/lib/location-params";
import { LOCATION_ALL_VALUE } from "@/types/location";
import {
  PROFESSIONAL_ACCOUNT_TYPES,
  type ProfessionalAccountType,
  type ProfessionalsSearchFilters,
} from "@/types/professionals-search";

export interface ProfessionalsFilterState {
  accountType: ProfessionalAccountType | null;
  cityId: string;
  districtId: string;
  neighborhoodId: string;
}

export const DEFAULT_PROFESSIONALS_FILTERS: ProfessionalsFilterState = {
  accountType: null,
  cityId: LOCATION_ALL_VALUE,
  districtId: LOCATION_ALL_VALUE,
  neighborhoodId: LOCATION_ALL_VALUE,
};

function parseLocationFilterParam(
  params: URLSearchParams,
  key: "city_id" | "district_id" | "neighborhood_id"
): string {
  const value = params.get(key)?.trim();
  return value && !isLocationAllValue(value) ? value : LOCATION_ALL_VALUE;
}

function parseAccountType(
  value: string | null
): ProfessionalAccountType | null {
  if (!value?.trim()) {
    return null;
  }

  const normalized = value.trim().toLowerCase() as ProfessionalAccountType;
  return PROFESSIONAL_ACCOUNT_TYPES.includes(normalized) ? normalized : null;
}

export function parseProfessionalsFiltersFromParams(
  params: URLSearchParams
): ProfessionalsFilterState {
  return {
    accountType: parseAccountType(params.get("account_type")),
    cityId: parseLocationFilterParam(params, "city_id"),
    districtId: parseLocationFilterParam(params, "district_id"),
    neighborhoodId: parseLocationFilterParam(params, "neighborhood_id"),
  };
}

function appendLocationParam(
  params: URLSearchParams,
  key: "city_id" | "district_id" | "neighborhood_id",
  value: string
) {
  if (!isLocationAllValue(value)) {
    params.set(key, value);
  }
}

export function professionalsFiltersToSearchParams(
  filters: ProfessionalsFilterState
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.accountType) {
    params.set("account_type", filters.accountType);
  }

  appendLocationParam(params, "city_id", filters.cityId);
  appendLocationParam(params, "district_id", filters.districtId);
  appendLocationParam(params, "neighborhood_id", filters.neighborhoodId);

  return params;
}

export function professionalsFiltersToApiQuery(
  filters: ProfessionalsFilterState
): URLSearchParams {
  const params = professionalsFiltersToSearchParams(filters);
  params.set("limit", "100");
  return params;
}

export function toApiFilters(
  filters: ProfessionalsFilterState
): ProfessionalsSearchFilters {
  return {
    account_type: filters.accountType,
    city_id: isLocationAllValue(filters.cityId) ? null : filters.cityId,
    district_id: isLocationAllValue(filters.districtId)
      ? null
      : filters.districtId,
    neighborhood_id: isLocationAllValue(filters.neighborhoodId)
      ? null
      : filters.neighborhoodId,
  };
}
