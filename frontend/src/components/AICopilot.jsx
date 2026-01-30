import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AICopilot = ({ isOpen, onClose, datasetInfo = null, statistics = null }) => {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: '👋 Hi! I\'m your AI Data Analyst. I can help you understand your datasets, analyze data quality, detect patterns, and provide insights. What would you like to know?',
            timestamp: new Date()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [serviceStatus, setServiceStatus] = useState({ online: false, model: '' });
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Check AI service health on mount
    useEffect(() => {
        checkServiceHealth();
    }, []);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    const checkServiceHealth = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/health');
            const data = await response.json();
            setServiceStatus({
                online: data.status === 'online' && data.ollama_running,
                model: data.model || 'Unknown'
            });
        } catch (error) {
            console.error('AI Service health check failed:', error);
            setServiceStatus({ online: false, model: '' });
        }
    };

    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage = {
            role: 'user',
            content: inputMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            // Determine which endpoint to use
            const endpoint = datasetInfo || statistics
                ? 'http://127.0.0.1:5000/analyze'
                : 'http://127.0.0.1:5000/chat';

            const payload = datasetInfo || statistics
                ? {
                    query: inputMessage,
                    statistics: statistics,
                    datasetInfo: datasetInfo
                }
                : {
                    message: inputMessage
                };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            const assistantMessage = {
                role: 'assistant',
                content: data.response || data.error || 'Sorry, I couldn\'t process that request.',
                timestamp: new Date(),
                model: data.model
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage = {
                role: 'assistant',
                content: '❌ Sorry, I\'m having trouble connecting to the AI service. Please make sure the AI Copilot service is running on port 5000.',
                timestamp: new Date(),
                isError: true
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const suggestedQuestions = [
        "What can you tell me about this dataset?",
        "Are there any missing values?",
        "What's the data quality score?",
        "Can you identify any patterns?",
        "What are the key features?",
        "Suggest data cleaning steps"
    ];

    const handleSuggestedQuestion = (question) => {
        setInputMessage(question);
        inputRef.current?.focus();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="glass-panel rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="relative px-6 py-4 border-b border-white/10 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                        <i className='bx bx-brain text-2xl text-white'></i>
                                    </div>
                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-900 ${serviceStatus.online ? 'bg-green-500' : 'bg-red-500'
                                        }`}></div>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                        AI Data Analyst
                                    </h2>
                                    <p className="text-xs text-gray-400 flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${serviceStatus.online ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                                        {serviceStatus.online ? `Online • ${serviceStatus.model}` : 'Offline'}
                                        {datasetInfo && <span className="ml-2">• Dataset Context Active</span>}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-lg glass-button flex items-center justify-center hover:bg-red-500/20 transition-all group"
                            >
                                <i className='bx bx-x text-2xl group-hover:text-red-400'></i>
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                        {messages.map((message, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                                {/* Avatar */}
                                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${message.role === 'user'
                                        ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                        : message.isError
                                            ? 'bg-gradient-to-br from-red-500 to-orange-600'
                                            : 'bg-gradient-to-br from-blue-500 to-purple-600'
                                    }`}>
                                    <i className={`bx ${message.role === 'user' ? 'bx-user' : message.isError ? 'bx-error' : 'bx-brain'} text-xl text-white`}></i>
                                </div>

                                {/* Message Bubble */}
                                <div className={`flex-1 max-w-[75%] ${message.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                    <div className={`px-4 py-3 rounded-2xl ${message.role === 'user'
                                            ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30'
                                            : message.isError
                                                ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30'
                                                : 'glass-panel'
                                        }`}>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                    </div>
                                    <span className="text-xs text-gray-500 px-2">
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {message.model && <span className="ml-2">• {message.model}</span>}
                                    </span>
                                </div>
                            </motion.div>
                        ))}

                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex gap-3"
                            >
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    <i className='bx bx-brain text-xl text-white'></i>
                                </div>
                                <div className="glass-panel px-4 py-3 rounded-2xl">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggested Questions */}
                    {messages.length === 1 && !isLoading && (
                        <div className="px-6 pb-4">
                            <p className="text-xs text-gray-400 mb-2">💡 Suggested questions:</p>
                            <div className="flex flex-wrap gap-2">
                                {suggestedQuestions.slice(0, datasetInfo ? 6 : 3).map((question, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSuggestedQuestion(question)}
                                        className="px-3 py-1.5 text-xs glass-button rounded-lg hover:scale-105 transition-all"
                                    >
                                        {question}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="px-6 py-4 border-t border-white/10 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5">
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <textarea
                                    ref={inputRef}
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder={serviceStatus.online ? "Ask me anything about your data..." : "AI service is offline..."}
                                    disabled={!serviceStatus.online}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none custom-scrollbar disabled:opacity-50 disabled:cursor-not-allowed"
                                    rows="2"
                                />
                                <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                                    Press Enter to send
                                </div>
                            </div>
                            <button
                                onClick={sendMessage}
                                disabled={!inputMessage.trim() || isLoading || !serviceStatus.online}
                                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                            >
                                <i className='bx bx-send text-xl'></i>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AICopilot;
