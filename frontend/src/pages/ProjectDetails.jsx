import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProjectAPI, DatasetAPI, ModelAPI } from '../api';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import {
    ChevronLeft,
    Network,
    Database,
    Upload,
    Settings,
    ChevronDown,
    ChevronUp,
    Cpu,
    BarChart3,
    Brain,
    PlayCircle,
    Activity,
    Sparkles,
    CheckCircle2,
    Clock,
    AlertCircle,
    Fingerprint,
    Trash2,
    Edit3,
    Check,
    X
} from 'lucide-react';

export default function ProjectDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [datasets, setDatasets] = useState([]);
    const [selectedDataset, setSelectedDataset] = useState(null);
    const [models, setModels] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState('engines');
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [selectedAlgorithm, setSelectedAlgorithm] = useState('CTGAN');
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [hyperparams, setHyperparams] = useState({
        epochs: 300,
        batchSize: 500,
        learningRate: 0.0002,
        discriminatorSteps: 1,
        generatorDim: '256,256',
        discriminatorDim: '256,256'
    });
    const [showTuneSettings, setShowTuneSettings] = useState(false);

    const algorithms = [
        { id: 'CTGAN', name: 'CTGAN', desc: 'Neural network GAN for mixed tabular data' },
        { id: 'TVAE', name: 'TVAE', desc: 'Variational Autoencoder - fast and accurate' },
        { id: 'GaussianCopula', name: 'Gaussian Copula', desc: 'Statistical model - ultra fast' },
        { id: 'CopulaGAN', name: 'CopulaGAN', desc: 'Hybrid GAN-Copula for complex distributions' }
    ];

    const loadProject = useCallback(async () => {
        try {
            const res = await ProjectAPI.getOne(id);
            setProject(res.data);
            setEditName(res.data.name);
            setError(null);
        } catch (e) {
            console.error('Failed to load project:', e);
            setError('Failed to load project');
            navigate('/');
        }
    }, [id, navigate]);

    const loadDatasets = useCallback(async () => {
        try {
            const res = await DatasetAPI.getByProject(id);
            const data = res.data;
            setDatasets(data);
            if (data.length > 0 && !selectedDataset) {
                setSelectedDataset(data[0]);
            }
            setError(null);
        } catch (e) {
            console.error('Failed to load datasets:', e);
            setError('Failed to load datasets');
        }
    }, [id, selectedDataset]);

    const loadModels = useCallback(async () => {
        if (!selectedDataset) return;
        try {
            const res = await ModelAPI.getByDataset(selectedDataset.id);
            setModels(res.data);
            setError(null);
        } catch (e) {
            console.error('Failed to load models:', e);
            setError('Failed to load models');
        }
    }, [selectedDataset]);

    const loadStats = useCallback(async () => {
        if (!selectedDataset) return;
        setLoadingStats(true);
        try {
            const res = await DatasetAPI.getStats(selectedDataset.id);
            setStats(typeof res.data === 'string' ? JSON.parse(res.data) : res.data);
            setError(null);
        } catch (e) {
            console.error("Failed to load stats", e);
            setStats(null);
            setError('Failed to load statistics');
        } finally {
            setLoadingStats(false);
        }
    }, [selectedDataset]);

    useEffect(() => {
        loadProject();
        loadDatasets();
    }, [loadProject, loadDatasets]);

    useEffect(() => {
        if (selectedDataset) {
            loadModels();
            loadStats();
        }
    }, [selectedDataset, loadModels, loadStats]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setError(null);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', id);

        try {
            await DatasetAPI.upload(formData);
            await loadDatasets();
        } catch (e) {
            console.error('Upload failed:', e);
            setError('Failed to upload dataset');
        } finally {
            setUploading(false);
        }
    };

    const handleTrain = async () => {
        if (!selectedDataset) return;
        setError(null);
        try {
            await ModelAPI.train({
                datasetId: selectedDataset.id,
                algorithm: selectedAlgorithm,
                hyperparameters: hyperparams
            });
            await loadModels();
        } catch (e) {
            console.error('Training failed:', e);
            setError('Failed to initiate training');
        }
    };

    const handleGenerate = async (modelId) => {
        setError(null);
        try {
            const res = await ModelAPI.generate(modelId, { count: 1000 });
            const blob = new Blob([res.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `synthetic_gen_${modelId}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Generation failed:', e);
            setError('Failed to generate synthetic data');
        }
    };

    const handleUpdateProject = async () => {
        if (!editName.trim()) return;
        try {
            await ProjectAPI.update(id, { name: editName });
            setProject({ ...project, name: editName });
            setIsEditing(false);
            setError(null);
        } catch (e) {
            console.error('Update failed:', e);
            setError('Failed to rename workspace');
        }
    };

    const handleDeleteProject = async () => {
        if (!window.confirm('CRITICAL: Delete this workspace? All associated datasets and models will be permanently purged.')) return;
        try {
            await ProjectAPI.delete(id);
            navigate('/');
        } catch (e) {
            console.error('Delete failed:', e);
            setError('Failed to delete workspace');
        }
    };

    if (!project) return (
        <div className="flex flex-col items-center justify-center h-screen space-y-4">
            <Activity className="animate-spin text-6xl text-orange-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-500/40">Syncing Workspace...</p>
        </div>
    );

    return (
        <div className="p-12 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
            {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 flex items-center justify-between animate-in slide-in-from-top-4">
                    <div className="flex items-center space-x-4">
                        <AlertCircle className="text-rose-500 w-6 h-6" />
                        <p className="text-rose-400 font-bold uppercase tracking-tight text-sm">{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="text-rose-500/50 hover:text-rose-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>
            )}

            <header className="flex items-center justify-between">
                <div className="flex items-center space-x-8">
                    <button
                        onClick={() => navigate('/')}
                        className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all group shadow-xl"
                    >
                        <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-4">
                            {isEditing ? (
                                <div className="flex items-center space-x-4">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="text-4xl font-black bg-white/5 border-b-2 border-orange-500 outline-none px-2 py-1 italic uppercase tracking-tighter"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateProject()}
                                    />
                                    <button onClick={handleUpdateProject} className="p-2 bg-orange-500 rounded-xl text-black hover:bg-orange-400 transition-all">
                                        <Check size={20} />
                                    </button>
                                    <button onClick={() => { setIsEditing(false); setEditName(project.name); }} className="p-2 bg-white/10 rounded-xl text-white/40 hover:text-white transition-all">
                                        <X size={20} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-6 group">
                                    <h1 className="text-5xl font-black tracking-tighter italic uppercase bg-gradient-to-r from-orange-400 via-amber-500 to-rose-500 bg-clip-text text-transparent">{project.name}</h1>
                                    <button onClick={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/5 rounded-xl transition-all">
                                        <Edit3 size={18} className="text-orange-500/60" />
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-[9px] font-black text-orange-400 uppercase tracking-widest">
                                <Sparkles size={10} /> Active Connection
                            </div>
                        </div>
                        <p className="text-white/30 font-bold uppercase tracking-widest text-[10px] flex items-center italic">
                            <Network className="mr-2 text-orange-500/40" size={14} />
                            Distributed Synthetic Intelligence Environment
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleDeleteProject}
                        className="flex items-center space-x-3 px-6 py-4 bg-rose-500/5 hover:bg-rose-500/20 border border-rose-500/20 rounded-2xl text-rose-500 transition-all group active:scale-95"
                    >
                        <Trash2 size={18} className="group-hover:rotate-12 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Terminate Workspace</span>
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-10">
                {/* Left Panel: Datasets */}
                <div className="col-span-3 space-y-8">
                    <div className="glass-panel p-8 rounded-[3.5rem] border border-white/5 space-y-8 relative overflow-hidden">
                        <div className="flex justify-between items-center relative z-10">
                            <h2 className="text-sm font-black uppercase tracking-[0.2em] flex items-center text-white/60">
                                <Database className="mr-3 text-orange-500" size={18} /> Signal Vault
                            </h2>
                            <label className="cursor-pointer bg-white group hover:scale-110 active:scale-95 transition-all w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xl shadow-white/5">
                                <Upload className="text-black" size={16} />
                                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                            </label>
                        </div>

                        {uploading && (
                            <div className="flex items-center justify-center py-5 bg-orange-500/10 border border-orange-500/20 rounded-2xl animate-pulse">
                                <Activity className="animate-spin mr-3 text-orange-500" size={18} />
                                <span className="text-[10px] font-black text-orange-400 uppercase tracking-tighter">Uploading Signal...</span>
                            </div>
                        )}

                        <div className="space-y-3 relative z-10 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {datasets.map(ds => (
                                <div key={ds.id} className="group relative">
                                    <button
                                        onClick={() => setSelectedDataset(ds)}
                                        className={`w-full text-left p-4 rounded-2xl transition-all border relative overflow-hidden ${selectedDataset?.id === ds.id
                                            ? "bg-orange-500/10 border-orange-500/30 shadow-xl shadow-orange-500/5 translate-x-1"
                                            : "hover:bg-white/5 border-transparent hover:border-white/10"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between pointer-events-none relative z-10">
                                            <div className="truncate pr-6">
                                                <p className={`text-xs font-black uppercase tracking-tight transition-colors ${selectedDataset?.id === ds.id ? 'text-white italic' : 'text-white/30 group-hover:text-white/60'}`}>
                                                    {ds.name}
                                                </p>
                                            </div>
                                            {selectedDataset?.id === ds.id && (
                                                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_12px_#fbbf24] animate-pulse"></div>
                                            )}
                                        </div>
                                        {selectedDataset?.id === ds.id && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-full"></div>
                                        )}
                                    </button>
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (window.confirm(`Delete signal ${ds.name}?`)) {
                                                try {
                                                    await DatasetAPI.delete(ds.id);
                                                    if (selectedDataset?.id === ds.id) setSelectedDataset(null);
                                                    await loadDatasets();
                                                } catch (err) {
                                                    setError("Failed to delete dataset");
                                                }
                                            }
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 text-white/20 hover:text-rose-500 rounded-xl transition-all z-20"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Algorithm Selector Section */}
                    <div className="glass-panel p-8 rounded-[3.5rem] border border-white/5 space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Engine Bays</h3>
                        <div className="space-y-3">
                            {algorithms.map(algo => (
                                <button
                                    key={algo.id}
                                    onClick={() => setSelectedAlgorithm(algo.id)}
                                    className={`w-full text-left p-4 rounded-2xl transition-all border ${selectedAlgorithm === algo.id
                                        ? "bg-orange-500/5 border-orange-500/30 text-orange-400"
                                        : "border-transparent text-white/30 hover:bg-white/5 hover:text-white/60"
                                        }`}
                                >
                                    <p className="font-black uppercase tracking-widest text-[10px] mb-1">{algo.name}</p>
                                    <p className="opacity-50 text-[10px] font-medium leading-tight italic">{algo.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Fine-tune Settings */}
                    <div className="glass-panel p-8 rounded-[3.5rem] border border-white/5 space-y-6">
                        <button
                            onClick={() => setShowTuneSettings(!showTuneSettings)}
                            className="w-full flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white/60 transition-colors"
                        >
                            <span className="flex items-center gap-2"><Settings size={14} /> Parameters</span>
                            {showTuneSettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        {showTuneSettings && (
                            <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black tracking-widest text-white/20 uppercase">Epochs</label>
                                    <input
                                        type="number"
                                        value={hyperparams.epochs}
                                        onChange={(e) => setHyperparams({ ...hyperparams, epochs: parseInt(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-orange-500/50 outline-none transition-all font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black tracking-widest text-white/20 uppercase">Batch Size</label>
                                    <input
                                        type="number"
                                        value={hyperparams.batchSize}
                                        onChange={(e) => setHyperparams({ ...hyperparams, batchSize: parseInt(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-orange-500/50 outline-none transition-all font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black tracking-widest text-white/20 uppercase">Learning Rate</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={hyperparams.learningRate}
                                        onChange={(e) => setHyperparams({ ...hyperparams, learningRate: parseFloat(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-orange-500/50 outline-none transition-all font-bold"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Content Tabs */}
                <div className="col-span-9 space-y-10">
                    {selectedDataset ? (
                        <div className="space-y-10 animate-in slide-in-from-right-12 duration-700">
                            {/* Tabs Header */}
                            <div className="flex items-center space-x-8 border-b border-white/5 pb-4 px-2">
                                <TabButton
                                    active={activeTab === 'engines'}
                                    onClick={() => setActiveTab('engines')}
                                    icon={<Cpu size={18} />}
                                    label="Logic Engines"
                                />
                                <TabButton
                                    active={activeTab === 'analytics'}
                                    onClick={() => setActiveTab('analytics')}
                                    icon={<BarChart3 size={18} />}
                                    label="Data Insights"
                                />
                            </div>

                            {activeTab === 'engines' ? (
                                <div className="space-y-10">
                                    <div className="flex justify-between items-end px-2">
                                        <div className="space-y-2">
                                            <h2 className="text-4xl font-black tracking-tighter uppercase italic">Generative <span className="text-orange-500">Engines</span></h2>
                                            <p className="text-white/30 text-sm font-medium italic">Active algorithmic models learning from <span className="text-orange-400 font-black uppercase tracking-widest text-xs px-2 py-1 bg-orange-500/5 rounded-lg ml-1">{selectedDataset.name}</span></p>
                                        </div>
                                        <button
                                            onClick={handleTrain}
                                            className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white px-10 py-5 rounded-[1.75rem] font-black text-[11px] uppercase tracking-[0.2em] flex items-center space-x-3 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-orange-600/20 group"
                                        >
                                            <Brain className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                            <span>Train {selectedAlgorithm} Engine</span>
                                        </button>
                                    </div>

                                    <div className="grid gap-6">
                                        {models.length === 0 ? (
                                            <div className="glass-panel p-24 rounded-[3.5rem] border border-white/5 text-center relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-gradient-to-bm from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                                <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
                                                    <Cpu className="w-12 h-12 text-orange-400" />
                                                </div>
                                                <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white/60 mb-2">No Engines Deployed</h3>
                                                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Initiate training protocol to begin data synthesis</p>
                                            </div>
                                        ) : models.map(model => (
                                            <div key={model.id} className="glass-panel p-10 rounded-[3.5rem] border border-white/5 flex justify-between items-center group relative overflow-hidden transition-all hover:border-orange-500/20 hover:bg-white/[0.02]">
                                                <div className="flex items-center space-x-8 relative z-10">
                                                    <div className="w-20 h-20 rounded-[1.5rem] bg-white/[0.02] border border-white/10 flex items-center justify-center text-white/30 shadow-2xl group-hover:bg-orange-500/10 group-hover:text-orange-400 group-hover:rotate-3 transition-all duration-700">
                                                        {model.status === 'COMPLETED' ? <Cpu size={40} /> : <Activity className="animate-spin" size={40} />}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h4 className="text-2xl font-black tracking-tighter uppercase italic group-hover:text-orange-400 transition-colors">
                                                            {model.algorithm} <span className="text-white/20 text-sm font-black italic ml-3 tracking-widest uppercase">Bay #{model.id.toString().padStart(3, '0')}</span>
                                                        </h4>
                                                        <StatusBadge status={model.status} />
                                                    </div>
                                                </div>

                                                <div className="relative z-10">
                                                    {model.status === 'COMPLETED' && (
                                                        <button
                                                            onClick={() => handleGenerate(model.id)}
                                                            className="bg-white/5 hover:bg-orange-500 text-white/40 hover:text-white px-8 py-4 rounded-2xl flex items-center space-x-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 hover:shadow-xl hover:shadow-orange-500/20 group/btn border border-transparent hover:border-orange-400/50 active:scale-95"
                                                        >
                                                            <PlayCircle className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                                            <span>Run Synthesis</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-10 min-h-[600px] animate-in slide-in-from-bottom-12 duration-700 px-2">
                                    {loadingStats ? (
                                        <div className="flex flex-col items-center justify-center h-[500px] space-y-6">
                                            <div className="relative">
                                                <Activity className="animate-spin size-20 text-orange-500" />
                                                <Sparkles className="absolute -top-2 -right-2 text-amber-400 animate-pulse" />
                                            </div>
                                            <div className="text-center space-y-2">
                                                <p className="text-white font-black uppercase tracking-[0.5em] text-xs">Synthesizing Intelligence</p>
                                                <p className="text-white/20 font-black uppercase tracking-[0.3em] text-[9px]">Analyzing Multidimensional Data Patterns...</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <AnalyticsDashboard stats={stats} />
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white/[0.01] border border-dashed border-white/5 rounded-[4rem] h-[700px] flex flex-col items-center justify-center text-center p-24 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/[0.03] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                            <div className="w-32 h-32 bg-white/[0.02] rounded-[2.5rem] flex items-center justify-center mb-10 border border-white/5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 shadow-2xl">
                                <Fingerprint className="text-white/10 group-hover:text-orange-500/40 transition-colors" size={60} />
                            </div>
                            <h3 className="text-4xl font-black text-white/20 tracking-tighter uppercase italic mb-4">Signal Required</h3>
                            <p className="text-sm text-white/10 max-w-sm uppercase tracking-widest font-black leading-relaxed">Select a source signal from the repository to initialize engine bays and view intelligence insights.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center space-x-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all duration-500 relative
                ${active
                    ? "text-orange-400 bg-orange-500/10 shadow-xl shadow-orange-500/5 translate-y-[-2px]"
                    : "text-white/20 hover:text-white/60 hover:bg-white/5"
                }`}
        >
            <span className={active ? 'scale-110 transition-transform' : ''}>{icon}</span>
            <span>{label}</span>
            {active && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-orange-500/50 blur-sm"></div>
            )}
        </button>
    );
}

function StatusBadge({ status }) {
    switch (status) {
        case 'COMPLETED':
            return <span className="flex items-center text-[10px] font-black uppercase tracking-[0.3em] text-green-400/60 italic"><CheckCircle2 className="mr-2" size={12} /> Protocol: Stable</span>;
        case 'TRAINING':
            return <span className="flex items-center text-[10px] font-black uppercase tracking-[0.3em] text-orange-400/60 italic"><Activity className="animate-spin mr-2" size={12} /> Analysis: Learning</span>;
        case 'FAILED':
            return <span className="flex items-center text-[10px] font-black uppercase tracking-[0.3em] text-rose-500/60 italic"><AlertCircle className="mr-2" size={12} /> Protocol: Disrupted</span>;
        default:
            return <span className="flex items-center text-[10px] font-black uppercase tracking-[0.3em] text-white/20 italic"><Clock className="mr-2" size={12} /> Queue: Waiting</span>;
    }
}
