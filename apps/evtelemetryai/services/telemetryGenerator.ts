import { RideData, DailySummary, RiderProfile, DATE_MAY_5_2022, DATE_DEC_1_2023, DATE_JAN_1_2025, SOLAR_OM_BONUS } from '../types';
import { SeededRNG, createSeed } from '../utils/seededRng';

// --- CONFIGURATION ---
const BASE_LAT = -1.2921;
const BASE_LON = 36.8219;
const TOTAL_FLEET_SIZE = 220;

// Caches
const cachedSummaries: DailySummary[] = [];
const cachedRiderProfiles: Map<number, RiderProfile> = new Map();

// --- HELPERS ---

const getActiveFleetSize = (time: number): number => {
  if (time < DATE_MAY_5_2022) return 0;
  if (time < DATE_DEC_1_2023) return 20;
  if (time < DATE_JAN_1_2025) return 120;
  return TOTAL_FLEET_SIZE;
};

const getTierRate = (odometerKm: number): number => {
    // 0 – 10,000 km: Base (250) + Solar (30) = 280
    if (odometerKm <= 10000) return 280.0;
    
    // 10,001 – 20,000 km: Base+10% (275) + Solar (30) = 305
    if (odometerKm <= 20000) return 305.0;
    
    // 20,001 – 30,000 km: Base+25% (312.5) + Solar (30) = 342.5
    if (odometerKm <= 30000) return 342.5;
    
    // 30,001 – 40,000 km: Base+35% (337.5) + Solar (30) = 367.5
    if (odometerKm <= 40000) return 367.5;
    
    // 40,001 – 50,000 km: Base+45% (362.5) + Solar (30) = 392.5
    if (odometerKm <= 50000) return 392.5;
    
    // 50,000+ km: Base+55% (387.5) + Solar (30) = 417.5
    return 417.5;
};

// --- PHYSICS & LOGIC ---

/**
 * Calculates Energy Consumption (kWh) based on physics.
 */
const calculateEnergyConsumption = (
    distanceKm: number, 
    avgSpeedKmh: number, 
    idleTimeMin: number,
    rng: SeededRNG
): number => {
    const baseEnergy = distanceKm * 0.035;
    let dragPenalty = 0;
    if (avgSpeedKmh > 45) {
        const excess = avgSpeedKmh - 45;
        dragPenalty = distanceKm * (excess * excess * 0.00005);
    }
    let accelerationPenalty = 0;
    if (avgSpeedKmh < 20) {
        accelerationPenalty = distanceKm * 0.025; 
    } else if (avgSpeedKmh < 35) {
        accelerationPenalty = distanceKm * 0.01;
    }
    const idleDrain = (idleTimeMin / 60) * 0.1;
    const payloadFactor = rng.nextFloat(0.95, 1.2);

    const totalKwh = (baseEnergy + dragPenalty + accelerationPenalty + idleDrain) * payloadFactor;
    return parseFloat(totalKwh.toFixed(3)); 
};

// --- CORE GENERATION ENGINE ---

type TimeWindow = 'MORNING_PEAK' | 'LUNCH_RUSH' | 'AFTERNOON_LULL' | 'EVENING_COMMUTE' | 'NIGHT_ORDERS';

const getTimeWindow = (hour: number): TimeWindow => {
    if (hour >= 6 && hour < 10) return 'MORNING_PEAK';     
    if (hour >= 11 && hour < 14) return 'LUNCH_RUSH';      
    if (hour >= 14 && hour < 16) return 'AFTERNOON_LULL';  
    if (hour >= 16 && hour < 20) return 'EVENING_COMMUTE'; 
    return 'NIGHT_ORDERS';                                 
};

const generateDailyTripsForRider = (
    riderIdx: number, 
    date: Date, 
    riderProfile: RiderProfile,
    isLiveCheck: boolean = false,
    now: Date = new Date()
): RideData[] => {
    const dateStr = date.toISOString().split('T')[0];
    const seed = createSeed(`${riderIdx}-${dateStr}`); 
    const rng = new SeededRNG(seed);

    const trips: RideData[] = [];
    const utilizationRate = rng.nextFloat(0.75, 0.98);
    if (rng.next() > utilizationRate) return [];

    // Estimate historical odometer for this specific date
    // We linearly interpolate based on time elapsed since join
    const joinTime = new Date(riderProfile.join_date).getTime();
    const nowTime = now.getTime();
    const targetTime = date.getTime();
    
    // Prevent division by zero or future dates logic issues
    let historicalOdometer = 0;
    if (targetTime >= joinTime) {
        const totalDuration = Math.max(1, nowTime - joinTime);
        const elapsed = targetTime - joinTime;
        const progress = Math.min(1, elapsed / totalDuration);
        historicalOdometer = riderProfile.total_distance_km * progress;
    }

    const tripCount = rng.nextInt(3, 8); 
    const potentialStartHours: number[] = [];
    
    for(let i=0; i<tripCount; i++) {
        const r = rng.next();
        let hour: number;
        if (r < 0.15) hour = rng.nextInt(6, 9);        
        else if (r < 0.55) hour = rng.nextInt(11, 13); 
        else if (r < 0.65) hour = rng.nextInt(14, 15); 
        else if (r < 0.90) hour = rng.nextInt(16, 19); 
        else hour = rng.nextInt(20, 21);               
        potentialStartHours.push(hour);
    }
    potentialStartHours.sort((a,b) => a - b);

    // Spatial Consistency
    const homeLat = BASE_LAT + rng.nextFloat(-0.08, 0.08);
    const homeLon = BASE_LON + rng.nextFloat(-0.08, 0.08);
    let currentLat = homeLat;
    let currentLon = homeLon;
    let lastEndTimeMin = 0; 

    // We track daily distance accumulation to slightly adjust odometer trip-by-trip
    let dayAccumulatedKm = 0;

    for (let t = 0; t < tripCount; t++) {
        const plannedHour = potentialStartHours[t];
        const window = getTimeWindow(plannedHour);
        
        let distanceKm: number;
        let avgSpeed: number; 
        
        switch(window) {
            case 'LUNCH_RUSH':
                distanceKm = rng.nextFloat(0.5, 4.5); 
                avgSpeed = rng.nextFloat(12, 25); 
                break;
            case 'MORNING_PEAK':
                distanceKm = rng.nextFloat(8, 25);
                avgSpeed = rng.nextFloat(20, 35); 
                break;
            case 'EVENING_COMMUTE':
                distanceKm = rng.nextFloat(5, 20);
                avgSpeed = rng.nextFloat(10, 22); 
                break;
            case 'NIGHT_ORDERS':
                distanceKm = rng.nextFloat(2, 10);
                avgSpeed = rng.nextFloat(35, 55); 
                break;
            default: // Afternoon Lull
                distanceKm = rng.nextFloat(3, 15);
                avgSpeed = rng.nextFloat(25, 45);
        }

        if (rng.next() < 0.05) {
            distanceKm = rng.nextFloat(35, 70);
            avgSpeed = rng.nextFloat(45, 65);
        }

        const rawDurationHours = distanceKm / avgSpeed;
        const durationMin = (rawDurationHours * 60); 
        
        let idleTimeMin = durationMin * rng.nextFloat(0.05, 0.1); 
        if (avgSpeed < 20) idleTimeMin = durationMin * rng.nextFloat(0.3, 0.5); 

        const startMinOffset = rng.nextInt(0, 59);
        let startAbsoluteMin = (plannedHour * 60) + startMinOffset;

        if (startAbsoluteMin <= lastEndTimeMin) {
            startAbsoluteMin = lastEndTimeMin + rng.nextInt(10, 30); 
        }
        
        const startDateTime = new Date(date);
        startDateTime.setHours(0, startAbsoluteMin, 0); 
        
        if (startDateTime.getDate() !== date.getDate()) break;

        const endDateTime = new Date(startDateTime.getTime() + durationMin * 60000);
        lastEndTimeMin = (endDateTime.getHours() * 60) + endDateTime.getMinutes();

        if (isLiveCheck && endDateTime > now) continue; 

        // Location Logic
        const startLat = currentLat;
        const startLon = currentLon;
        let endLat: number, endLon: number;
        
        if (window === 'LUNCH_RUSH') {
             endLat = startLat + rng.nextFloat(-0.02, 0.02);
             endLon = startLon + rng.nextFloat(-0.02, 0.02);
        } else if (t === tripCount - 1) {
             endLat = homeLat;
             endLon = homeLon;
        } else {
             endLat = startLat + rng.nextFloat(-0.05, 0.05);
             endLon = startLon + rng.nextFloat(-0.05, 0.05);
        }
        currentLat = endLat;
        currentLon = endLon;

        // --- METRIC CALCULATIONS ---
        
        // 1. Energy
        const energyKwh = calculateEnergyConsumption(distanceKm, avgSpeed, idleTimeMin, rng);
        
        // 2. NEW Tiered Carbon Calculation
        // Use historical odometer + what we've driven today
        const currentTripOdometer = historicalOdometer + dayAccumulatedKm;
        const rateGramsPerKm = getTierRate(currentTripOdometer);
        
        // Formula: km * rate / 1000
        const creditKg = (distanceKm * rateGramsPerKm) / 1000;

        // 3. Revenue
        const revenue = distanceKm * 25; 
        
        // Traffic Condition for UI
        let condition: 'Free Flow' | 'Moderate' | 'Heavy Congestion' = 'Free Flow';
        if (avgSpeed < 18) condition = 'Heavy Congestion';
        else if (avgSpeed < 35) condition = 'Moderate';

        const startTimeStr = `${padZero(startDateTime.getHours())}:${padZero(startDateTime.getMinutes())}`;
        const endTimeStr = `${padZero(endDateTime.getHours())}:${padZero(endDateTime.getMinutes())}`;

        trips.push({
            ride_id: `${riderIdx}-${dateStr.replace(/-/g,'')}-${t}`,
            user_id: riderProfile.rider_id,
            asset_id: riderProfile.asset_id,
            display_id: riderProfile.display_id,
            start_date: dateStr,
            start_time: startTimeStr,
            end_date: dateStr,
            end_time: endTimeStr,
            duration_min: parseFloat(durationMin.toFixed(1)),
            distance_km: parseFloat(distanceKm.toFixed(2)),
            idle_time_min: parseFloat(idleTimeMin.toFixed(1)),
            start_lat: parseFloat(startLat.toFixed(5)),
            start_lon: parseFloat(startLon.toFixed(5)),
            end_lat: parseFloat(endLat.toFixed(5)),
            end_lon: parseFloat(endLon.toFixed(5)),
            avg_speed_kmh: parseFloat(avgSpeed.toFixed(1)),
            avg_moving_speed_kmh: parseFloat((avgSpeed * 1.2).toFixed(1)), 
            max_speed_kmh: parseFloat((avgSpeed * 1.5).toFixed(1)),
            
            // NEW METRICS
            energy_kwh: energyKwh,
            carbon_credits_saved_kg: parseFloat(creditKg.toFixed(3)),
            baseline_applied: rateGramsPerKm, // Storing the g/km rate
            traffic_condition: condition, 
            
            revenue_kes: parseFloat(revenue.toFixed(2)),
        });

        dayAccumulatedKm += distanceKm;
    }

    return trips;
}

// --- MAIN PUBLIC API ---

export const fetchRangeData = async (
  viewStartDate: Date, 
  viewEndDate: Date
): Promise<{ 
  dailySummaries: DailySummary[], 
  sampleRides: RideData[], 
  riderProfiles: RiderProfile[] 
}> => {
  
  await new Promise(resolve => setTimeout(resolve, 600)); 

  const now = new Date(); 
  
  if (cachedSummaries.length === 0) {
      console.log("Initializing Telemetry Database...");
      initializeDatabase(now);
  }

  const filteredSummaries = cachedSummaries.filter(s => {
      const d = new Date(s.date);
      return d >= viewStartDate && d <= viewEndDate;
  });

  const sampleRides: RideData[] = [];
  
  const loopDate = new Date(viewStartDate);
  while(loopDate <= viewEndDate) {
      if (loopDate > now) break;

      const dateStr = loopDate.toISOString().split('T')[0];
      const activeFleet = getActiveFleetSize(loopDate.getTime());
      
      const daysDiff = (viewEndDate.getTime() - viewStartDate.getTime()) / (1000 * 3600 * 24);
      let ridersToSample = activeFleet;
      if (daysDiff > 30) ridersToSample = 20; 

      for(let i = 1; i <= ridersToSample; i++) {
         const profile = cachedRiderProfiles.get(i);
         if (!profile) continue;

         const dayTrips = generateDailyTripsForRider(i, loopDate, profile, true, now);
         sampleRides.push(...dayTrips);
      }
      
      loopDate.setDate(loopDate.getDate() + 1);
  }

  sampleRides.sort((a,b) => {
      const dateA = new Date(`${a.end_date}T${a.end_time}`);
      const dateB = new Date(`${b.end_date}T${b.end_time}`);
      return dateB.getTime() - dateA.getTime();
  });

  return {
    dailySummaries: filteredSummaries,
    sampleRides: sampleRides.slice(0, 500),
    riderProfiles: Array.from(cachedRiderProfiles.values())
  };
};

const initializeDatabase = (now: Date) => {
    const simStartDate = new Date(DATE_MAY_5_2022);
    const endDate = new Date(now); 

    for(let i = 1; i <= TOTAL_FLEET_SIZE; i++) {
        let joinDate = DATE_MAY_5_2022; 
        if (i > 20) joinDate = DATE_DEC_1_2023; 
        if (i > 120) joinDate = DATE_JAN_1_2025;
        
        cachedRiderProfiles.set(i, {
            rider_id: `RID-KE-${padZero(i).padStart(5, '0')}`,
            asset_id: `YnakenyaV1-KE-${padZero(i).padStart(6, '0')}`,
            display_id: i,
            join_date: new Date(joinDate).toISOString().split('T')[0],
            total_distance_km: 0,
            total_revenue_kes: 0,
            total_carbon_kg: 0,
            total_energy_kwh: 0, // Init
            total_duration_min: 0,
            trip_count: 0,
            status: 'active'
        });
    }

    const loopDate = new Date(simStartDate);
    while(loopDate <= endDate) {
        const dateStr = loopDate.toISOString().split('T')[0];
        const activeFleet = getActiveFleetSize(loopDate.getTime());
        
        let dayDist = 0;
        let dayRev = 0;
        let dayCarbon = 0;
        let dayRides = 0;

        if (activeFleet > 0) {
            const seed = createSeed(`DAILY_AGG-${dateStr}`);
            const rng = new SeededRNG(seed);

            for(let i = 1; i <= activeFleet; i++) {
                if(rng.next() > 0.85) continue; 

                const trips = rng.nextInt(3, 8); 
                const dailyKm = trips * rng.nextFloat(3, 15);
                const dailyRev = dailyKm * 25;
                
                // Approx energy: 0.05 kWh/km average
                const dailyEnergy = dailyKm * 0.05; 
                
                // Accurate Aggregate Calculation using Current Odometer Tier
                const profile = cachedRiderProfiles.get(i)!;
                const rate = getTierRate(profile.total_distance_km);
                const dailyCarbonVal = (dailyKm * rate) / 1000;

                profile.total_distance_km += dailyKm;
                profile.total_revenue_kes += dailyRev;
                profile.total_carbon_kg += dailyCarbonVal;
                profile.total_energy_kwh += dailyEnergy; // Accumulate Energy
                profile.total_duration_min += (dailyKm/25)*60;
                profile.trip_count += trips;

                dayDist += dailyKm;
                dayRev += dailyRev;
                dayCarbon += dailyCarbonVal;
                dayRides += trips;
            }
        }

        cachedSummaries.push({
            date: dateStr,
            total_rides: dayRides,
            active_bikes: Math.floor(activeFleet * 0.85),
            total_distance_km: dayDist,
            total_revenue: dayRev,
            total_carbon_saved: dayCarbon,
            fleet_size: activeFleet
        });

        loopDate.setDate(loopDate.getDate() + 1);
    }
}

const padZero = (num: number) => num.toString().padStart(2, '0');

// --- EXPOSE FOR AI & DEVELOPER CONSOLE ACCESS ---
// This allows the user to perform "window.EV_TELEMETRY.getData()" in browser console
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.EV_TELEMETRY = {
    fetchRangeData,
    getSummaries: () => cachedSummaries,
    getRiders: () => Array.from(cachedRiderProfiles.values()),
    // Help helper
    help: () => console.log("%c EV Telemetry Commands: \n%c window.EV_TELEMETRY.getSummaries() \n window.EV_TELEMETRY.getRiders()", "color: #10b981; font-weight: bold; font-size: 14px", "color: #94a3b8")
  };
}