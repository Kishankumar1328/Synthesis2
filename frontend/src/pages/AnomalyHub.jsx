import React, { useState } from 'react';
import { AlertCircle, TrendingUp, Activity, Zap, Filter, FileText, Search, Sparkles } from 'lucide-react';
import { AIAPI } from '../api';
import { useProjects } from '../hooks/useProjects';
import { useDatasets } from '../hooks/useDatasets';

export default function AnomalyHub() {
    const { projects } = useProjects();
    const activeProject = projects[0];
    const { datasets } = useDatasets(activeProject?.id);

    const [selectedDataset, setSelectedDataset] = useState(null);
    const [anomalies, setAnomalies] = useState([]);
    const [filter, setFilter] = useState('all'); // all, high, medium, low
    const [isScanning, setIsScanning] = useState(false);

    const scanForAnomalies = async () => {
        if (!selectedDataset) {
            alert('Please select a dataset first');
            return;
        }

        setIsScanning(true);
        try {
            const response = await AIAPI.detectAnomalies(selectedDataset);
            const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
            const rowCount = data.results?.rowCount || 0;
            const columns = data.results?.columns || [];
            const generatedAnomalies = [];
            let idCounter = 1;

            columns.forEach(col => {
                if (col.nullPercentage > 0) {
                    const severity = col.nullPercentage > 20 ? 'high' : (col.nullPercentage > 5 ? 'medium' : 'low');
                    generatedAnomalies.push({
                        id: idCounter++,
                        type: 'Data Integrity',
                        severity: severity,
                        field: col.name,
                        description: `Missing values detected in ${col.nullPercentage}% of records (${Math.floor((col.nullPercentage / 100) * rowCount)} rows).`,
                        timestamp: new Date().toISOString(),
                        affectedRecords: Math.floor((col.nullPercentage / 100) * rowCount),
                        confidence: 100
                    });
                }

                if (col.stats) {
                    const { max, mean, min } = col.stats;
                    if (max > mean * 4 && mean > 0) {
                        generatedAnomalies.push({
                            id: idCounter++,
                            type: 'Statistical Outlier',
                            severity: 'medium',
                            field: col.name,
                            description: `Extreme maximum value (${max.toFixed(2)}) detected, significantly deviating from the mean (${mean.toFixed(2)}).`,
                            timestamp: new Date().toISOString(),
                            affectedRecords: Math.floor(rowCount * 0.01),
                            confidence: 85
                        });
                    }
                }

                if (col.uniqueCount === 1) {
                    generatedAnomalies.push({
                        id: idCounter++,
                        type: 'Pattern Deviation',
                        severity: 'low',
                        field: col.name,
                        description: 'Column contains a single constant value across all records.',
                        timestamp: new Date().toISOString(),
                        affectedRecords: rowCount,
                        confidence: 100
                    });
                }
            });

            setAnomalies(generatedAnomalies);
        } catch (e) {
            console.error('Scan failed:', e);
            alert('Failed to scan for anomalies.');
        } finally {
            setIsScanning(false);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high': return 'text-rose-400 border-rose-500/20 bg-rose-500/5';
            case 'medium': return 'text-orange-400 border-orange-500/20 bg-orange-500/5';
            case 'low': return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
            default: return 'text-gray-400 border-gray-500/20 bg-gray-500/5';
        }
    };

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'high': return <AlertCircle className="w-5 h-5 text-rose-500" />;
            case 'medium': return <TrendingUp className="w-5 h-5 text-orange-500" />;
            case 'low': return <Activity className="w-5 h-5 text-amber-500" />;
            default: return <Zap className="w-5 h-5 text-gray-500" />;
        }
    };

    const filteredAnomalies = filter === 'all' ? anomalies : anomalies.filter(a => a.severity === filter);

    const stats = {
        total: anomalies.length,
        high: anomalies.filter(a => a.severity === 'high').length,
        medium: anomalies.filter(a => a.severity === 'medium').length,
        low: anomalies.filter(a => a.severity === 'low').length
    };

    return (
        <div className="p-12 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <header className="space-y-4">
                <div className="flex items-center gap-3 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-2xl w-fit">
                    <Sparkles className="w-4 h-4 text-orange-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Neural Security</span>
                </div>
                <h1 className="text-6xl font-black tracking-tighter italic">
                    Anomaly <span className="text-gradient-orange">Hub</span>
                </h1>
                <p className="text-white/40 text-lg font-medium max-w-2xl">
                    Deploy neural scanners to detect multidimensional outliers and pattern deviations.
                </p>
            </header>

            {/* Selection & Trigger */}
            <div className="glass-panel p-10 rounded-[3rem] border border-white/5 space-y-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] group-hover:bg-orange-500/10 transition-all"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-end relative z-10">
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
                            Target Signal
                        </label>
                        <div className="relative">
                            <FileText className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500/50" />
                            <select
                                value={selectedDataset || ''}
                                onChange={(e) => setSelectedDataset(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-[1.25rem] pl-14 pr-6 py-5 focus:ring-2 ring-orange-500/40 outline-none appearance-none transition-all font-bold text-sm"
                            >
                                <option value="" className="bg-[#05070a]">Select dataset for scan...</option>
                                {datasets.map((dataset) => (
                                    <option key={dataset.id} value={dataset.id} className="bg-[#05070a]">
                                        {dataset.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={scanForAnomalies}
                        disabled={isScanning || !selectedDataset}
                        className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white px-10 py-5 rounded-[1.25rem] font-black uppercase tracking-widest transition-all shadow-xl shadow-orange-600/20 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95 group/btn"
                    >
                        {isScanning ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Analyzing Signal...
                            </>
                        ) : (
                            <>
                                <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                Scan for Anomalies
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Stats */}
            {anomalies.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="glass-panel p-8 rounded-[2rem] border border-white/5 bg-white/[0.01]">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Total</p>
                        <p className="text-5xl font-black italic">{stats.total}</p>
                    </div>
                    <div className="glass-panel p-8 rounded-[2rem] border border-rose-500/20 bg-rose-500/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-rose-500/60 mb-2">High Severity</p>
                        <p className="text-5xl font-black text-rose-400 italic">{stats.high}</p>
                    </div>
                    <div className="glass-panel p-8 rounded-[2rem] border border-orange-500/20 bg-orange-500/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-500/60 mb-2">Medium Severity</p>
                        <p className="text-5xl font-black text-orange-400 italic">{stats.medium}</p>
                    </div>
                    <div className="glass-panel p-8 rounded-[2rem] border border-amber-500/20 bg-amber-500/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/60 mb-2">Low Severity</p>
                        <p className="text-5xl font-black text-amber-400 italic">{stats.low}</p>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="space-y-8">
                {anomalies.length > 0 && (
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-white/30 font-black text-[10px] uppercase tracking-widest">
                                <Filter size={14} /> Filter Results:
                            </div>
                            <div className="flex gap-2">
                                {['all', 'high', 'medium', 'low'].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${filter === f
                                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                                            : 'bg-white/5 text-white/40 hover:bg-white/10'
                                            }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {filteredAnomalies.length === 0 ? (
                        <div className="glass-panel p-24 rounded-[4rem] border border-white/5 text-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                            <div className="w-32 h-32 mx-auto mb-10 rounded-[2.5rem] bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-700 shadow-2xl shadow-orange-500/10">
                                <Search className="w-16 h-16 text-orange-400" />
                            </div>
                            <h3 className="text-4xl font-black tracking-tighter mb-4 italic uppercase">System Idle</h3>
                            <p className="text-white/40 text-lg max-w-lg mx-auto font-medium leading-relaxed uppercase tracking-tighter">
                                Initiate a scan to detect neural outliers and pattern integrity issues within your signals.
                            </p>
                        </div>
                    ) : (
                        filteredAnomalies.map((anomaly) => (
                            <div
                                key={anomaly.id}
                                className="glass-panel p-8 rounded-[2.5rem] border border-white/5 hover:border-orange-500/30 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-orange-500/10 transition-all"></div>

                                <div className="flex items-start gap-8 relative z-10">
                                    <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-orange-500/10 to-transparent border border-white/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all group-hover:rotate-3">
                                        {getSeverityIcon(anomaly.severity)}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-4">
                                                    <h3 className="font-black text-2xl uppercase italic tracking-tight">{anomaly.type}</h3>
                                                    <span className={`text-[9px] px-3 py-1 rounded-lg font-black uppercase tracking-[0.2em] border ${getSeverityColor(anomaly.severity)}`}>
                                                        {anomaly.severity}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-white/30 font-black uppercase tracking-widest">
                                                    Target Field: <span className="text-orange-400 italic">{anomaly.field}</span>
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.3em] mb-1">Confidence</p>
                                                <p className="text-4xl font-black text-orange-400 italic leading-none">{anomaly.confidence}%</p>
                                            </div>
                                        </div>

                                        <p className="text-white/50 mb-8 font-medium leading-relaxed text-lg italic pr-20">{anomaly.description}</p>

                                        <div className="flex items-center gap-10">
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20">Affected Space</p>
                                                <p className="font-black text-white/80 uppercase tracking-tighter underline decoration-orange-500/50 decoration-2 underline-offset-4">{anomaly.affectedRecords} Records</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20">Detection Event</p>
                                                <p className="font-black text-white/40 uppercase tracking-tighter">{new Date(anomaly.timestamp).toLocaleTimeString()} • {new Date(anomaly.timestamp).toLocaleDateString()}</p>
                                            </div>

                                            <button className="ml-auto px-10 py-4 bg-orange-600/10 hover:bg-orange-600 text-orange-400 hover:text-white rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest transition-all border border-orange-500/20 active:scale-95">
                                                Investigate Signal
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
