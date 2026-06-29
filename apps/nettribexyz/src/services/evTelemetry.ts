// EV Telemetry Service
// Primary: window.EV_TELEMETRY (browser bridge)
// Fallback: REST API at https://api.ev-telemetry.co.ke/v1

const API_BASE = "https://api.ev-telemetry.co.ke/v1";

// Contract references (Celo Sepolia)
export const NTC_CONTRACT = "0xde6dBD244fBE84141a97DDe4043029D9c61767AE";
export const EV_ASSET_CONTRACT = "0xCdB1d119Eda8f7A04a820b5002ef2ea8b189bb18";
export const RIDER_WALLET = "0x57651B018Fa4aC931Ec585da641078988Ef1213B";

export interface TelemetryRider {
  wallet?: string;
  rider_id?: string;
  name?: string;
  asset_id?: string;
  total_carbon_credits: number;
  total_distance_km: number;
  efficiency_score: number;
  is_active: boolean;
  motorcycle_id?: string;
}

export interface TelemetrySummary {
  date: string;
  total_carbon_saved: number;
  total_distance_km: number;
  total_revenue: number;
  active_riders: number;
}

export interface TelemetryIngestPayload {
  asset_id: string;
  gps: { lat: number; lon: number };
  bms: { voltage: number; current: number; soc: number };
}

// Type for the browser-exposed telemetry bridge
interface EVTelemetryBridge {
  getRiders: () => TelemetryRider[];
  getSummaries: () => TelemetrySummary[];
}

declare global {
  interface Window {
    EV_TELEMETRY?: EVTelemetryBridge;
  }
}

/**
 * Check if the browser bridge is available
 */
export function isBridgeAvailable(): boolean {
  return typeof window !== "undefined" && !!window.EV_TELEMETRY;
}

/**
 * Get riders from the browser bridge or return null
 */
function getBridgeRiders(): TelemetryRider[] | null {
  if (isBridgeAvailable()) {
    try {
      const riders = window.EV_TELEMETRY!.getRiders();
      if (Array.isArray(riders) && riders.length > 0) return riders;
    } catch (e) {
      console.warn("[Telemetry] Bridge getRiders failed:", e);
    }
  }
  return null;
}

/**
 * Get daily summaries from the browser bridge or return null
 */
function getBridgeSummaries(): TelemetrySummary[] | null {
  if (isBridgeAvailable()) {
    try {
      const summaries = window.EV_TELEMETRY!.getSummaries();
      if (Array.isArray(summaries) && summaries.length > 0) return summaries;
    } catch (e) {
      console.warn("[Telemetry] Bridge getSummaries failed:", e);
    }
  }
  return null;
}

/**
 * Fetch fleet export from the REST API
 */
async function fetchFleetExport(apiKey?: string): Promise<TelemetryRider[] | null> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    const res = await fetch(
      `${API_BASE}/fleet/export?format=json`,
      { headers, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn("[Telemetry] REST fleet fetch failed:", e);
    return null;
  }
}

/**
 * Generate mock riders as ultimate fallback (existing behavior)
 */
function getMockRiders(): TelemetryRider[] {
  return [
    { rider_id: "r1", wallet: "0x57651B...1213B", name: "KE-Rider-Alpha", asset_id: "YnakenyaV1-KE-000001", total_carbon_credits: 48.2, total_distance_km: 1245, efficiency_score: 96, is_active: true, motorcycle_id: "NTC-MC-0012" },
    { rider_id: "r2", wallet: "0x3a82F1...8c4D", name: "MachakosEV", asset_id: "YnakenyaV1-KE-000002", total_carbon_credits: 42.7, total_distance_km: 1102, efficiency_score: 94, is_active: true, motorcycle_id: "NTC-MC-0008" },
    { rider_id: "r3", wallet: "0xb19C23...f1A2", name: "GreenRider_KE", asset_id: "YnakenyaV1-KE-000003", total_carbon_credits: 38.1, total_distance_km: 987, efficiency_score: 91, is_active: true, motorcycle_id: "NTC-MC-0031" },
    { rider_id: "r4", wallet: "0xD4e5F6...7890", name: "NairobiEco", asset_id: "YnakenyaV1-KE-000004", total_carbon_credits: 31.5, total_distance_km: 812, efficiency_score: 89, is_active: true, motorcycle_id: "NTC-MC-0005" },
    { rider_id: "r5", wallet: "0xA1b2C3...d4E5", name: "CeloRider01", asset_id: "YnakenyaV1-KE-000005", total_carbon_credits: 27.9, total_distance_km: 723, efficiency_score: 87, is_active: true, motorcycle_id: "NTC-MC-0019" },
    { rider_id: "r6", wallet: "0xF6a7B8...c9D0", name: "EV_Pioneer", asset_id: "YnakenyaV1-KE-000006", total_carbon_credits: 22.4, total_distance_km: 580, efficiency_score: 85, is_active: true, motorcycle_id: "NTC-MC-0027" },
    { rider_id: "r7", wallet: "0x1E2F3A...4B5C", name: "KisiiGreen", asset_id: "YnakenyaV1-KE-000007", total_carbon_credits: 18.6, total_distance_km: 482, efficiency_score: 83, is_active: true, motorcycle_id: "NTC-MC-0044" },
    { rider_id: "r8", wallet: "0x6D7E8F...9A0B", name: "MombasaEV", asset_id: "YnakenyaV1-KE-000008", total_carbon_credits: 14.2, total_distance_km: 368, efficiency_score: 80, is_active: true, motorcycle_id: "NTC-MC-0003" },
    { rider_id: "r9", wallet: "0xC1D2E3...F4A5", name: "RiderKE_09", asset_id: "YnakenyaV1-KE-000009", total_carbon_credits: 9.8, total_distance_km: 254, efficiency_score: 78, is_active: true, motorcycle_id: "NTC-MC-0051" },
    { rider_id: "r10", wallet: "0xB6C7D8...E9F0", name: "NewRider_KE", asset_id: "YnakenyaV1-KE-000010", total_carbon_credits: 5.1, total_distance_km: 132, efficiency_score: 75, is_active: false, motorcycle_id: "NTC-MC-0062" },
  ];
}

function getMockSummaries(): TelemetrySummary[] {
  const summaries: TelemetrySummary[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    summaries.push({
      date: d.toISOString().slice(0, 10),
      total_carbon_saved: Math.random() * 40 + 10,
      total_distance_km: Math.random() * 800 + 200,
      total_revenue: Math.random() * 2000 + 500,
      active_riders: Math.floor(Math.random() * 40 + 80),
    });
  }
  return summaries;
}

/**
 * Main entry: fetch riders using bridge → API → mock fallback
 */
export async function fetchRiders(apiKey?: string): Promise<{ riders: TelemetryRider[]; source: "bridge" | "api" | "mock" }> {
  // 1. Try browser bridge
  const bridgeRiders = getBridgeRiders();
  if (bridgeRiders) return { riders: bridgeRiders, source: "bridge" };

  // 2. Try REST API
  const apiRiders = await fetchFleetExport(apiKey);
  if (apiRiders) return { riders: apiRiders, source: "api" };

  // 3. Mock fallback
  return { riders: getMockRiders(), source: "mock" };
}

/**
 * Main entry: fetch summaries using bridge → mock fallback
 */
export function fetchSummaries(): { summaries: TelemetrySummary[]; source: "bridge" | "mock" } {
  const bridgeSummaries = getBridgeSummaries();
  if (bridgeSummaries) return { summaries: bridgeSummaries, source: "bridge" };
  return { summaries: getMockSummaries(), source: "mock" };
}

/**
 * Compute aggregate fleet stats from riders
 */
export function computeFleetStats(riders: TelemetryRider[]) {
  const activeRiders = riders.filter(r => r.is_active).length;
  const totalNTC = riders.reduce((s, r) => s + r.total_carbon_credits, 0);
  const totalDistance = riders.reduce((s, r) => s + r.total_distance_km, 0);
  const avgEfficiency = riders.length > 0 ? riders.reduce((s, r) => s + r.efficiency_score, 0) / riders.length : 0;
  return { activeRiders, totalNTC, totalDistance, avgEfficiency, creditsValue: totalNTC * 100 };
}
