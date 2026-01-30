import React, { useState, useEffect } from 'react';
import { Brain, Zap, Download, TrendingUp, CheckCircle, Clock, XCircle, Sparkles, FileText } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { useDatasets } from '../hooks/useDatasets';
import { useAI } from '../hooks/useAI';

export default function AITraining() {
    const { projects } = useProjects();
    const activeProject = projects[0];
    const { datasets } = useDatasets(activeProject?.id);
    const {
        isTraining,
        currentModel,
        models: trainedModels,
        trainModel,
        generateData,
        loadModels
    } = useAI();

    const [selectedDataset, setSelectedDataset] = useState(null);
    const [algorithm, setAlgorithm] = useState('CTGAN');
    const [hyperparameters, setHyperparameters] = useState({
        epochs: 300,
        batch_size: 500,
        learning_rate: 0.0002
    });

    useEffect(() => {
        if (selectedDataset) {
            loadModels(selectedDataset);
        }
    }, [selectedDataset, loadModels]);

    const handleTrainModel = async () => {
        if (!selectedDataset) {
            alert('Please select a dataset first');
            return;
        }

        try {
            await trainModel(selectedDataset, algorithm, {
                epochs: hyperparameters.epochs,
                batchSize: hyperparameters.batch_size,
                learningRate: hyperparameters.learning_rate
            });
            alert('Training sequence initiated.');
        } catch (e) {
            console.error('Training failed:', e);
            alert('Protocol error: Training failed.');
        }
    };

    const handleGenerateDataUI = async (modelId) => {
        const count = prompt('How many records to generate?', '1000');
        if (!count) return;
        try {
            await generateData(modelId, parseInt(count));
        } catch (e) {
            alert('Data synthesis failed.');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'TRAINING':
            case 'PENDING': return <Clock className="w-5 h-5 text-orange-400 animate-spin" />;
            case 'FAILED': return <XCircle className="w-5 h-5 text-rose-500" />;
            default: return <Clock className="w-5 h-5 text-white/20" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'COMPLETED': return 'text-green-400 border-green-500/20 bg-green-500/5';
            case 'TRAINING':
            case 'PENDING': return 'text-orange-400 border-orange-500/20 bg-orange-500/5';
            case 'FAILED': return 'text-rose-400 border-rose-500/20 bg-rose-500/5';
            default: return 'text-white/20 border-white/10 bg-white/5';
        }
    };

    return (
        <div className="p-12 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <header className="space-y-4">
                <div className="flex items-center gap-3 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-2xl w-fit">
                    <Sparkles className="w-4 h-4 text-orange-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Neural Synthesis</span>
                </div>
                <h1 className="text-6xl font-black tracking-tighter italic">
                    Neural <span className="text-gradient-orange">Training</span>
                </h1>
                <p className="text-white/40 text-lg font-medium max-w-2xl">
                    Configure and deploy generative models for high-fidelity synthetic data production.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Panel */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="glass-panel p-10 rounded-[3rem] border border-white/5 space-y-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-orange-500/10 transition-all"></div>

                        <h2 className="text-xl font-black uppercase tracking-widest text-white/60 flex items-center gap-4">
                            <Brain className="w-6 h-6 text-orange-500" /> Engine Config
                        </h2>

                        <div className="space-y-6 relative z-10 text-white">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Target Signal</label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500/50" />
                                    <select
                                        value={selectedDataset || ''}
                                        onChange={(e) => setSelectedDataset(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 focus:ring-2 ring-orange-500/40 outline-none appearance-none transition-all font-bold text-xs"
                                    >
                                        <option value="" className="bg-[#05070a]">Select Signal...</option>
                                        {datasets.map((dataset) => (
                                            <option key={dataset.id} value={dataset.id} className="bg-[#05070a]">
                                                {dataset.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Protocol</label>
                                <select
                                    value={algorithm}
                                    onChange={(e) => setAlgorithm(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 focus:ring-2 ring-orange-500/40 outline-none appearance-none transition-all font-bold text-xs"
                                >
                                    <option value="CTGAN" className="bg-[#05070a]">CTGAN (Optimized)</option>
                                    <option value="TVAE" className="bg-[#05070a]">TVAE (Efficiency)</option>
                                    <option value="GaussianCopula" className="bg-[#05070a]">Gaussian Copula</option>
                                    <option value="CopulaGAN" className="bg-[#05070a]">Copula GAN</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Epochs</label>
                                    <input
                                        type="number"
                                        value={hyperparameters.epochs}
                                        onChange={(e) => setHyperparameters({ ...hyperparameters, epochs: parseInt(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 focus:ring-2 ring-orange-500/40 outline-none transition-all font-bold text-xs"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Batch</label>
                                    <input
                                        type="number"
                                        value={hyperparameters.batch_size}
                                        onChange={(e) => setHyperparameters({ ...hyperparameters, batch_size: parseInt(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 focus:ring-2 ring-orange-500/40 outline-none transition-all font-bold text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleTrainModel}
                            disabled={isTraining || !selectedDataset}
                            className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-xl shadow-orange-600/20 disabled:opacity-50 active:scale-95 group/btn"
                        >
                            {isTraining ? (
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Synthesizing...
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-3">
                                    <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    Launch Training
                                </div>
                            )}
                        </button>
                    </div>

                    {currentModel && (
                        <div className="glass-panel p-8 rounded-[2.5rem] border border-orange-500/20 bg-orange-500/5 animate-in slide-in-from-bottom-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-400/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-orange-400/20 transition-all"></div>
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-6 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></div> Pulse Indicator
                            </h3>
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-orange-400/10 flex items-center justify-center border border-orange-400/20">
                                    {getStatusIcon(currentModel.status)}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <p className="font-black text-xl italic tracking-tight uppercase leading-none">{currentModel.algorithm}</p>
                                    <p className="text-[10px] text-orange-400/60 font-black uppercase tracking-widest italic">{currentModel.status}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Registry Panel */}
                <div className="lg:col-span-2">
                    <div className="glass-panel p-10 rounded-[3.5rem] border border-white/5 space-y-10 min-h-[600px]">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black uppercase tracking-widest text-white/60">Engine Hub</h2>
                            <div className="flex items-center gap-3 px-5 py-2 bg-white/5 border border-white/5 rounded-2xl">
                                <TrendingUp className="w-4 h-4 text-orange-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{trainedModels.length} Models Active</span>
                            </div>
                        </div>

                        {trainedModels.length === 0 ? (
                            <div className="py-32 text-center opacity-20">
                                <div className="w-24 h-24 mx-auto mb-8 rounded-[2.5rem] bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                                    <Brain className="w-12 h-12" />
                                </div>
                                <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2">No Engines Registered</h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Initialize training sequence to begin</p>
                            </div>
                        ) : (
                            <div className="space-y-4 custom-scrollbar max-h-[700px] overflow-y-auto pr-4">
                                {trainedModels.map((model) => (
                                    <div
                                        key={model.id}
                                        className="p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/5 hover:border-orange-500/20 hover:bg-white/[0.04] transition-all flex items-center justify-between group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/[0.02] rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-orange-500/[0.05] transition-all"></div>

                                        <div className="flex items-center gap-8 relative z-10">
                                            <div className="w-20 h-20 bg-gradient-to-br from-orange-500/20 to-amber-500/10 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform group-hover:rotate-6 shadow-xl">
                                                {getStatusIcon(model.status)}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-4">
                                                    <h3 className="font-black text-3xl italic tracking-tighter uppercase leading-none group-hover:text-orange-400 transition-colors">#{model.id.toString().padStart(4, '0')}</h3>
                                                    <span className={`text-[8px] px-3 py-1 rounded-lg font-black uppercase tracking-widest border ${getStatusColor(model.status)}`}>
                                                        {model.status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <p className="text-[10px] text-white/30 font-black uppercase tracking-widest italic">{model.algorithm}</p>
                                                    <div className="w-1 h-1 bg-white/10 rounded-full"></div>
                                                    <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">{new Date(model.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="relative z-10">
                                            {model.status === 'COMPLETED' && (
                                                <button
                                                    onClick={() => handleGenerateDataUI(model.id)}
                                                    className="px-8 py-4 bg-white/5 hover:bg-orange-500 text-white/60 hover:text-white rounded-[1.25rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-transparent hover:border-orange-400/50 shadow-xl hover:shadow-orange-500/20 active:scale-95 flex items-center gap-3"
                                                >
                                                    <Download size={14} /> Synthesize
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
