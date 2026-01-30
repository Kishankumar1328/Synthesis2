import React, { useState } from 'react';
import { Upload, FileText, Download, Trash2, BarChart3, AlertCircle, Sparkles } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { useDatasets } from '../hooks/useDatasets';

export default function Datasets() {
    const { projects, loading: projectLoading, error: projectError, refresh: refreshProjects } = useProjects();
    const activeProject = projects[0];
    const {
        datasets,
        loading: datasetsLoading,
        uploadDataset,
        deleteDataset,
        refresh: refreshDatasets
    } = useDatasets(activeProject?.id);

    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) setSelectedFile(file);
    };

    const handleUpload = async () => {
        if (!selectedFile || !activeProject) return;
        setUploading(true);
        try {
            await uploadDataset(selectedFile);
            setSelectedFile(null);
        } catch (e) {
            alert('Upload failed.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this dataset?')) return;
        try {
            await deleteDataset(id);
        } catch (e) {
            console.error('Delete failed:', e);
        }
    };

    return (
        <div className="p-12 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <header className="flex justify-between items-end">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-2xl w-fit">
                        <Sparkles className="w-4 h-4 text-orange-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Signal Repository</span>
                    </div>
                    <h1 className="text-6xl font-black tracking-tighter italic">
                        Signal <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-500 to-rose-500">Library</span>
                    </h1>
                    <p className="text-white/40 text-lg font-medium max-w-2xl">
                        Ingest and manage data signals for neural training and analysis.
                    </p>
                </div>
            </header>

            {projectError && (
                <div className="glass-panel p-8 rounded-[2.5rem] border border-red-500/20 bg-red-500/5 flex items-start gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                        <AlertCircle className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-red-400 uppercase tracking-tight">Signal Interrupted</h3>
                        <p className="text-white/40 mt-1">{projectError}</p>
                        <button onClick={refreshProjects} className="mt-4 px-6 py-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">Retry Protocol</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload Section */}
                <div className="lg:col-span-1">
                    <div className="glass-panel p-8 rounded-[3rem] border border-white/5 space-y-8 h-full relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-orange-500/10 transition-all"></div>

                        <h2 className="text-xl font-black uppercase tracking-widest text-white/60 flex items-center gap-3">
                            <Upload className="w-5 h-5 text-orange-500" /> Ingest Data
                        </h2>

                        <div className="border-2 border-dashed border-white/5 bg-white/[0.01] rounded-[2.5rem] p-12 text-center hover:border-orange-500/30 hover:bg-white/[0.03] transition-all group/box">
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                accept=".csv,.json,.xlsx"
                                onChange={handleFileSelect}
                            />
                            <label htmlFor="file-upload" className="cursor-pointer space-y-6 block">
                                <div className="w-20 h-20 bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-3xl flex items-center justify-center mx-auto transition-transform group-hover/box:scale-110 shadow-2xl shadow-orange-500/5">
                                    <Upload className="w-10 h-10 text-orange-400 group-hover/box:animate-bounce" />
                                </div>
                                <div className="space-y-2">
                                    <p className="font-black text-lg tracking-tight truncate px-4">{selectedFile ? selectedFile.name : 'Choose Signal'}</p>
                                    <p className="text-[10px] text-white/20 uppercase font-black tracking-[0.3em]">CSV • JSON • EXCEL</p>
                                </div>
                            </label>
                        </div>

                        {selectedFile && (
                            <div className="space-y-4 animate-in slide-in-from-bottom-4">
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="w-full py-5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black rounded-2xl text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 active:scale-95"
                                >
                                    {uploading ? 'Processing Signal...' : 'Confirm Ingestion'}
                                </button>
                                <button
                                    onClick={() => setSelectedFile(null)}
                                    className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors"
                                >
                                    Cancel Protocol
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Library List */}
                <div className="lg:col-span-2">
                    <div className="glass-panel p-10 rounded-[3.5rem] border border-white/5 space-y-10">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black uppercase tracking-widest text-white/60">Registry</h2>
                            <div className="flex items-center gap-3 px-5 py-2 bg-white/5 border border-white/5 rounded-2xl">
                                <BarChart3 className="w-4 h-4 text-orange-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{datasets.length} Signals Active</span>
                            </div>
                        </div>

                        {datasets.length === 0 ? (
                            <div className="py-32 text-center opacity-20">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FileText className="w-10 h-10" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.5em]">No Data Signals Detected</p>
                            </div>
                        ) : (
                            <div className="space-y-4 custom-scrollbar max-h-[600px] overflow-y-auto pr-4">
                                {datasets.map((dataset) => (
                                    <div key={dataset.id} className="p-6 rounded-[2.5rem] bg-white/[0.01] border border-white/5 hover:border-orange-500/20 hover:bg-white/[0.04] transition-all flex items-center justify-between group">
                                        <div className="flex items-center gap-8">
                                            <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-amber-500/10 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform group-hover:rotate-3 shadow-xl">
                                                <FileText className="w-8 h-8 text-orange-400" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="font-black text-2xl italic tracking-tight uppercase group-hover:text-orange-400 transition-colors leading-none">{dataset.name}</h3>
                                                <div className="flex items-center gap-4">
                                                    <p className="text-[9px] text-white/20 font-black uppercase tracking-widest">
                                                        Vault Entry: {new Date(dataset.uploadedAt).toLocaleDateString()}
                                                    </p>
                                                    <div className="w-1 h-1 bg-amber-500/30 rounded-full"></div>
                                                    <p className="text-[9px] text-orange-500/50 font-black uppercase tracking-widest italic">Verified Protocol</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button className="w-12 h-12 bg-white/5 hover:bg-orange-500/10 rounded-2xl transition-all flex items-center justify-center border border-transparent hover:border-orange-500/20 active:scale-90" title="Download">
                                                <Download className="w-5 h-5 text-orange-400" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(dataset.id)}
                                                className="w-12 h-12 bg-white/5 hover:bg-red-500/10 rounded-2xl transition-all flex items-center justify-center border border-transparent hover:border-red-500/20 active:scale-90"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-5 h-5 text-red-500/60" />
                                            </button>
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
