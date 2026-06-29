import React, { useState } from 'react';
import { RiderProfile } from '../types';
import { Search } from 'lucide-react';

interface RiderTableProps {
  riders: RiderProfile[];
}

export const RiderTable: React.FC<RiderTableProps> = ({ riders }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRiders = riders.filter(r => 
    r.display_id.toString().includes(searchTerm)
  );

  // Helper to format duration
  const formatDuration = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return `${hours}h ${m}m`;
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-850">
        <div>
            <h3 className="text-xl font-bold text-white">Fleet Asset Performance</h3>
            <p className="text-sm text-slate-400 mt-1">Lifetime stats for {riders.length} active motorcycles</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Search Asset ID (#)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-brand-green w-64 shadow-inner"
          />
        </div>
      </div>

      <div className="overflow-auto flex-1">
        <table className="w-full text-left text-sm text-slate-400 table-fixed">
          <thead className="bg-slate-900 text-slate-200 sticky top-0 z-10 shadow-lg font-bold uppercase tracking-wider">
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
          <tbody className="divide-y divide-slate-700/50">
            {filteredRiders.length === 0 ? (
                <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 text-lg">No assets found matching your search.</td>
                </tr>
            ) : (
                filteredRiders.map((rider) => (
                <tr key={rider.display_id} className="hover:bg-slate-700/40 transition-colors">
                    <td className="p-4 truncate">
                        <div className="font-mono text-brand-green font-bold text-base">#{rider.display_id}</div>
                    </td>
                    <td className="p-4 font-medium text-white truncate">{rider.join_date}</td>
                    <td className="p-4 text-right font-medium text-white truncate">{rider.trip_count.toLocaleString()}</td>
                    <td className="p-4 text-right text-white font-bold text-base truncate">{Math.floor(rider.total_distance_km).toLocaleString()}</td>
                    <td className="p-4 text-right font-medium text-white truncate">{formatDuration(rider.total_duration_min)}</td>
                    <td className="p-4 text-right text-yellow-500 font-bold font-mono truncate">
                        {(rider.total_energy_kwh).toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh
                    </td>
                    <td className="p-4 text-right text-brand-orange font-bold text-base truncate">KES {Math.floor(rider.total_revenue_kes).toLocaleString()}</td>
                    <td className="p-4 text-right truncate">
                        <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-md text-sm font-bold border border-emerald-500/20 inline-block">
                            {Math.floor(rider.total_carbon_kg).toLocaleString()} kg
                        </span>
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};