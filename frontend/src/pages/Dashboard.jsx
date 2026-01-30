import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { PlusCircle, FolderOpen, Calendar, ArrowRight, Sparkles, Terminal, Trash2, Edit3, Check, X } from 'lucide-react';

export default function Dashboard() {
    const { projects, createProject, deleteProject, updateProject } = useProjects();
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState("");
    const navigate = useNavigate();

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createProject(newName);
            setNewName("");
            setIsCreating(false);
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm("CRITICAL: Terminate this workspace? All associated signal data and models will be permanently purged.")) {
            try {
                await deleteProject(id);
            } catch (err) {
                console.error(err);
            }
        }
    };

    const startEdit = (e, project) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingId(project.id);
        setEditValue(project.name);
    };

    const handleUpdate = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await updateProject(id, editValue);
            setEditingId(null);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="p-12 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <header className="flex justify-between items-end">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-2xl w-fit">
                        <Sparkles className="w-4 h-4 text-orange-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Control Center</span>
                    </div>
                    <h1 className="text-6xl font-black tracking-tighter italic">
                        Digital <span className="text-gradient-orange">Workspaces</span>
                    </h1>
                    <p className="text-white/40 text-lg font-medium max-w-2xl">
                        Orchestrate and manage neural environments for high-fidelity data synthesis.
                    </p>
                </div>

                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center space-x-3 px-10 py-5 bg-white hover:bg-orange-50 text-black font-black rounded-[1.5rem] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/5 uppercase text-[11px] tracking-widest group"
                >
                    <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                    <span>Init Workspace</span>
                </button>
            </header>

            {isCreating && (
                <div className="glass-panel p-10 rounded-[3rem] border border-orange-500/20 bg-orange-500/5 animate-in slide-in-from-top-8 duration-700">
                    <form onSubmit={handleCreate} className="flex gap-6">
                        <div className="flex-1 relative">
                            <Terminal className="absolute left-6 top-1/2 -translate-y-1/2 text-xl text-orange-500/50" />
                            <input
                                autoFocus
                                className="w-full bg-white/5 border border-white/10 rounded-[1.25rem] pl-16 pr-6 py-5 focus:ring-2 ring-orange-500/40 outline-none transition-all placeholder:text-white/20 font-bold"
                                placeholder="Workspace Identifier (e.g. Neural_Net_Alpha)"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                            />
                        </div>
                        <button className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white px-12 py-5 rounded-[1.25rem] font-black uppercase tracking-widest transition-all shadow-xl shadow-orange-600/20 active:scale-95">Deploy</button>
                        <button onClick={() => setIsCreating(false)} type="button" className="px-8 py-5 text-white/40 font-black uppercase tracking-widest hover:text-white transition-colors text-[10px]">Cancel</button>
                    </form>
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {projects.map(project => (
                    <div
                        key={project.id}
                        className="group relative"
                    >
                        <Link
                            to={`/project/${project.id}`}
                            className="block glass-panel p-10 rounded-[3.5rem] border border-white/5 hover:border-orange-500/30 transition-all duration-700 relative overflow-hidden flex flex-col justify-between min-h-[380px]"
                        >
                            {/* Interactive Background */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px] group-hover:bg-orange-500/15 transition-all duration-700"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-[60px] group-hover:bg-amber-500/10 transition-all duration-700"></div>

                            <div className="space-y-10 relative z-10">
                                <div className="w-20 h-20 rounded-[1.75rem] bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center text-white/40 group-hover:from-orange-500 group-hover:to-amber-600 group-hover:text-white group-hover:border-transparent transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 shadow-2xl transform-gpu">
                                    <FolderOpen className="w-10 h-10" />
                                </div>

                                <div className="space-y-4">
                                    {editingId === project.id ? (
                                        <div className="flex items-center gap-2" onClick={e => e.preventDefault()}>
                                            <input
                                                autoFocus
                                                value={editValue}
                                                onChange={e => setEditValue(e.target.value)}
                                                className="bg-white/5 border-b border-orange-500 text-xl font-bold p-1 italic uppercase outline-none w-full"
                                                onKeyDown={e => e.key === 'Enter' && handleUpdate(e, project.id)}
                                            />
                                            <button onClick={e => handleUpdate(e, project.id)} className="p-1.5 bg-orange-500 rounded-lg text-black hover:bg-orange-400">
                                                <Check size={14} />
                                            </button>
                                            <button onClick={e => { e.preventDefault(); setEditingId(null); }} className="p-1.5 bg-white/10 rounded-lg text-white/40 hover:text-white">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <h3 className="text-3xl font-black italic tracking-tighter leading-tight group-hover:text-orange-400 transition-colors uppercase truncate">
                                            {project.name}
                                        </h3>
                                    )}

                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center text-[10px] text-white/30 font-black uppercase tracking-widest">
                                            <Calendar className="w-4 h-4 mr-2 text-orange-500/40" />
                                            {new Date(project.createdAt).toLocaleDateString()}
                                        </div>
                                        <div className="w-1 h-1 bg-white/10 rounded-full"></div>
                                        <div className="text-[9px] font-black text-orange-500/40 uppercase tracking-widest italic group-hover:text-orange-400/60 transition-colors">Neural Bay Active</div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 flex justify-between items-end relative z-10">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-10 h-10 rounded-full bg-white/5 border-4 border-[#0a0c10] flex items-center justify-center text-[8px] font-black text-white/20 group-hover:border-white/10 transition-all group-hover:text-orange-400">
                                            AI
                                        </div>
                                    ))}
                                </div>

                                <div className="w-14 h-14 bg-white/5 group-hover:bg-orange-500 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(249,115,22,0.3)]">
                                    <ArrowRight className="w-7 h-7 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>

                            {/* ID Badge */}
                            <div className="absolute top-10 right-10 text-[8px] font-black text-white/10 uppercase tracking-widest px-3 py-1 border border-white/5 rounded-full group-hover:text-white/30 transition-colors">
                                Ref: {project.id}
                            </div>
                        </Link>

                        {/* Hover Actions */}
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 z-20 group-hover:-translate-y-4">
                            <button
                                onClick={(e) => startEdit(e, project)}
                                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/60 hover:text-orange-400 transition-all backdrop-blur-md"
                                title="Edit Name"
                            >
                                <Edit3 size={16} />
                            </button>
                            <button
                                onClick={(e) => handleDelete(e, project.id)}
                                className="p-3 bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/20 rounded-2xl text-white/60 hover:text-rose-500 transition-all backdrop-blur-md"
                                title="Delete Workspace"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
