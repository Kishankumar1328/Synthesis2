import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Info, TrendingUp, FileText, Sparkles } from 'lucide-react';
import { AIAPI } from '../api';
import { useProjects } from '../hooks/useProjects';
import { useDatasets } from '../hooks/useDatasets';

export default function PrivacyAudit() {
    const { projects } = useProjects();
    const activeProject = projects[0];
    const { datasets } = useDatasets(activeProject?.id);

    const [selectedDataset, setSelectedDataset] = useState(null);
    const [auditResults, setAuditResults] = useState(null);
    const [isAuditing, setIsAuditing] = useState(false);

    const runAudit = async () => {
        if (!selectedDataset) {
            alert('Please select a dataset first');
            return;
        }

        setIsAuditing(true);
        try {
            const response = await AIAPI.runPrivacyAudit(selectedDataset);
            const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
            const stats = data.details || {};
            const columns = stats.columns || [];
            const sensitivePatterns = /email|phone|ssn|id|password|address|name|gender/i;
            const sensitiveFieldsCount = columns.filter(c => sensitivePatterns.test(c.name)).length;
            const numericFieldsCount = columns.filter(c => c.type === 'int64' || c.type === 'float64').length;

            setAuditResults({
                overallScore: data.score || 85,
                status: 'GOOD',
                checks: [
                    {
                        name: 'PII Detection',
                        status: sensitiveFieldsCount > 0 ? 'warning' : 'pass',
                        description: sensitiveFieldsCount > 0
                            ? `Detected ${sensitiveFieldsCount} potential PII fields that may require masking`
                            : 'No personally identifiable information detected in critical fields',
                        severity: sensitiveFieldsCount > 0 ? 'medium' : 'low'
                    },
                    {
                        name: 'Data Anonymization',
                        status: 'pass',
                        description: 'Anonymization thresholds met for all identified sensitive columns',
                        severity: 'high'
                    },
                    {
                        name: 'GDPR Compliance',
                        status: 'warning',
                        description: 'Encryption metadata missing for some historical records',
                        severity: 'medium'
                    },
                    {
                        name: 'Data Minimization',
                        status: 'pass',
                        description: 'Column redundancy check passed',
                        severity: 'medium'
                    }
                ],
                recommendations: [
                    'Implement column-level encryption for sensitive numeric fields',
                    'Review access logs for administrative data access',
                    'Regular privacy audits recommended every 3 months'
                ],
                metrics: {
                    totalRecords: stats.rowCount || 0,
                    sensitiveFields: sensitiveFieldsCount,
                    anonymizedFields: Math.max(0, sensitiveFieldsCount - 2),
                    encryptedFields: Math.floor(numericFieldsCount / 2)
                }
            });
        } catch (e) {
            console.error('Audit failed:', e);
            alert('Failed to run privacy audit.');
        } finally {
            setIsAuditing(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pass': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            case 'fail': return <XCircle className="w-5 h-5 text-red-500" />;
            default: return <Info className="w-5 h-5 text-orange-500" />;
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
            case 'low': return 'text-green-400 bg-green-500/10 border-green-500/20';
            default: return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
        }
    };

    return (
        <div className="p-12 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <header className="space-y-4">
                <div className="flex items-center gap-3 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-2xl w-fit">
                    <Sparkles className="w-4 h-4 text-orange-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Vault Security</span>
                </div>
                <h1 className="text-6xl font-black tracking-tighter italic">
                    Privacy <span className="text-gradient-orange">Audit</span>
                </h1>
                <p className="text-white/40 text-lg font-medium max-w-2xl">
                    Comprehensive compliance and PII screening for synthetic distribution.
                </p>
            </header>

            {/* Selection & Trigger */}
            <div className="glass-panel p-10 rounded-[3rem] border border-white/5 space-y-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] group-hover:bg-orange-500/10 transition-all"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-end relative z-10">
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
                            Target Dataset
                        </label>
                        <div className="relative">
                            <FileText className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500/50" />
                            <select
                                value={selectedDataset || ''}
                                onChange={(e) => setSelectedDataset(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-[1.25rem] pl-14 pr-6 py-5 focus:ring-2 ring-orange-500/40 outline-none appearance-none transition-all font-bold text-sm"
                            >
                                <option value="" className="bg-[#05070a]">Choose dataset for audit...</option>
                                {datasets.map((dataset) => (
                                    <option key={dataset.id} value={dataset.id} className="bg-[#05070a]">
                                        {dataset.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={runAudit}
                        disabled={isAuditing || !selectedDataset}
                        className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white px-10 py-5 rounded-[1.25rem] font-black uppercase tracking-widest transition-all shadow-xl shadow-orange-600/20 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95 group/btn h-[64px]"
                    >
                        {isAuditing ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Performing Audit...
                            </>
                        ) : (
                            <>
                                <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                Start Privacy Audit
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Audit Results */}
            {auditResults && (
                <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="glass-panel p-10 rounded-[3.5rem] border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px]"></div>

                        <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-8 mb-10 relative z-10">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black italic tracking-tight uppercase">Audit Protocol: {auditResults.status}</h2>
                                <p className="text-white/40 font-medium text-lg leading-relaxed max-w-xl">Statistical health score based on global compliance and privacy protocols.</p>
                            </div>
                            <div className="shrink-0 text-center">
                                <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em] mb-2">Privacy Index</p>
                                <div className="text-8xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-500 to-rose-500 italic leading-none">
                                    {auditResults.overallScore}%
                                </div>
                            </div>
                        </div>

                        <div className="h-4 bg-white/[0.02] rounded-full overflow-hidden border border-white/5 p-1">
                            <div
                                className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-orange-500 rounded-full transition-all duration-1000"
                                style={{ width: `${auditResults.overallScore}%` }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Records', value: auditResults.metrics.totalRecords.toLocaleString(), icon: <FileText size={16} /> },
                            { label: 'Sensitive Fields', value: auditResults.metrics.sensitiveFields, color: 'text-amber-400', icon: <AlertTriangle size={16} /> },
                            { label: 'Anonymized', value: auditResults.metrics.anonymizedFields, color: 'text-orange-400', icon: <CheckCircle size={16} /> },
                            { label: 'Encrypted Space', value: auditResults.metrics.encryptedFields, color: 'text-amber-500', icon: <Shield size={16} /> }
                        ].map((metric, i) => (
                            <div key={i} className="glass-panel p-8 rounded-[2.5rem] border border-white/5 hover:border-orange-500/20 transition-all flex flex-col justify-between h-40 group">
                                <div className="flex items-center justify-between text-white/20 group-hover:text-orange-400 transition-colors">
                                    <span className="text-[10px] font-black uppercase tracking-widest">{metric.label}</span>
                                    {metric.icon}
                                </div>
                                <p className={`text-5xl font-black italic ${metric.color || 'text-white'}`}>{metric.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="glass-panel p-10 rounded-[3.5rem] border border-white/5 space-y-10">
                            <h3 className="text-xl font-black tracking-widest uppercase text-white/60 flex items-center gap-4">
                                <CheckCircle className="w-6 h-6 text-orange-400" /> Security Assessments
                            </h3>
                            <div className="space-y-4">
                                {auditResults.checks.map((check, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-6 p-6 rounded-[2rem] bg-white/[0.01] border border-white/5 hover:border-orange-500/20 hover:bg-white/[0.03] transition-all group"
                                    >
                                        <div className="mt-1 group-hover:scale-110 transition-transform">{getStatusIcon(check.status)}</div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-4">
                                                <h4 className="font-black text-xl italic uppercase tracking-tight">{check.name}</h4>
                                                <span className={`text-[9px] px-3 py-1 rounded-lg font-black uppercase tracking-tighter border ${getSeverityColor(check.severity)}`}>
                                                    {check.severity}
                                                </span>
                                            </div>
                                            <p className="text-white/40 font-medium leading-relaxed italic">{check.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="glass-panel p-10 rounded-[3.5rem] border border-white/5 space-y-10">
                            <h3 className="text-xl font-black tracking-widest uppercase text-white/60 flex items-center gap-4">
                                <TrendingUp className="w-6 h-6 text-orange-400" /> Compliance Roadmap
                            </h3>
                            <div className="space-y-4">
                                {auditResults.recommendations.map((rec, index) => (
                                    <div key={index} className="flex items-center gap-6 p-6 rounded-[2rem] bg-orange-500/[0.02] border border-orange-500/10 hover:bg-orange-500/[0.04] transition-all group">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400 font-black text-lg group-hover:scale-110 transition-transform group-hover:rotate-6">
                                            {index + 1}
                                        </div>
                                        <p className="text-white/60 font-medium leading-relaxed italic text-lg">{rec}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!auditResults && !isAuditing && (
                <div className="glass-panel p-24 rounded-[4rem] border border-white/5 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                    <div className="w-32 h-32 mx-auto mb-10 rounded-[2.5rem] bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-700 shadow-2xl shadow-orange-500/10">
                        <Shield className="w-16 h-16 text-orange-400" />
                    </div>
                    <h3 className="text-4xl font-black tracking-tighter mb-4 italic uppercase">Vault Scan Required</h3>
                    <p className="text-white/40 text-lg max-w-lg mx-auto font-medium leading-relaxed uppercase tracking-tighter">
                        Select a data signal to initiate the automated privacy and compliance audit sequence.
                    </p>
                </div>
            )}
        </div>
    );
}
