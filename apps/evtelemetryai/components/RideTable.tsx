import React, { useState } from 'react';
import { RideData } from '../types';
import { Download, Gauge, Zap, Calendar, Clock, BrainCircuit, Loader2 } from 'lucide-react';
import { SeededRNG, createSeed } from '../utils/seededRng';

interface RideTableProps {
  rides: RideData[];
}

export const RideTable: React.FC<RideTableProps> = ({ rides }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const getTrafficColor = (condition: string) => {
    switch(condition) {
        case 'Heavy Congestion': return 'text-red-400 bg-red-400/10 border-red-400/20';
        case 'Moderate': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
        default: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    }
  };

  const handleExportCSV = () => {
    if (!rides || rides.length === 0) {
        alert("No data available to export.");
        return;
    }

    // Define CSV Headers
    const headers = [
        "Ride ID",
        "Asset ID",
        "Display ID",
        "User ID",
        "Start Date",
        "Start Time",
        "End Date",
        "End Time",
        "Duration (min)",
        "Distance (km)",
        "Idle Time (min)",
        "Avg Speed (km/h)",
        "Energy (kWh)",
        "Revenue (KES)",
        "Carbon Credits (kg)",
        "Traffic Condition",
        "Start Lat",
        "Start Lon",
        "End Lat",
        "End Lon"
    ];

    // Map rows
    const rows = rides.map(ride => [
        ride.ride_id,
        ride.asset_id,
        ride.display_id,
        ride.user_id,
        ride.start_date,
        ride.start_time,
        ride.end_date,
        ride.end_time,
        ride.duration_min,
        ride.distance_km,
        ride.idle_time_min,
        ride.avg_speed_kmh,
        ride.energy_kwh,
        ride.revenue_kes,
        ride.carbon_credits_saved_kg,
        ride.traffic_condition,
        ride.start_lat,
        ride.start_lon,
        ride.end_lat,
        ride.end_lon
    ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","));

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ev_fleet_summary_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Generates High-Fidelity Time-Series Data for AI Training
   * Simulates 1Hz (1 second) resolution data for Voltage, Current, Speed, Accel
   */
  const handleExportTrainingData = async () => {
    if (!rides || rides.length === 0) return;
    setIsGenerating(true);

    // Yield to UI to show loading state
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        const headers = [
            "ride_id",
            "timestamp_iso",
            "seconds_elapsed",
            "lat",
            "lon",
            "speed_mps",        // Speed (m/s)
            "accel_mps2",       // Acceleration (m/s^2) - Derived from speed diff
            "voltage_v",        // Instantaneous Voltage
            "current_a",        // Instantaneous Current
            "wh_consumed",      // Watt-hours consumed this second
            "cumulative_energy_kwh",
            "is_idling",
            "traffic_label"
        ];

        let csvContent = headers.join(",") + "\n";
        
        // Limit to top 50 rides to prevent browser crash during simulation
        const sampleRides = rides.slice(0, 50);

        for (const ride of sampleRides) {
            const seed = createSeed(ride.ride_id);
            const rng = new SeededRNG(seed);
            
            const durationSec = Math.floor(ride.duration_min * 60);
            const totalDistM = ride.distance_km * 1000;
            
            // Physics Constants for a 72V Electric Motorcycle
            const NOMINAL_VOLTAGE = 72.0;
            const BATTERY_RESISTANCE = 0.05; // Ohms
            const MASS_KG = 150; // Bike + Rider
            
            let currentLat = ride.start_lat;
            let currentLon = ride.start_lon;
            let currentSpeedMps = 0;
            let cumulativeKwh = 0;
            
            // Generate time steps
            for (let t = 0; t <= durationSec; t++) {
                // 1. Simulate Speed based on Traffic profile
                let targetSpeedMps = (ride.avg_speed_kmh / 3.6);
                
                // Add noise/variation
                if (ride.traffic_condition === 'Heavy Congestion') {
                    // Stop and go
                    if (rng.next() < 0.2) targetSpeedMps = 0;
                    else targetSpeedMps *= rng.nextFloat(0.5, 1.5);
                } else {
                    // Smoother
                    targetSpeedMps *= rng.nextFloat(0.8, 1.2);
                }

                // Smooth transition (Inertia)
                const speedDiff = targetSpeedMps - currentSpeedMps;
                const maxAccel = 2.5; // m/s^2
                const maxDecel = -3.0;
                
                let accel = speedDiff; 
                // Clamp acceleration physically
                if (accel > maxAccel) accel = maxAccel;
                if (accel < maxDecel) accel = maxDecel;
                
                const prevSpeed = currentSpeedMps;
                currentSpeedMps += accel;
                if (currentSpeedMps < 0) currentSpeedMps = 0;

                // Re-calculate actual acceleration after clamping speed
                const actualAccel = currentSpeedMps - prevSpeed;

                // 2. Physics: Calculate Power Required
                // Force = Mass*Accel + Drag(0.5 * rho * Cd * A * v^2) + RollingResist
                const dragForce = 0.5 * 1.2 * 0.6 * (currentSpeedMps * currentSpeedMps);
                const rollingResist = MASS_KG * 9.8 * 0.02;
                const inertialForce = MASS_KG * actualAccel;
                
                let totalForce = dragForce + rollingResist + inertialForce;
                if (totalForce < 0) totalForce = 0; // Simplified Regen (ignoring regen gain for this export format)

                const mechanicalPowerW = totalForce * currentSpeedMps;
                const motorEfficiency = 0.90;
                const electricalPowerW = (mechanicalPowerW / motorEfficiency) + 150; // +150W baseline electronics
                
                // 3. Electrical: Calculate Voltage & Current
                // P = V * I, but V = V_oc - I * R
                // Solving quadratic approx, or simplifying:
                let voltage = NOMINAL_VOLTAGE;
                // Voltage Sag under load
                const estimatedCurrent = electricalPowerW / voltage;
                voltage = NOMINAL_VOLTAGE - (estimatedCurrent * BATTERY_RESISTANCE);
                
                // Recalculate precise current
                const currentAmps = electricalPowerW / voltage;
                
                // 4. Wh Consumed (per second)
                // Formula: Volts * Amps / 3600
                const whConsumed = (voltage * currentAmps) / 3600;
                cumulativeKwh += (whConsumed / 1000);

                // 5. Update Location (Simplified Lat/Lon crawl)
                currentLat += (currentSpeedMps * 0.000008) * rng.nextFloat(-0.5, 1.0);
                currentLon += (currentSpeedMps * 0.000008) * rng.nextFloat(-0.5, 1.0);

                const timestamp = new Date(`${ride.start_date}T${ride.start_time}`);
                timestamp.setSeconds(timestamp.getSeconds() + t);

                csvContent += [
                    ride.ride_id,
                    timestamp.toISOString(),
                    t,
                    currentLat.toFixed(6),
                    currentLon.toFixed(6),
                    currentSpeedMps.toFixed(3),
                    actualAccel.toFixed(4), // The 'accel' needed for Python script
                    voltage.toFixed(2),
                    currentAmps.toFixed(2),
                    whConsumed.toFixed(4), // The 'wh_consumed' needed for Python script
                    cumulativeKwh.toFixed(4),
                    currentSpeedMps < 0.1 ? 1 : 0,
                    ride.traffic_condition
                ].join(",") + "\n";
            }
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `backend_telemetry_training_data_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (e) {
        console.error("Generation failed", e);
        alert("Failed to generate training data.");
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-slate-700 flex flex-col xl:flex-row justify-between items-start xl:items-center bg-slate-850 gap-4">
        <div>
            <h3 className="text-xl font-bold text-white">Recent Telemetry Logs</h3>
            <p className="text-sm text-slate-400 mt-1">
                Real-time stream: Credits calculated via Energy Mass Balance (kWh + Solar Bonus)
            </p>
        </div>
        
        <div className="flex items-center gap-2">
            <button 
                onClick={handleExportTrainingData}
                disabled={rides.length === 0 || isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-purple-900/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors mr-2 group"
                title="Exports high-resolution time-series (accel, V, I, Wh) for Python AI training"
            >
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} className="group-hover:text-purple-100" />}
            {isGenerating ? 'Simulating...' : 'Export AI Training Data'}
            </button>

            <button 
                onClick={handleExportCSV}
                disabled={rides.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
            >
            <Download size={16} />
            Export Summary
            </button>
        </div>
      </div>
      <div className="overflow-auto flex-1">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-900 text-slate-200 sticky top-0 z-10 font-bold uppercase tracking-wider shadow-lg">
            <tr>
              <th className="p-4 border-b border-slate-700">Asset ID</th>
              <th className="p-4 border-b border-slate-700">Date</th>
              <th className="p-4 border-b border-slate-700">Time / Dur</th>
              <th className="p-4 border-b border-slate-700 text-right">Dist (km)</th>
              <th className="p-4 border-b border-slate-700">Traffic / Speed</th>
              <th className="p-4 border-b border-slate-700 text-right">Idle</th>
              <th className="p-4 border-b border-slate-700 text-right">Energy</th>
              <th className="p-4 border-b border-slate-700 text-right">Factor</th>
              <th className="p-4 border-b border-slate-700 text-right">CO₂ (kg)</th>
              <th className="p-4 border-b border-slate-700 text-right">Rev (KES)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {rides.length === 0 ? (
                <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500 text-lg">No data available for this range.</td>
                </tr>
            ) : (
                rides.map((ride) => (
                <tr key={ride.ride_id} className="hover:bg-slate-700/40 transition-colors group">
                    <td className="p-4">
                        <div className="font-mono text-brand-green font-bold text-base">#{ride.display_id}</div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-white font-medium">
                            <Calendar size={14} className="text-brand-green" />
                            {ride.start_date}
                        </div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                        <div className="text-white font-medium flex items-center gap-1">
                            {ride.start_time} <span className="text-slate-600">-</span> {ride.end_time}
                        </div>
                        <div className="text-xs text-white flex items-center gap-1 mt-1">
                            <Clock size={12} className="text-brand-green" />
                            {ride.duration_min} min
                        </div>
                    </td>
                    <td className="p-4 text-right">
                        <span className="text-slate-200 font-bold">{ride.distance_km.toFixed(1)}</span>
                    </td>
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded-md text-xs border font-bold whitespace-nowrap ${getTrafficColor(ride.traffic_condition)}`}>
                            {ride.traffic_condition}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-slate-300 mt-2 font-medium">
                            <Gauge size={12} className="text-brand-green" />
                            Avg: {ride.avg_speed_kmh} km/h
                        </div>
                    </td>
                    <td className="p-4 text-right">
                        <div className={`font-medium ${ride.idle_time_min > 5 ? 'text-orange-400' : 'text-white'}`}>
                            {ride.idle_time_min.toFixed(1)}m
                        </div>
                    </td>
                    <td className="p-4 text-right">
                        <div className="text-yellow-500 font-mono font-bold">{ride.energy_kwh.toFixed(2)}</div>
                        <div className="text-xs text-white">kWh</div>
                    </td>
                    <td className="p-4 text-right">
                        <span className="font-mono text-lg font-bold text-white">
                             {ride.baseline_applied.toFixed(1)}g
                        </span>
                    </td>
                    <td className="p-4 text-right">
                        <div className="text-emerald-400 font-bold text-base">{ride.carbon_credits_saved_kg.toFixed(2)}</div>
                    </td>
                    <td className="p-4 text-right text-brand-orange font-bold">{ride.revenue_kes.toLocaleString()}</td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};