import React from 'react';
import { Activity, Server, AlertTriangle, Link, ShieldCheck, Wifi, Database } from 'lucide-react';
import { RealtimeMetrics } from '../services/aiService';

interface SystemHealthProps {
  metrics?: RealtimeMetrics | null;
}

export const SystemHealth: React.FC<SystemHealthProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* 1. Callback URL / API Ingestion */}
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wifi size={14} className="text-brand-green" />
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Telemetry Ingestion</h4>
          </div>
          <div className="text-lg font-bold text-white">{metrics?.telemetryIngestion?.status || 'Online'}</div>
          <div className="text-xs text-slate-500 mt-1">Endpoint: <span className="font-mono text-slate-400">{metrics?.telemetryIngestion?.endpoint || '/api/v1/telemetry/callback'}</span></div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-brand-green">{metrics?.telemetryIngestion?.latency || '42 ms'}</div>
          <div className="text-xs text-slate-500">Avg Latency</div>
          <div className="text-[10px] text-slate-600 mt-1">Size: {metrics?.telemetryIngestion?.avgSize || '1.2 KB'}</div>
        </div>
      </div>

      {/* 2. Message Queue */}
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Server size={14} className="text-blue-400" />
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Event Queue</h4>
          </div>
          <div className="text-lg font-bold text-white">{metrics?.eventQueue?.status || 'Processing'}</div>
          <div className="text-xs text-slate-500 mt-1">Throughput: <span className="text-slate-300">{metrics?.eventQueue?.throughput || '2,400 events/min'}</span></div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-blue-400">{metrics?.eventQueue?.pendingJobs || '12'}</div>
          <div className="text-xs text-slate-500">Pending Jobs</div>
        </div>
      </div>

      {/* 3. Dead Letter Queue (Reliability) */}
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-yellow-500" />
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dead Letter Queue</h4>
          </div>
          <div className="text-lg font-bold text-emerald-400">{metrics?.deadLetterQueue?.status || 'Healthy'}</div>
          <div className="text-xs text-slate-500 mt-1">Status: <span className="text-slate-300">{metrics?.deadLetterQueue?.autoRetry || 'Auto-Retry Active'}</span></div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-slate-200">{metrics?.deadLetterQueue?.failedEvents || '0'}</div>
          <div className="text-xs text-slate-500">Failed Events</div>
        </div>
      </div>

      {/* 4. Blockchain Integrity */}
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={14} className="text-purple-400" />
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Celo Oracle</h4>
          </div>
          <div className="text-lg font-bold text-white">{metrics?.celoOracle?.status || 'Synced'}</div>
          <div className="text-xs text-slate-500 mt-1">Block: <span className="font-mono text-purple-300">{metrics?.celoOracle?.block || '#19,204,112'}</span></div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-purple-400">{metrics?.celoOracle?.dataIntegrity || '100%'}</div>
          <div className="text-xs text-slate-500">Data Integrity</div>
        </div>
      </div>
    </div>
  );
};