
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Mic, Image as ImageIcon, Wand2, History, X, AudioWaveform, Home, Languages, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (v: boolean) => void }) => {
    const location = useLocation();

    // Close sidebar on route change (mobile only)
    React.useEffect(() => {
        setIsOpen(false);
    }, [location.pathname, setIsOpen]);

    const menuItems = [
        { icon: <Home size={20} />, label: 'سەرەتا (Home)', path: '/' },
        { icon: <AudioWaveform size={20} />, label: 'دەنگساز (TTS)', path: '/tts' },
        { icon: <Mic size={20} />, label: 'وەرگێڕی دەنگ (STT)', path: '/stt' },
        { icon: <ImageIcon size={20} />, label: 'سکێنەر (OCR)', path: '/ocr' },
        { icon: <Wand2 size={20} />, label: 'باشساز (Grammar)', path: '/grammar' },
        { icon: <Languages size={20} />, label: 'وەرگێڕ (Translate)', path: '/translate' },
        { icon: <History size={20} />, label: 'مێژوو', path: '/history' },
        { icon: <Settings size={20} />, label: 'ڕێکخستنەکان', path: '/settings' },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Container */}
            <aside
                className={`fixed top-0 right-0 h-full w-64 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-50 shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:shadow-none font-kurdish flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >

                {/* Header */}
                <div className="p-5 border-b border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-soran-500 flex items-center justify-center shadow-lg shadow-soran-500/20">
                            <AudioWaveform className="text-white" size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-black bg-gradient-to-r from-indigo-200 to-soran-200 bg-clip-text text-transparent">ژیرساز</h1>
                            <span className="text-[10px] text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded-full border border-white/5">Beta v1.0</span>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden ${isActive
                                    ? 'bg-gradient-to-r from-soran-600/20 to-indigo-600/20 text-white border border-soran-500/30 shadow-lg shadow-soran-500/10'
                                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                                    }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute left-0 top-0 h-full w-1 bg-soran-500 rounded-r-full"
                                    />
                                )}
                                <span className={`${isActive ? 'text-soran-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                                    {React.cloneElement(item.icon as React.ReactElement, { size: 18 })}
                                </span>
                                <span className="font-bold text-sm relative z-10">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer info */}
                <div className="p-4 border-t border-white/5">
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                        <h3 className="text-[10px] font-bold text-slate-300 mb-1">دۆخی سیستەم</h3>
                        <div className="flex justify-between items-end">
                            <span className="text-xl font-black text-white">Online</span>
                            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                چalak
                            </span>
                        </div>
                    </div>
                </div>

            </aside>
        </>
    );
};

export default Sidebar;
