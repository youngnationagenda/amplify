export interface RideData {
  ride_id: string;
  user_id: string; // Backend Rider ID (RID-KE-XXXXX)
  asset_id: string; // Backend Asset ID (YnakenyaV1-KE-XXXXXX)
  display_id: number; // UI Display ID (1-220)
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  duration_min: number;
  distance_km: number;
  idle_time_min: number;
  start_lat: number;
  start_lon: number;
  end_lat: number;
  end_lon: number;
  avg_speed_kmh: number;
  avg_moving_speed_kmh: number;
  max_speed_kmh: number;
  // Calculated Business Metrics
  carbon_credits_saved_kg: number;
  baseline_applied: number; // Now stores the Rate (gCO2/km) e.g., 280, 417.5
  revenue_kes: number; // Kenyan Shilling based on sample
  energy_kwh: number;
  traffic_condition: 'Free Flow' | 'Moderate' | 'Heavy Congestion';
}

export interface DailySummary {
  date: string;
  total_rides: number;
  active_bikes: number;
  total_distance_km: number;
  total_revenue: number;
  total_carbon_saved: number;
  fleet_size: number;
}

export interface RiderProfile {
  rider_id: string; // Backend Rider ID
  asset_id: string; // Backend Asset ID
  display_id: number; // UI Display ID (1-220)
  join_date: string;
  total_distance_km: number;
  total_revenue_kes: number;
  total_carbon_kg: number;
  total_energy_kwh: number; // New Field
  total_duration_min: number;
  trip_count: number;
  status: 'active' | 'inactive';
}

export type TimeRange = 'daily' | 'weekly' | 'monthly' | 'all';

// Constants for simulation
export const BASE_FLEET_MAY_2022 = 20;
export const FLEET_ADDITION_DEC_2023 = 100;
export const FLEET_ADDITION_JAN_2025 = 100;

export const DATE_MAY_5_2022 = new Date('2022-05-05').getTime();
export const DATE_DEC_1_2023 = new Date('2023-12-01').getTime();
export const DATE_JAN_1_2025 = new Date('2025-01-01').getTime();

// Solar Bonus Constant
export const SOLAR_OM_BONUS = 0.50; // kgCO2/kWh