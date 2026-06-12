import { createClient } from "@/lib/supabase/server";
import { enrichLocationNodeCoordinates } from "@/lib/turkey-locations/location-coordinates";
import type { LocationNode, LocationTreeLevel } from "@/types/location";

const TURKISH_COLLATOR = new Intl.Collator("tr-TR", {
  sensitivity: "base",
  numeric: true,
});

function sortByTurkishName(items: LocationNode[]): LocationNode[] {
  return [...items].sort((a, b) => TURKISH_COLLATOR.compare(a.name, b.name));
}

function withCoordinates(
  node: LocationNode,
  level: LocationTreeLevel,
  parentIds?: { cityId?: string | null; districtId?: string | null }
): LocationNode {
  const coordinates = enrichLocationNodeCoordinates(node, level, parentIds);

  if (!coordinates) {
    return node;
  }

  return {
    ...node,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
  };
}

export async function fetchCities(): Promise<{
  items: LocationNode[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cities")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    console.error("fetchCities:", error.message);
    return { items: [], error: error.message };
  }

  const items = sortByTurkishName(
    ((data ?? []) as LocationNode[]).map((node) => withCoordinates(node, "cities"))
  );

  return { items, error: null };
}

export async function fetchDistrictsByCity(
  cityId: string
): Promise<{ items: LocationNode[]; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("districts")
    .select("id, name")
    .eq("city_id", cityId)
    .order("name", { ascending: true });

  if (error) {
    console.error("fetchDistrictsByCity:", error.message);
    return { items: [], error: error.message };
  }

  const items = sortByTurkishName(
    ((data ?? []) as LocationNode[]).map((node) =>
      withCoordinates(node, "districts", { cityId })
    )
  );

  return {
    items,
    error: null,
  };
}

export async function fetchNeighborhoodsByDistrict(
  districtId: string
): Promise<{ items: LocationNode[]; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("neighborhoods")
    .select("id, name")
    .eq("district_id", districtId)
    .order("name", { ascending: true });

  if (error) {
    console.error("fetchNeighborhoodsByDistrict:", error.message);
    return { items: [], error: error.message };
  }

  const items = sortByTurkishName(
    ((data ?? []) as LocationNode[]).map((node) =>
      withCoordinates(node, "neighborhoods", { districtId })
    )
  );

  return {
    items,
    error: null,
  };
}

export async function resolveLocationTree(
  cityId: string | null,
  districtId: string | null
): Promise<{
  level: LocationTreeLevel;
  items: LocationNode[];
  error: string | null;
}> {
  if (districtId) {
    const { items, error } = await fetchNeighborhoodsByDistrict(districtId);
    return { level: "neighborhoods", items, error };
  }

  if (cityId) {
    const { items, error } = await fetchDistrictsByCity(cityId);
    return { level: "districts", items, error };
  }

  const { items, error } = await fetchCities();
  return { level: "cities", items, error };
}
