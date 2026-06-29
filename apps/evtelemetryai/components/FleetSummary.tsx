import React from 'react';
import { RiderProfile } from '../types';

interface FleetSummaryProps {
  riders: RiderProfile[];
}

export const FleetSummary: React.FC<FleetSummaryProps> = ({ riders }) => {
  // AI/Logic Summation
  const totalTrips = riders.reduce((acc, r) => acc + r.trip_count, 0);
  const totalDistance = riders.reduce((acc, r) => acc + r.total_distance_km, 0);
  const totalDurationMin = riders.reduce((acc, r) => acc + r.total_duration_min, 0);
  const totalEnergy = riders.reduce((acc, r) => acc + r.total_energy_kwh, 0);
  const totalRevenue = riders.reduce((acc, r) => acc + r.total_revenue_kes, 0);
  const totalCarbon = riders.reduce((acc, r) => acc + r.total_carbon_kg, 0);

  // Helper to format duration
  const formatDuration = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return `${hours}h ${m}m`;
  };

  // Calculate Cohorts (Year -> Count)
  const cohorts = riders.reduce((acc, r) => {
      const year = r.join_date.substring(0, 4);
      acc[year] = (acc[year] || 0) + 1;
      return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col shadow-lg mt-1">
      <div className="p-5 border-b border-slate-700 bg-slate-900/50">
         <h3 className="text-xl font-bold text-white">Fleet Summary Totals</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-400 table-fixed">
          <thead className="bg-slate-900 text-slate-200 uppercase tracking-wider font-bold shadow-sm">
            <tr>
              <th className="p-4 border-b border-slate-700 w-[10%]">Asset ID</th>
              <th className="p-4 border-b border-slate-700 w-[12%]">Join Date</th>
              <th className="p-4 border-b border-slate-700 text-right w-[8%]">Trips</th>
              <th className="p-4 border-b border-slate-700 text-right w-[12%]">Total Dist (km)</th>
              <th className="p-4 border-b border-slate-700 text-right w-[12%]">Total Duration</th>
              <th className="p-4 border-b border-slate-700 text-right w-[14%]">Lifetime Energy</th>
              <th className="p-4 border-b border-slate-700 text-right w-[15%]">Lifetime Revenue</th>
              <th className="p-4 border-b border-slate-700 text-right w-[17%]">Lifetime CO₂</th>
            </tr>
          </thead>
          <tbody className="bg-slate-800">
            <tr>
               <td className="p-4 align-top border-r border-slate-700/50">
                  <div className="font-mono text-brand-green font-bold text-lg">{riders.length}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Units</div>
               </td>
               <td className="p-4 align-top border-r border-slate-700/50">
                  <div className="flex flex-col gap-1">
                      {Object.keys(cohorts).length === 0 ? (
                          <span className="text-xs text-slate-500">-</span>
                      ) : (
                          Object.entries(cohorts).sort().map(([year, count]) => (
                            <div key={year} className="flex items-center gap-2 text-xs">
                                <span className="font-mono text-slate-400 w-9">{year}</span>
                                <span className="text-slate-600">-</span>
                                <span className="font-bold text-white">{count}</span>
                            </div>
                          ))
                      )}
                  </div>
               </td>
               <td className="p-4 align-top text-right font-bold text-white text-sm border-r border-slate-700/50">
                  {totalTrips.toLocaleString()}
               </td>
               <td className="p-4 align-top text-right text-white font-bold text-sm border-r border-slate-700/50">
                  {Math.floor(totalDistance).toLocaleString()}
               </td>
               <td className="p-4 align-top text-right font-medium text-white text-sm border-r border-slate-700/50">
                  {formatDuration(totalDurationMin)}
               </td>
               <td className="p-4 align-top text-right text-yellow-500 font-bold font-mono text-sm border-r border-slate-700/50">
                  {totalEnergy.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-xs text-slate-500 font-sans">kWh</span>
               </td>
               <td className="p-4 align-top text-right text-brand-orange font-bold text-sm border-r border-slate-700/50">
                  KES {Math.floor(totalRevenue).toLocaleString()}
               </td>
               <td className="p-4 align-top text-right">
                  <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-sm font-bold border border-emerald-500/20 inline-block">
                     {Math.floor(totalCarbon).toLocaleString()} kg
                  </span>
               </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};