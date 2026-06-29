import React, { useState, useEffect } from 'react';
import { DailySummary, RiderProfile } from '../types';
import { analyzeFleetPerformance } from '../services/aiService';
import { Sparkles, BrainCircuit, X, Loader2, Calendar } from 'lucide-react';

interface AIAnalystProps {
    summaries: DailySummary[];
    riders: RiderProfile[];
    isOpen: boolean;
    onClose: () => void;
    startDate: string;
    endDate: string;
}

export const AIAnalyst: React.FC<AIAnalystProps> = ({ summaries, riders, isOpen, onClose, startDate, endDate }) => {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isThinking, setIsThinking] = useState(false);
    
    // Local date state for the analysis context
    const [localStartDate, setLocalStartDate] = useState(startDate);
    const [localEndDate, setLocalEndDate] = useState(endDate);

    // Sync local state when modal opens or parent dates change
    useEffect(() => {
        if (isOpen) {
            setLocalStartDate(startDate);
            setLocalEndDate(endDate);
            // We don't clear analysis automatically to allow user to read it, 
            // but if they change dates and click analyze again, it updates.
        }
    }, [isOpen, startDate, endDate]);

    const handleAnalyze = async () => {
        setIsThinking(true);
        setAnalysis(null);
        
        // Filter summaries based on the user-selected local range
        // Note: We can only filter what is available in `summaries` (passed from App).
        const filteredSummaries = summaries.filter(s => 
            s.date >= localStartDate && s.date <= localEndDate
        );

        const result = await analyzeFleetPerformance(
            filteredSummaries, 
            riders, 
            { start: localStartDate, end: localEndDate }
        );
        
        setAnalysis(result);
        setIsThinking(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20 text-purple-400">
                            <BrainCircuit size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Gemini Fleet Analyst</h2>
                            <p className="text-xs text-slate-400">Powered by Gemini 3 Pro (Thinking Mode)</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 bg-slate-800/50">
                    {!analysis && !isThinking && (
                        <div className="flex flex-col items-center justify-center h-full space-y-6 text-center py-6">
                            <Sparkles size={48} className="text-purple-400 opacity-50" />
                            <div className="max-w-md">
                                <h3 className="text-lg font-medium text-white mb-2">Ready to audit fleet performance</h3>
                                <p className="text-sm text-slate-400">
                                    I will analyze your simulated data to identify carbon credit inefficiencies and revenue opportunities during Nairobi peak hours.
                                </p>
                            </div>

                            {/* Date Selection Area */}
                            <div className="flex flex-col items-center gap-2 bg-slate-900/80 p-4 rounded-xl border border-slate-700 w-full max-w-sm">
                                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Select Analysis Period</span>
                                <div className="flex items-center gap-3 bg-slate-800 p-1 rounded-lg border border-slate-600">
                                    <Calendar size={16} className="text-slate-400 ml-2" />
                                    <input 
                                        type="date" 
                                        value={localStartDate}
                                        onChange={(e) => setLocalStartDate(e.target.value)}
                                        className="bg-transparent text-sm text-white focus:outline-none border-none w-32 py-1"
                                    />
                                    <span className="text-slate-500">-</span>
                                    <input 
                                        type="date" 
                                        value={localEndDate}
                                        onChange={(e) => setLocalEndDate(e.target.value)}
                                        className="bg-transparent text-sm text-white focus:outline-none border-none w-32 py-1"
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={handleAnalyze}
                                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-900/20 transition-all flex items-center gap-2 mt-2"
                            >
                                <BrainCircuit size={18} />
                                Start Deep Analysis
                            </button>
                        </div>
                    )}

                    {isThinking && (
                        <div className="flex flex-col items-center justify-center h-full space-y-4 py-20">
                            <Loader2 size={40} className="text-purple-400 animate-spin" />
                            <p className="text-sm text-purple-300 font-medium animate-pulse">Thinking...</p>
                            <p className="text-xs text-slate-500">Allocating 32k token budget for complex reasoning on period: {localStartDate} to {localEndDate}</p>
                        </div>
                    )}

                    {analysis && (
                        <div className="prose prose-invert prose-sm max-w-none">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-mono text-purple-300 bg-purple-900/20 px-2 py-1 rounded border border-purple-500/30">
                                    Period: {localStartDate} to {localEndDate}
                                </span>
                                <button 
                                    onClick={() => setAnalysis(null)}
                                    className="text-xs text-slate-400 hover:text-white underline"
                                >
                                    New Analysis
                                </button>
                            </div>
                            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700/50 whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-300">
                                {analysis}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};