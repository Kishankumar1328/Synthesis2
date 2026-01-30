
import { useState, useRef, useEffect } from 'react';
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
    AlertCircle
} from 'lucide-react';

const AICopilotHybrid = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: '### Neural Engine Ready\nHow can I help you analyze your datasets today? Please upload a file or select one from the library.',
            timestamp: new Date()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [serviceStatus, setServiceStatus] = useState({ online: false, ollama: false, model: '' });
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [selectedFileId, setSelectedFileId] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        checkServiceHealth();
        loadUploadedFiles();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const checkServiceHealth = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/health');
            const data = await response.json();
            setServiceStatus({
                online: true,
                ollama: data.ollama_running,
                model: data.model || 'Gemma Core'
            });
        } catch (error) {
            setServiceStatus({ online: false, ollama: false, model: '' });
        }
    };

    const loadUploadedFiles = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/files');
            const data = await response.json();
            setUploadedFiles(data.files || []);
        } catch (error) {
            console.error('Error loading files:', error);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploadProgress({ filename: file.name, status: 'Analyzing...' });

        try {
            const response = await fetch('http://127.0.0.1:5000/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                const analysis = data.analysis || {};
                const stats = analysis.basic_info || { rows: 0, columns: 0, file_type: 'Unknown' };

                const successMessage = {
                    role: 'assistant',
                    content: `### ✅ Dataset Ingested Successfully\n\n**Analysis Overview:**\n- **File:** ${analysis.filename}\n- **Format:** ${stats.file_type}\n- **Dimensions:** ${stats.rows?.toLocaleString() || 0} rows × ${stats.columns || 0} columns\n- **Data Quality:** ${analysis.quality_score || 0}/100\n- **Risk Status:** ${analysis.status === 'FAILED' ? '❌ Failed' : (analysis.key_risks?.length > 0 ? '⚠️ Review Needed' : '✅ Healthy')}\n\nYou can now ask questions about this dataset.`,
                    timestamp: new Date()
                };

                setMessages(prev => [...prev, successMessage]);
                setSelectedFileId(data.file_id);
                loadUploadedFiles();
            } else {
                throw new Error(data.error || 'The analysis engine encountered an issue.');
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `❌ **Upload Error:** ${error.message}`,
                timestamp: new Date(),
                isError: true
            }]);
        } finally {
            setUploadProgress(null);
            event.target.value = '';
        }
    };

    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const restrictedPatterns = /show rows|display data|print records|extract all|select \*|limit/i;
        if (restrictedPatterns.test(inputMessage)) {
            setMessages(prev => [...prev,
            { role: 'user', content: inputMessage, timestamp: new Date() },
            {
                role: 'assistant',
                content: '### 🛡️ Privacy Restriction\n\nRaw record extraction is prohibited to maintain data privacy. I can provide **statistical insights**, **summaries**, and **recommendations** based on the data.',
                timestamp: new Date(),
                isWarning: true
            }
            ]);
            setInputMessage('');
            return;
        }

        const userMessage = { role: 'user', content: inputMessage, timestamp: new Date() };
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const response = await fetch('http://127.0.0.1:5000/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: inputMessage,
                    file_id: selectedFileId
                })
            });

            const data = await response.json();

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response || 'I apologize, the engine failed to respond.',
                timestamp: new Date()
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '❌ **Connection Error.** Please check if the AI service is running.',
                timestamp: new Date(),
                isError: true
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="w-full max-w-5xl h-[80vh] flex bg-[#111827] rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Library Sidebar */}
                    <div className="w-72 border-r border-white/5 flex flex-col bg-black/20">
                        <div className="p-6 border-b border-white/5">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                                <Database className="w-4 h-4 text-orange-500" /> Dataset Library
                            </h2>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                            {uploadedFiles.map((file) => (
                                <button
                                    key={file.file_id}
                                    onClick={() => setSelectedFileId(file.file_id)}
                                    className={`w-full p-4 rounded-xl text-left transition-all border ${selectedFileId === file.file_id
                                        ? 'bg-orange-500/10 border-orange-500/50'
                                        : 'bg-white/5 border-transparent hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 mb-1">
                                        <FileText className={`w-4 h-4 ${selectedFileId === file.file_id ? 'text-orange-500' : 'text-white/40'}`} />
                                        <span className="text-sm font-bold truncate">{file.filename}</span>
                                    </div>
                                    <div className="text-[10px] text-white/40">
                                        {file.rows.toLocaleString()} Rows • Quality: {file.quality_score}%
                                    </div>
                                </button>
                            ))}

                            {uploadedFiles.length === 0 && (
                                <div className="py-20 text-center opacity-20">
                                    <Search className="w-8 h-8 mx-auto mb-2" />
                                    <p className="text-[10px] font-bold uppercase">No Files</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-white/5">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                            >
                                <UploadCloud className="w-4 h-4" /> Upload File
                            </button>
                            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col bg-gradient-to-b from-[#111827] to-[#0a0c10]">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                                    <Cpu className="text-orange-500 w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold">Neural Co-Pilot</h2>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${serviceStatus.online ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                        <span className="text-[10px] text-white/40 uppercase font-bold">{serviceStatus.model || 'Disconnected'}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <X className="w-5 h-5 text-white/40" />
                            </button>
                        </div>

                        {/* Message Feed */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-lg ${msg.role === 'user' ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white border-orange-400' : 'bg-white/5 border-white/10 text-orange-400'}`}>
                                            {msg.role === 'user' ? <Fingerprint size={18} /> : <Bot size={18} />}
                                        </div>
                                        <div className={`p-5 rounded-2xl border ${msg.role === 'user' ? 'bg-orange-500/5 border-orange-500/20 rounded-tr-none' : 'bg-white/[0.03] border-white/10 rounded-tl-none'}`}>
                                            <div className="prose prose-invert prose-sm max-w-none prose-headings:font-bold prose-headings:tracking-tight">
                                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-6 border-t border-white/5">
                            <form
                                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                                className="relative flex items-center gap-3"
                            >
                                <input
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    placeholder={selectedFileId ? "Ask about your data..." : "Select a file to start analysis..."}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 ring-orange-500/50 transition-all font-medium text-sm"
                                    disabled={isLoading}
                                    ref={inputRef}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !inputMessage.trim()}
                                    className="p-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl transition-all disabled:opacity-50 disabled:grayscale shadow-lg shadow-orange-500/20 active:scale-95"
                                >
                                    <Send size={20} />
                                </button>
                            </form>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AICopilotHybrid;
