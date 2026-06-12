export interface PropertySpecs {
  sq_meters_gross: number | null;
  sq_meters_net: number | null;
  room_count: string | null;
  floor_number: string | null;
  total_floors: number | null;
  heating_type: string | null;
  building_age: number | null;
  usage_subtype: string | null;
}

export interface CommunitySpecs {
  is_in_complex: boolean;
  complex_name: string | null;
  amenities: string[];
}

export interface LocationSpecs {
  city: string;
  district: string;
  neighborhood?: string | null;
  subway_distance_m: number | null;
  highway_access: string | null;
  nearby_pois: string | null;
}

export interface DynamicProperties {
  property_specs: PropertySpecs;
  community_specs: CommunitySpecs;
  location_specs: LocationSpecs;
}
