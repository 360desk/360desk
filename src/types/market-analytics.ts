export interface MarketAnalyticsRow {
  id: string;
  district: string;
  property_type: string | null;
  recorded_date: string;
  total_listings_count: number;
  new_listings_count: number;
  created_at?: string;
}

export interface MarketTrendPoint {
  recorded_date: string;
  total_listings_count: number;
  new_listings_count: number;
}

export interface MarketTrendsResponse {
  district: string;
  property_type: string | null;
  history: MarketTrendPoint[];
  count: number;
  isEmpty: boolean;
}
