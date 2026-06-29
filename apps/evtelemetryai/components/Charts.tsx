import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { DailySummary } from '../types';

interface ChartProps {
  data: DailySummary[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 p-3 rounded shadow-xl text-sm">
        <p className="text-slate-200 mb-2 font-semibold">{label}</p>
        {payload.map((p: any, idx: number) => (
          <p key={idx} style={{ color: p.color }}>
            {p.name}: {p.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const RevenueChart: React.FC<ChartProps> = ({ data }) => {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col h-full">
      <h3 className="text-white font-semibold mb-4">Revenue & Fleet Growth</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorFleet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8" 
              tickFormatter={(val) => {
                  const d = new Date(val);
                  return `${d.getMonth()+1}/${d.getFullYear().toString().substr(2)}`
              }}
              minTickGap={30}
              style={{ fontSize: '12px' }}
            />
            <YAxis yAxisId="left" stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36}/>
            <Area yAxisId="left" type="monotone" dataKey="total_revenue" name="Revenue (KES)" stroke="#f97316" fillOpacity={1} fill="url(#colorRev)" />
            <Area yAxisId="right" type="stepAfter" dataKey="fleet_size" name="Fleet Size" stroke="#10b981" fillOpacity={1} fill="url(#colorFleet)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const CarbonChart: React.FC<ChartProps> = ({ data }) => {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col h-full">
      <h3 className="text-white font-semibold mb-4">Carbon Credits Accumulated</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8" 
              tickFormatter={(val) => {
                  const d = new Date(val);
                  return `${d.getMonth()+1}/${d.getFullYear().toString().substr(2)}`
              }}
              minTickGap={30}
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} cursor={{fill: '#334155', opacity: 0.2}} />
            <Bar dataKey="total_carbon_saved" name="CO₂ Saved (kg)" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};