import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AICopilotHybrid from './AICopilotHybrid';

const AICopilotButton = ({ datasetInfo = null, statistics = null }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [isPulsing, setIsPulsing] = useState(true);

    // Check AI service status
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const response = await fetch('http://127.0.0.1:5000/health');
                const data = await response.json();
                setIsOnline(true);
            } catch (error) {
                setIsOnline(false);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 10000); // Check every 10 seconds

        return () => clearInterval(interval);
    }, []);

    // Stop pulsing after 5 seconds
    useEffect(() => {
        const timer = setTimeout(() => setIsPulsing(false), 5000);
        return () => clearTimeout(timer);
    }, []);

    const location = useLocation();

    // Hide on the dedicated AI Analyst page to prevent overlap/confusion
    if (location.pathname === '/ai-analyst') return null;

    return (
        <>
            {/* Floating Button */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: 'spring', damping: 15 }}
                className="fixed bottom-8 right-8 z-40"
            >
                <motion.button
                    onClick={() => setIsOpen(true)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-600 to-rose-500 shadow-2xl shadow-orange-500/40 flex items-center justify-center group overflow-hidden"
                >
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-amber-500 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* Pulsing Ring */}
                    {isPulsing && (
                        <motion.div
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.5, 0, 0.5]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="absolute inset-0 rounded-2xl border-4 border-orange-400"
                        />
                    )}

                    {/* Icon */}
                    <div className="relative z-10">
                        <i className='bx bx-brain text-3xl text-white group-hover:scale-110 transition-transform'></i>
                    </div>

                    {/* Status Indicator */}
                    <div className={`absolute top-1 right-1 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-red-500'
                        } ${isOnline ? 'animate-pulse' : ''}`}></div>

                    {/* Tooltip */}
                    <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="glass-panel px-3 py-2 rounded-lg whitespace-nowrap">
                            <p className="text-xs font-semibold">AI Data Analyst</p>
                            <p className="text-xs text-gray-400">{isOnline ? 'Online' : 'Offline'}</p>
                        </div>
                    </div>
                </motion.button>

                {/* Badge for dataset context */}
                {datasetInfo && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 border-2 border-gray-900 flex items-center justify-center"
                    >
                        <i className='bx bx-data text-xs text-white'></i>
                    </motion.div>
                )}
            </motion.div>

            {/* AI Copilot Modal */}
            <AICopilotHybrid
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    );
};

export default AICopilotButton;
