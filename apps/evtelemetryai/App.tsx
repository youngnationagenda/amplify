import React, { useState, useEffect, useCallback } from 'react';
import { Bike, DollarSign, Leaf, Zap, Calendar, RefreshCw, Database, BrainCircuit, Code } from 'lucide-react';
import { StatCard } from './components/StatCard';
import { RideTable } from './components/RideTable';
import { RiderTable } from './components/RiderTable';
import { FleetSummary } from './components/FleetSummary';
import { RevenueChart, CarbonChart } from './components/Charts';
import { AIAnalyst } from './components/AIAnalyst';
import { SystemHealth } from './components/SystemHealth';
import { ApiConnectModal } from './components/ApiConnectModal';
import { fetchRangeData } from './services/telemetryGenerator';
import { generateRealtimeMetrics, RealtimeMetrics } from './services/aiService';
import { DailySummary, RideData, RiderProfile } from './types';

function App() {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1); 
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [rides, setRides] = useState<RideData[]>([]);
  const [riderProfiles, setRiderProfiles] = useState<RiderProfile[]>([]);
  const [realtimeMetrics, setRealtimeMetrics] = useState<RealtimeMetrics | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isAnalystOpen, setIsAnalystOpen] = useState(false);
  const [isApiOpen, setIsApiOpen] = useState(false);

  useEffect(() => {
      const todayStr = new Date().toISOString().split('T')[0];
      setIsLive(endDate === todayStr);
  }, [endDate]);

  const totalRev = summaries.reduce((acc, curr) => acc + curr.total_revenue, 0);
  const totalCarbon = summaries.reduce((acc, curr) => acc + curr.total_carbon_saved, 0);
  const totalDist = summaries.reduce((acc, curr) => acc + curr.total_distance_km, 0);
  const totalRides = summaries.reduce((acc, curr) => acc + curr.total_rides, 0);
  const maxFleet = summaries.length > 0 ? Math.max(...summaries.map(s => s.fleet_size)) : 0;

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { dailySummaries, sampleRides, riderProfiles } = await fetchRangeData(new Date(startDate), new Date(endDate));
      setSummaries(dailySummaries);
      setRides(sampleRides);
      setRiderProfiles(riderProfiles);
      
      // Fetch metrics (now deterministic)
      if (sampleRides.length > 0) {
        const metrics = await generateRealtimeMetrics(sampleRides);
        if (metrics) {
          setRealtimeMetrics(metrics);
        }
      }
    } catch (error) {
      console.error("Failed to fetch telemetry data", error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let interval: any;
    if (isLive) {
        interval = setInterval(() => {
            fetchData(true); 
        }, 10000); 
    }
    return () => {
        if (interval) clearInterval(interval);
    };
  }, [isLive, fetchData]);

  const handleSetLive = () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const start = new Date();
      start.setDate(start.getDate() - 3); 
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(todayStr);
  };

  const LoadingPlaceholder = ({ text }: { text: string }) => (
    <div className="h-full flex items-center justify-center bg-slate-800 rounded-xl border border-slate-700">
        <p className="text-slate-500">{text}</p>
    </div>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950">
      <AIAnalyst 
        isOpen={isAnalystOpen} 
        onClose={() => setIsAnalystOpen(false)} 
        summaries={summaries}
        riders={riderProfiles}
        startDate={startDate}
        endDate={endDate}
      />

      <ApiConnectModal
        isOpen={isApiOpen}
        onClose={() => setIsApiOpen(false)}
      />

      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-brand-green p-2 rounded-lg">
            <Bike className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">EV <span className="text-brand-green">Telemetry</span> AI</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1">
                <Database size={10} /> 
                Connected to Production DB
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
            
          <button 
            onClick={() => setIsAnalystOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-semibold transition-all mr-2"
          >
             <BrainCircuit size={14} />
             AI Analyst
          </button>

          <button 
            onClick={() => setIsApiOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-500/30 text-blue-300 rounded-lg text-xs font-semibold transition-all mr-2"
          >
             <Code size={14} />
             API Access
          </button>

          <button 
            onClick={handleSetLive}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border ${
                isLive 
                ? 'bg-red-500/10 border-red-500/50 text-red-400 animate-pulse' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
            }`}
          >
             <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500' : 'bg-slate-500'}`} />
             Live View
          </button>

          <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-lg border border-slate-700">
            <Calendar size={16} className="text-slate-400 ml-2" />
            <input 
              type="date" 
              value={startDate}
              min="2022-05-05"
              max="2026-12-31"
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-sm text-white focus:outline-none border-none w-32"
            />
            <span className="text-slate-500">-</span>
            <input 
              type="date" 
              value={endDate}
              min="2022-05-05"
              max="2026-12-31"
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-sm text-white focus:outline-none border-none w-32"
            />
          </div>
          
          <button 
            onClick={() => fetchData(false)}
            disabled={loading}
            className="flex items-center gap-2 bg-brand-orange hover:bg-brand-darkOrange disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-orange-900/20"
          >
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 space-y-6">
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Revenue (View)" 
            value={realtimeMetrics?.totalRevenue.value || `KES ${(totalRev/1000000).toFixed(2)}M`} 
            subValue={realtimeMetrics?.totalRevenue.subValue || `KES ${Math.round(totalRev).toLocaleString()}`}
            icon={DollarSign} 
            trend={realtimeMetrics?.totalRevenue.trend || "up"}
            trendText={realtimeMetrics?.totalRevenue.trendText}
          />
          <StatCard 
            title="Carbon Offset (View)" 
            value={realtimeMetrics?.carbonOffset.value || `${(totalCarbon/1000).toFixed(1)} tons`} 
            subValue={realtimeMetrics?.carbonOffset.subValue || `${Math.round(totalCarbon).toLocaleString()} kg`}
            icon={Leaf} 
            trend={realtimeMetrics?.carbonOffset.trend || "up"}
            trendText={realtimeMetrics?.carbonOffset.trendText}
          />
          <StatCard 
            title="Distance (View)" 
            value={realtimeMetrics?.distance.value || `${(totalDist/1000).toFixed(1)}k km`} 
            subValue={realtimeMetrics?.distance.subValue || `${Math.round(totalDist).toLocaleString()} km`}
            icon={Zap} 
          />
          <StatCard 
            title="Active Fleet" 
            value={realtimeMetrics?.activeFleet.value || `${maxFleet}`} 
            subValue={realtimeMetrics?.activeFleet.subValue || `${totalRides.toLocaleString()} Trips in Range`}
            icon={Bike} 
            trend={realtimeMetrics?.activeFleet.trend || "neutral"}
            trendText={realtimeMetrics?.activeFleet.trendText}
          />
        </div>

        {/* Infrastructure Health - Added for Auditing Demo */}
        <SystemHealth metrics={realtimeMetrics} />

        {/* 1. Revenue & Fleet Growth */}
        <div className="h-[400px]">
            {summaries.length > 0 ? (
                 <RevenueChart data={summaries} />
            ) : (
                <LoadingPlaceholder text="Initializing Database and syncing records..." />
            )}
        </div>

        {/* 2. Recent Telemetry Logs */}
        <div className="h-[500px]">
            <RideTable rides={rides} />
        </div>

        {/* 3. Carbon Credits Accumulated */}
        <div className="h-[400px]">
             {summaries.length > 0 ? (
                 <CarbonChart data={summaries} />
             ) : (
                <LoadingPlaceholder text="Calculating Carbon Offsets..." />
             )}
        </div>

        {/* 4. Fleet Asset Performance */}
        <div className="h-[600px]">
            <RiderTable riders={riderProfiles} />
        </div>

        {/* 5. Fleet Summary */}
        <div className="pb-8">
            <FleetSummary riders={riderProfiles} />
        </div>

      </main>
    </div>
  );
}

export default App;