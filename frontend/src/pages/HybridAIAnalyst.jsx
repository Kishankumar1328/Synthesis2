import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
    BrainCircuit,
    Send,
    UploadCloud,
    FileText,
    Bot,
    Database,
    Search,
    Fingerprint,
    Zap,
    Cpu,
    X,
    Activity,
    AlertCircle,
    ChevronRight,
    Terminal,
    Network,
    Sparkles
} from 'lucide-react';

const HybridAIAnalyst = () => {
    const [datasetHistory, setDatasetHistory] = useState({
        'global': [
            {
                role: 'assistant',
                content: '### Welcome to the Hybrid AI Analyst\nSelect a dataset from the library or upload a new one to begin your analysis.',
                timestamp: new Date()
            }
        ]
    });
    const [selectedFileId, setSelectedFileId] = useState('global');
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [serviceStatus, setServiceStatus] = useState({ online: false, ollama: false, model: '', contextActive: false });
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        checkHealth();
        loadFiles();
        const interval = setInterval(checkHealth, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [datasetHistory, selectedFileId]);

    const checkHealth = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/health');
            const data = await response.json();
            setServiceStatus({
                online: true,
                ollama: data.ollama_running,
                model: data.model || 'Gemma Core',
                contextActive: selectedFileId !== 'global'
            });
        } catch (error) {
            setServiceStatus({ online: false, ollama: false, model: '', contextActive: false });
        }
    };

    const loadFiles = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/files');
            const data = await response.json();
            setUploadedFiles(data.files || []);
        } catch (error) {
            console.error('File sync failed');
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploadProgress({ filename: file.name, status: 'Uploading...' });
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://127.0.0.1:5000/upload', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (response.ok && data.status === 'success') {
                const analysis = data.analysis || {};
                const stats = analysis.basic_info || { rows: 0, columns: 0, file_type: 'CSV' };

                const initialContent = `### ✅ Analysis Successful: ${analysis.filename}\n\n**Dataset Overview:**\n- **Rows:** ${stats.rows?.toLocaleString() || 0}\n- **Columns:** ${stats.columns || 0}\n- **Quality Score:** ${analysis.quality_score || 0}/100\n- **Risks:** ${analysis.key_risks?.length || 0} detected\n\nI am now ready to answer your questions about this dataset. What would you like to know?`;

                setDatasetHistory(prev => ({
                    ...prev,
                    [data.file_id]: [{
                        role: 'assistant',
                        content: initialContent,
                        timestamp: new Date()
                    }]
                }));
                setSelectedFileId(data.file_id);
                loadFiles();
            } else {
                throw new Error(data.error || 'Upload failed');
            }
        } catch (e) {
            alert(`Upload failed: ${e.message}`);
        } finally {
            setUploadProgress(null);
            event.target.value = '';
        }
    };

    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const restrictedPatterns = /show rows|display data|print records|extract all|select \*|limit/i;
        if (restrictedPatterns.test(inputMessage)) {
            const warning = {
                role: 'assistant',
                content: '### 🛡️ Privacy Guard\nRaw data extraction is restricted to ensure privacy. I can provide statistical summaries, trends, and analytical insights.',
                timestamp: new Date()
            };
            setDatasetHistory(prev => ({
                ...prev,
                [selectedFileId]: [...(prev[selectedFileId] || []), { role: 'user', content: inputMessage, timestamp: new Date() }, warning]
            }));
            setInputMessage('');
            return;
        }

        const userMsg = { role: 'user', content: inputMessage, timestamp: new Date() };
        const currentId = selectedFileId;

        setDatasetHistory(prev => ({
            ...prev,
            [currentId]: [...(prev[currentId] || []), userMsg]
        }));

        setInputMessage('');
        setIsLoading(true);

        try {
            const response = await fetch('http://127.0.0.1:5000/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: inputMessage,
                    file_id: currentId === 'global' ? null : currentId
                })
            });
            const data = await response.json();

            setDatasetHistory(prev => ({
                ...prev,
                [currentId]: [...(prev[currentId] || []), {
                    role: 'assistant',
                    content: data.response || 'No response from engineer.',
                    timestamp: new Date()
                }]
            }));
        } catch (e) {
            setDatasetHistory(prev => ({
                ...prev,
                [currentId]: [...(prev[currentId] || []), {
                    role: 'assistant',
                    content: '❌ **Error:** Failed to connect to analysis engine.',
                    timestamp: new Date()
                }]
            }));
        } finally {
            setIsLoading(false);
        }
    };

    const currentMessages = datasetHistory[selectedFileId] || [];

    return (
        <div className="flex flex-col h-screen p-12 max-w-[1600px] mx-auto space-y-8 overflow-hidden animate-in fade-in duration-700">
            {/* Header */}
            <header className="flex items-center justify-between glass-panel p-8 rounded-[2.5rem] border border-white/5 shrink-0 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] group-hover:bg-orange-500/10 transition-all"></div>

                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 group-hover:scale-110 transition-transform shadow-xl">
                        <Cpu className="text-orange-400 w-8 h-8" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black tracking-tighter italic uppercase">Hybrid AI <span className="text-gradient-orange">Analyst</span></h1>
                            <div className="flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-[9px] font-black text-orange-400 uppercase tracking-widest">
                                <Sparkles size={10} /> Neural Bridge
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-[10px] font-black uppercase tracking-widest text-white/20 italic">
                            <span className="flex items-center gap-2"><div className={`w-1.5 h-1.5 rounded-full ${serviceStatus.online ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`}></div> Core: {serviceStatus.online ? 'Active' : 'Offline'}</span>
                            <div className="w-1 h-1 bg-white/10 rounded-full"></div>
                            <span className="flex items-center gap-2"><div className={`w-1.5 h-1.5 rounded-full ${serviceStatus.ollama ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' : 'bg-white/5'}`}></div> LLM: {serviceStatus.model || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white hover:bg-orange-50 text-black px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-2xl active:scale-95"
                    >
                        <UploadCloud className="w-4 h-4" /> Ingest New Signal
                    </button>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                </div>
            </header>

            <div className="flex-1 flex gap-8 min-h-0">
                {/* Dataset List */}
                <aside className="w-[350px] flex flex-col gap-6">
                    <div className="glass-panel flex-1 rounded-[3rem] border border-white/5 flex flex-col overflow-hidden group">
                        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-3">
                                <Database className="w-4 h-4 text-orange-500" /> Neural Registry
                            </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                            <button
                                onClick={() => setSelectedFileId('global')}
                                className={`w-full p-5 rounded-2xl text-left transition-all border relative overflow-hidden group/item ${selectedFileId === 'global' ? 'bg-orange-500/10 border-orange-500/30 shadow-xl' : 'bg-white/[0.01] border-transparent hover:bg-white/5'}`}
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`p-3 rounded-xl ${selectedFileId === 'global' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-white/20'}`}>
                                        <BrainCircuit className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <span className={`text-[11px] font-black uppercase tracking-tight block ${selectedFileId === 'global' ? 'text-white' : 'text-white/40'}`}>Universal Mode</span>
                                        <span className="text-[9px] text-white/20 uppercase font-bold tracking-widest">Global Context</span>
                                    </div>
                                </div>
                            </button>

                            {uploadedFiles.map(file => (
                                <button
                                    key={file.file_id}
                                    onClick={() => setSelectedFileId(file.file_id)}
                                    className={`w-full p-5 rounded-[1.5rem] text-left transition-all border group/item relative overflow-hidden ${selectedFileId === file.file_id ? 'bg-orange-500/10 border-orange-500/30' : 'bg-white/[0.01] border-transparent hover:bg-white/5'}`}
                                >
                                    <div className="flex items-center gap-4 mb-3 relative z-10">
                                        <div className={`p-3 rounded-xl ${selectedFileId === file.file_id ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-white/20'}`}>
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <span className={`text-[11px] font-black truncate uppercase tracking-tight ${selectedFileId === file.file_id ? 'text-white italic underline decoration-orange-500/30 decoration-2 underline-offset-4' : 'text-white/40'}`}>{file.filename}</span>
                                    </div>
                                    <div className="flex items-center gap-4 px-1 relative z-10">
                                        <span className="text-[8px] text-white/20 font-black uppercase tracking-widest">{file.rows.toLocaleString()} Records</span>
                                        <div className="w-1 h-1 bg-white/10 rounded-full"></div>
                                        <span className="text-[8px] text-orange-500/40 font-black uppercase tracking-widest">Score: {file.quality_score}%</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Chat Console */}
                <main className="flex-1 glass-panel rounded-[4rem] flex flex-col overflow-hidden relative border border-white/5 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.02] to-transparent pointer-events-none"></div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
                        {currentMessages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`flex gap-6 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xl ${msg.role === 'user' ? 'bg-white text-black border-white' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'}`}>
                                        {msg.role === 'user' ? <Fingerprint size={24} /> : <Bot size={24} />}
                                    </div>
                                    <div className={`p-8 rounded-[2.5rem] border shadow-2xl ${msg.role === 'user' ? 'bg-white/5 border-white/10 rounded-tr-none' : 'bg-orange-500/[0.02] border-orange-500/10 rounded-tl-none'}`}>
                                        <div className="prose prose-invert prose-sm max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-headings:italic prose-p:font-medium prose-p:leading-relaxed prose-p:text-white/70">
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                        <p className="mt-4 text-[8px] font-black uppercase tracking-widest text-white/10">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-center gap-5 text-orange-400/40 animate-pulse">
                                <div className="w-12 h-12 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex items-center justify-center">
                                    <Activity className="w-6 h-6 animate-spin" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.5em] italic">Synthesizing Insight...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-8 bg-white/[0.01] border-t border-white/5">
                        <div className="max-w-5xl mx-auto flex gap-4">
                            <div className="flex-1 relative">
                                <Terminal className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500/30" />
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-8 py-5 outline-none focus:ring-2 ring-orange-500/40 transition-all text-white placeholder-white/20 font-bold"
                                    placeholder="Enter analytical query or command..."
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                    disabled={isLoading}
                                />
                            </div>
                            <button
                                onClick={sendMessage}
                                disabled={isLoading || !inputMessage.trim()}
                                className="w-16 h-16 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white flex items-center justify-center transition-all disabled:opacity-20 shadow-xl shadow-orange-500/20 active:scale-95 group/send"
                            >
                                <Send className="w-7 h-7 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default HybridAIAnalyst;
