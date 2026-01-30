import { useState } from 'react';
import { motion } from 'framer-motion';
import AICopilotButton from '../components/AICopilotButton';

const AICopilotDemo = () => {
    const [activeTab, setActiveTab] = useState('overview');

    const features = [
        {
            icon: 'bx-analyse',
            title: 'Deterministic Analysis',
            description: 'Automatic statistical analysis with quality scoring, outlier detection, and correlation analysis',
            color: 'from-teal-500 to-emerald-500'
        },
        {
            icon: 'bx-brain',
            title: 'LLM Intelligence',
            description: 'Context-aware AI responses powered by Gemma 3:4b with no hallucinations',
            color: 'from-cyan-500 to-teal-500'
        },
        {
            icon: 'bx-shield-quarter',
            title: 'Data Governance',
            description: 'Automatic PII detection, sensitive field protection, and privacy-first design',
            color: 'from-emerald-500 to-green-500'
        },
        {
            icon: 'bx-data',
            title: 'Multi-Format Support',
            description: 'Upload and analyze CSV, Excel, and JSON files with automatic format detection',
            color: 'from-orange-500 to-red-500'
        }
    ];

    const capabilities = [
        { category: 'File Analysis', items: ['Schema Detection', 'Missing Value Analysis', 'Duplicate Detection', 'Outlier Identification'] },
        { category: 'Statistics', items: ['Descriptive Stats', 'Correlation Analysis', 'Distribution Analysis', 'Quality Scoring'] },
        { category: 'Intelligence', items: ['Natural Language Q&A', 'Business Insights', 'Risk Assessment', 'Recommendations'] },
        { category: 'Governance', items: ['PII Detection', 'Sensitive Fields', 'Data Privacy', 'Audit Trail'] }
    ];

    return (
        <div className="min-h-screen p-8" style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
        }}>
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto mb-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-3xl p-12"
                    style={{
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
                        border: '1px solid rgba(148, 163, 184, 0.1)'
                    }}
                >
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-600 flex items-center justify-center shadow-2xl">
                                <i className='bx bxs-brain text-4xl text-white'></i>
                            </div>
                            <div>
                                <h1 className="text-5xl font-bold text-white mb-2">
                                    Hybrid AI Data Analyst
                                </h1>
                                <p className="text-xl text-gray-400">
                                    Intelligent Dataset Analysis • Powered by Gemma 3:4b
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6 mt-8">
                            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                                        <i className='bx bx-chip text-xl text-teal-400'></i>
                                    </div>
                                    <h3 className="font-bold text-white">MODE 1</h3>
                                </div>
                                <p className="text-sm text-gray-400">Deterministic Analysis</p>
                                <p className="text-xs text-gray-600 mt-1">Fast, accurate, reproducible</p>
                            </div>

                            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                                        <i className='bx bxs-brain text-xl text-cyan-400'></i>
                                    </div>
                                    <h3 className="font-bold text-white">MODE 2</h3>
                                </div>
                                <p className="text-sm text-gray-400">LLM Reasoning & Q/A</p>
                                <p className="text-xs text-gray-600 mt-1">Context-aware insights</p>
                            </div>

                            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                        <i className='bx bx-shield-quarter text-xl text-emerald-400'></i>
                                    </div>
                                    <h3 className="font-bold text-white">SECURE</h3>
                                </div>
                                <p className="text-sm text-gray-400">Data Governance</p>
                                <p className="text-xs text-gray-600 mt-1">Privacy-first design</p>
                            </div>
                        </div>
                    </div>

                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
                </motion.div>
            </div>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
                    {['overview', 'capabilities', 'demo'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${activeTab === tab
                                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto">
                {activeTab === 'overview' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 gap-6"
                    >
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 group"
                            >
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                                    <i className={`bx ${feature.icon} text-3xl text-white`}></i>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'capabilities' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 gap-6"
                    >
                        {capabilities.map((cap, index) => (
                            <div key={index} className="bg-white/5 rounded-2xl p-8 border border-white/10">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                    {cap.category}
                                </h3>
                                <div className="space-y-3">
                                    {cap.items.map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 text-gray-300">
                                            <i className='bx bx-check-circle text-green-400'></i>
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'demo' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 rounded-2xl p-12 border border-white/10"
                    >
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-white mb-4">Try It Now</h2>
                            <p className="text-gray-400 text-lg">Click the AI brain icon in the bottom-right corner to start</p>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-12">
                            <div className="bg-gradient-to-br from-teal-500/10 to-emerald-500/10 rounded-xl p-8 border border-teal-500/20">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <i className='bx bx-upload text-teal-400'></i>
                                    Step 1: Upload Dataset
                                </h3>
                                <p className="text-gray-400 mb-4">Upload your CSV, Excel, or JSON file</p>
                                <div className="space-y-2 text-sm text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <i className='bx bx-check text-emerald-400'></i>
                                        <span>Automatic format detection</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <i className='bx bx-check text-emerald-400'></i>
                                        <span>Instant validation</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <i className='bx bx-check text-emerald-400'></i>
                                        <span>Quality scoring</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 rounded-xl p-8 border border-cyan-500/20">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <i className='bx bx-message-dots text-cyan-400'></i>
                                    Step 2: Ask Questions
                                </h3>
                                <p className="text-gray-400 mb-4">Get intelligent insights about your data</p>
                                <div className="space-y-2 text-sm text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <i className='bx bx-check text-emerald-400'></i>
                                        <span>Natural language queries</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <i className='bx bx-check text-emerald-400'></i>
                                        <span>Context-aware responses</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <i className='bx bx-check text-emerald-400'></i>
                                        <span>Business recommendations</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-xl p-8 border border-white/10">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <i className='bx bx-bulb text-yellow-400'></i>
                                Example Questions
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    "What's the data quality score?",
                                    "Which columns have missing values?",
                                    "Are there any strong correlations?",
                                    "What are the key risks?",
                                    "Is this dataset ML-ready?",
                                    "What cleaning steps do you recommend?"
                                ].map((q, i) => (
                                    <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                        <i className='bx bx-chevron-right text-blue-400 mt-0.5'></i>
                                        <span>"{q}"</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* System Status */}
            <div className="max-w-7xl mx-auto mt-12">
                <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
                    <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                        <i className='bx bx-server text-blue-400'></i>
                        System Status
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                        {[
                            { label: 'AI Copilot', url: '127.0.0.1:5000', status: 'online' },
                            { label: 'Ollama LLM', url: 'localhost:11434', status: 'online' },
                            { label: 'Model', url: 'Gemma 3:4b', status: 'loaded' },
                            { label: 'Mode', url: 'HYBRID', status: 'active' }
                        ].map((service, i) => (
                            <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-2 h-2 rounded-full ${service.status === 'online' || service.status === 'loaded' || service.status === 'active'
                                        ? 'bg-green-400 animate-pulse'
                                        : 'bg-gray-400'
                                        }`}></div>
                                    <span className="text-xs font-semibold text-gray-400">{service.label}</span>
                                </div>
                                <p className="text-sm font-mono text-white">{service.url}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Floating AI Copilot Button */}
            <AICopilotButton />
        </div>
    );
};

export default AICopilotDemo;
