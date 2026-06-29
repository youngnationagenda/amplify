import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendText?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subValue, icon: Icon, trend, trendText }) => {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
        <div className="p-2 bg-slate-700/50 rounded-lg text-brand-green">
          <Icon size={20} />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <h2 className="text-3xl font-bold text-white">{value}</h2>
        {subValue && (
            <span className="text-xs text-slate-400 font-normal">{subValue}</span>
        )}
      </div>
       {trend && (
        <div className="mt-2 text-xs">
            <span className={`${trend === 'up' ? 'text-brand-green' : trend === 'down' ? 'text-red-500' : 'text-slate-400'}`}>
                {trend === 'up' ? '▲ ' : trend === 'down' ? '▼ ' : ''}{trendText || '12%'}
            </span>
            <span className="text-slate-500 ml-1">vs prev period</span>
        </div>
       )}
    </div>
  );
};