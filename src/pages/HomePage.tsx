
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AudioWaveform, Mic, Image as ImageIcon, Wand2, Zap, ChevronLeft, Languages } from 'lucide-react';
import { getStats, AppStats } from '../../services/usageService';

const HomePage: React.FC = () => {
    const [usageStats, setUsageStats] = useState<AppStats | null>(null);

    useEffect(() => {
        setUsageStats(getStats());
    }, []);

    const features = [
        {
            id: 'tts',
            title: 'دەنگساز',
            subtitle: 'Voice Studio',
            description: 'دەقەکانت بکە بە دەنگی کوردی سروشتی',
            icon: <AudioWaveform />,
            color: 'from-blue-500 to-indigo-600',
            bgColor: 'bg-blue-500/10',
            textColor: 'text-blue-400',
            link: '/tts'
        },
        {
            id: 'stt',
            title: 'وەرگێڕی دەنگ',
            subtitle: 'Transcriber',
            description: 'قسەکانت بکە بە نووسین',
            icon: <Mic />,
            color: 'from-emerald-500 to-teal-600',
            bgColor: 'bg-emerald-500/10',
            textColor: 'text-emerald-400',
            link: '/stt'
        },
        {
            id: 'ocr',
            title: 'سکێنەر',
            subtitle: 'OCR Scanner',
            description: 'دەق لە وێنە دەربهێنە',
            icon: <ImageIcon />,
            color: 'from-pink-500 to-rose-600',
            bgColor: 'bg-pink-500/10',
            textColor: 'text-pink-400',
            link: '/ocr'
        },
        {
            id: 'grammar',
            title: 'باشساز',
            subtitle: 'Grammar Fixer',
            description: 'هەڵەکانت راست بکەوە',
            icon: <Wand2 />,
            color: 'from-purple-500 to-violet-600',
            bgColor: 'bg-purple-500/10',
            textColor: 'text-purple-400',
            link: '/grammar'
        },
        {
            id: 'translate',
            title: 'وەرگێڕ',
            subtitle: 'Smart Translator',
            description: 'وەرگێڕان بۆ کوردی و پاشەوە',
            icon: <Languages />,
            color: 'from-cyan-500 to-blue-600',
            bgColor: 'bg-cyan-500/10',
            textColor: 'text-cyan-400',
            link: '/translate'
        }
    ];

    const stats = [
        { label: 'دەنگی دروستکراو', value: usageStats?.ttsCount || 0, icon: <AudioWaveform size={16} />, change: '+100%' },
        { label: 'وەرگێڕان', value: usageStats?.translationCount || 0, icon: <Languages size={16} />, change: '+100%' },
        { label: 'وێنەی سکێنکراو', value: usageStats?.ocrCount || 0, icon: <ImageIcon size={16} />, change: '+100%' },
    ];

    // ============================================
    // MOBILE VIEW (Simple vertical cards)
    // ============================================
    const MobileView = () => (
        <div className="lg:hidden flex flex-col gap-6 py-4">
            <div className="text-center mb-4">
                <h1 className="text-2xl font-black text-white">ژیر ساز ڤۆیس</h1>
                <p className="text-sm text-slate-400">ئامرازەکانی زیرەکی دەستکرد</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {features.map((f) => (
                    <Link key={f.id} to={f.link}>
                        <div className={`${f.bgColor} border border-white/5 rounded-2xl p-4 h-full`}>
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-3`}>
                                {React.cloneElement(f.icon as React.ReactElement, { size: 20 })}
                            </div>
                            <h3 className="font-bold text-white text-sm">{f.title}</h3>
                            <p className="text-[10px] text-slate-400 mt-1">{f.description}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );

    // ============================================
    // DESKTOP VIEW (Professional Dashboard)
    // ============================================
    const DesktopView = () => (
        <div className="hidden lg:flex flex-col gap-6 h-full">

            {/* Top Section: Welcome + Stats */}
            <div className="flex items-start justify-between">
                {/* Welcome */}
                <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">داشبۆرد</p>
                    <h1 className="text-2xl font-black text-white">بەخێربێیت بۆ <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-soran-400">ژیر ساز ڤۆیس</span></h1>
                    <p className="text-sm text-slate-400 mt-1">کۆمەڵێک ئامرازی AI بۆ زمانی کوردی</p>
                </div>

                {/* Quick Stats Row */}
                <div className="flex gap-3">
                    {stats.map((s, i) => (
                        <div key={i} className="bg-slate-800/50 border border-white/5 rounded-xl px-4 py-3 min-w-[140px]">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                {s.icon}
                                <span className="text-[10px] uppercase tracking-wide">{s.label}</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-xl font-black text-white">{s.value}</span>
                                <span className="text-[10px] text-emerald-400">{s.change}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bento Grid: Main Features */}
            <div className="flex-1 grid grid-cols-12 grid-rows-2 gap-4">

                {/* TTS - Large Card */}
                <Link to="/tts" className="col-span-5 row-span-2 group">
                    <div className="h-full bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/5 rounded-2xl p-6 relative overflow-hidden hover:border-blue-500/30 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700"></div>

                        <div className="relative z-10 h-full flex flex-col">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                <AudioWaveform size={24} />
                            </div>

                            <div className="mt-auto">
                                <span className="text-[10px] text-blue-400 uppercase tracking-widest">Voice Studio</span>
                                <h2 className="text-2xl font-black text-white mt-1">دەنگساز</h2>
                                <p className="text-sm text-slate-400 mt-2 leading-relaxed">دەقەکانت بکە بە دەنگی کوردی سروشتی و زیندوو. پشتیوانی دەنگە جیاوازەکان.</p>

                                <div className="mt-4 flex items-center text-xs font-bold text-blue-400 group-hover:text-white transition-colors">
                                    دەستپێبکە
                                    <ChevronLeft className="mr-1 w-4 h-4 transition-transform group-hover:-translate-x-1" />
                                </div>
                            </div>
                        </div>
                    </div>
                </Link>

                {/* STT - Medium Card */}
                <Link to="/stt" className="col-span-4 row-span-1 group">
                    <div className="h-full bg-slate-800/50 border border-white/5 rounded-2xl p-5 relative overflow-hidden hover:border-emerald-500/30 transition-all duration-300 flex flex-col">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>

                        <div className="flex items-start gap-3 relative z-10">
                            <div className="w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
                                <Mic size={20} />
                            </div>
                            <div>
                                <span className="text-[10px] text-emerald-400 uppercase tracking-widest">Transcriber</span>
                                <h3 className="text-lg font-bold text-white">وەرگێڕی دەنگ</h3>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-3 relative z-10">قسەکانت بە وردی بکە بە نووسین.</p>
                        <div className="mt-auto pt-3 flex items-center text-[10px] font-bold text-emerald-400 group-hover:text-white transition-colors relative z-10">
                            بیتاقیبکەوە <ChevronLeft className="mr-1 w-3 h-3" />
                        </div>
                    </div>
                </Link>

                {/* OCR - Medium Card */}
                <Link to="/ocr" className="col-span-3 row-span-1 group">
                    <div className="h-full bg-slate-800/50 border border-white/5 rounded-2xl p-5 relative overflow-hidden hover:border-pink-500/30 transition-all duration-300 flex flex-col">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>

                        <div className="flex items-center gap-3 relative z-10">
                            <div className="w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white">
                                <ImageIcon size={20} />
                            </div>
                            <div>
                                <span className="text-[10px] text-pink-400 uppercase tracking-widest">OCR</span>
                                <h3 className="text-lg font-bold text-white">سکێنەر</h3>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-3 relative z-10">دەق لە وێنە دەربهێنە.</p>
                        <div className="mt-auto pt-3 flex items-center text-[10px] font-bold text-pink-400 group-hover:text-white transition-colors relative z-10">
                            بیتاقیبکەوە <ChevronLeft className="mr-1 w-3 h-3" />
                        </div>
                    </div>
                </Link>

                {/* Grammar - Wide Card */}
                <Link to="/grammar" className="col-span-7 row-span-1 group">
                    <div className="h-full bg-slate-800/50 border border-white/5 rounded-2xl p-5 relative overflow-hidden hover:border-purple-500/30 transition-all duration-300 flex items-center gap-6">
                        <div className="absolute top-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -ml-20 -mt-20"></div>

                        <div className="w-14 h-14 shrink-0 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white relative z-10">
                            <Wand2 size={28} />
                        </div>
                        <div className="relative z-10 flex-1">
                            <span className="text-[10px] text-purple-400 uppercase tracking-widest">Grammar Fixer</span>
                            <h3 className="text-xl font-bold text-white">باشساز</h3>
                            <p className="text-xs text-slate-400 mt-1">هەڵە ڕێنووسی و ڕێزمانییەکانت راست بکەوە و دەقەکەت جوانتر بکە بە یەک کلیک.</p>
                        </div>
                        <div className="shrink-0 flex items-center text-xs font-bold text-purple-400 group-hover:text-white transition-colors relative z-10">
                            بیتاقیبکەوە <ChevronLeft className="mr-1 w-4 h-4" />
                        </div>
                    </div>
                </Link>

            </div>

        </div>
    );

    return (
        <>
            <MobileView />
            <DesktopView />
        </>
    );
};

export default HomePage;
