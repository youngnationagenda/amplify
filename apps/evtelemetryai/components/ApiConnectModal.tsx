import React, { useState } from 'react';
import { X, Copy, Terminal, Check, Globe, Code, ExternalLink, HardDrive } from 'lucide-react';

interface ApiConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiConnectModal: React.FC<ApiConnectModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'console' | 'rest'>('console');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const consoleCode = `// 1. Open Browser Console (F12)
// 2. Paste this code to get real-time simulation data:

// Get Lifetime Fleet Statistics
const riders = window.EV_TELEMETRY.getRiders();
console.table(riders.slice(0, 5)); // View top 5

// Get Daily Aggregates (Rev, Carbon, Dist)
const history = window.EV_TELEMETRY.getSummaries();
console.log("Total Carbon Saved (kg):", history.reduce((acc, d) => acc + d.total_carbon_saved, 0));`;

  const restCode = `# Production API Endpoints (For Audit Integration)

# Base URL (set via environment variable)
# VITE_API_ENDPOINT=https://your-api-gateway.execute-api.us-east-1.amazonaws.com/v1

# 1. Ingest Telemetry (IoT Device)
POST /telemetry/ingest
Content-Type: application/json
{
  "asset_id": "YnakenyaV1-KE-000001",
  "gps": { "lat": -1.2921, "lon": 36.8219 },
  "bms": { "voltage": 72.4, "current": 15.2, "soc": 84 }
}

# 2. Fetch Fleet Export (Admin)
GET /fleet/export?start_date=2024-01-01&end_date=2024-01-31&format=csv
Authorization: Bearer YOUR_API_KEY_HERE`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-400">
                    <Code size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Developer & AI Access</h2>
                    <p className="text-xs text-slate-400">Connection strings for external agents</p>
                </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 bg-slate-800/50">
            <button 
                onClick={() => setActiveTab('console')}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'console' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800' : 'text-slate-400 hover:text-slate-300'}`}
            >
                <Terminal size={16} />
                Direct Memory Access (JS)
            </button>
            <button 
                onClick={() => setActiveTab('rest')}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'rest' ? 'text-emerald-400 border-b-2 border-emerald-400 bg-slate-800' : 'text-slate-400 hover:text-slate-300'}`}
            >
                <Globe size={16} />
                REST API (Production)
            </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-slate-950 flex-1 overflow-auto">
            {/* Project Resources Link - Added per user request */}
            <div className="mb-6 p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between group hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                        <HardDrive size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white">Connected AI Studio Drive</h4>
                        <p className="text-xs text-slate-500">External Knowledge Base / Training Data</p>
                    </div>
                </div>
                <a 
                    href="https://ai.studio/apps/drive/1UDB2q2aAQth_CQQuA6P9D9ZixznwLeaa" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 transition-colors"
                >
                    View Resource <ExternalLink size={12} />
                </a>
            </div>

            {activeTab === 'console' ? (
                <div className="space-y-4">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                        <h4 className="text-blue-400 font-bold text-sm mb-1 flex items-center gap-2">
                            <Terminal size={14} /> 
                            Browser Bridge Active
                        </h4>
                        <p className="text-xs text-blue-200/70">
                            The simulation engine is exposed globally as <code className="bg-slate-900 px-1 py-0.5 rounded text-blue-300">window.EV_TELEMETRY</code>. 
                            You can feed this data directly into your AI Agent if it supports browser execution.
                        </p>
                    </div>

                    <div className="relative group">
                        <div className="absolute right-2 top-2">
                            <button 
                                onClick={() => handleCopy(consoleCode)}
                                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white transition-colors border border-slate-700"
                            >
                                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                            </button>
                        </div>
                        <pre className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-sm font-mono text-slate-300 overflow-x-auto leading-relaxed">
                            {consoleCode}
                        </pre>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                        <h4 className="text-emerald-400 font-bold text-sm mb-1 flex items-center gap-2">
                            <Globe size={14} /> 
                            Mock Architecture
                        </h4>
                        <p className="text-xs text-emerald-200/70">
                            These are the standard endpoints for the backend service. Use these specifications when configuring your external Audit AI or Dead Letter Queue.
                        </p>
                    </div>

                    <div className="relative group">
                        <div className="absolute right-2 top-2">
                            <button 
                                onClick={() => handleCopy(restCode)}
                                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white transition-colors border border-slate-700"
                            >
                                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                            </button>
                        </div>
                        <pre className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-sm font-mono text-slate-300 overflow-x-auto leading-relaxed">
                            {restCode}
                        </pre>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
