
import React, { useState, useEffect } from 'react';
import {
    Settings,
    Key,
    Cpu,
    Trash2,
    ShieldCheck,
    BarChart3,
    Database,
    RefreshCcw,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    Info,
    Moon,
    Sun
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getStats, resetStats, AppStats } from '../../services/usageService';
import { clearHistory } from '../../services/storageService';
import { useToast } from '../components/Toast/ToastProvider';
import { AVAILABLE_MODELS } from '../../constants';

const SettingsPage: React.FC = () => {
    // Helper to safely read from localStorage
    const safeLocalGet = (key: string, fallback: string) => {
        try {
            return localStorage.getItem(key) || fallback;
        } catch (error) {
            console.error(`Error reading ${key} from localStorage:`, error);
            return fallback;
        }
    };

    const [apiKey, setApiKey] = useState(() => safeLocalGet('gemini_api_key', ''));
    const [showKey, setShowKey] = useState(false);
    const [currentStats, setCurrentStats] = useState<AppStats | null>(null);
    const [selectedModel, setSelectedModel] = useState(() => safeLocalGet('default_model', AVAILABLE_MODELS[0].id));
    const { showToast } = useToast();

    useEffect(() => {
        setCurrentStats(getStats());
    }, []);

    const handleSaveKey = () => {
        try {
            localStorage.setItem('gemini_api_key', apiKey);
            showToast("کلیلی API بە سەرکەوتوویی پاشەکەوت کرا", "success");
        } catch (error: any) {
            console.error("Failed to save API key:", error);
            showToast(`هەڵە لە پاشەکەوتکردنی کلیل: ${error.message || error}`, "error");
        }
    };

    const handleModelChange = (modelId: string) => {
        try {
            setSelectedModel(modelId);
            localStorage.setItem('default_model', modelId);
            showToast(`مۆدێلی بنەڕەتی گۆڕدرا بۆ ${AVAILABLE_MODELS.find(m => m.id === modelId)?.name}`, "success");
        } catch (error) {
            showToast(`هەڵە لە گۆڕینی مۆدێل: ${error}`, "error");
        }
    };

    const handleResetStats = () => {
        if (window.confirm("ئایا دڵنیایت لە سفرکردنەوەی ئامارەکان؟")) {
            resetStats();
            setCurrentStats(getStats());
            showToast("ئامارەکان سفرکرانەوە", "info");
        }
    };

    const handleClearHistory = async () => {
        if (window.confirm("ئایا دڵنیایت لە سڕینەوەی تەواوی مێژوو؟")) {
            try {
                await clearHistory();
                showToast("تەواوی مێژوو سڕایەوە", "info");
            } catch (error) {
                console.error("Failed to clear history:", error);
                showToast("سڕینەوە نەکۆتایی بوو: " + String(error), "error");
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-black text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5">
                        <Settings className="text-slate-400" size={20} />
                    </div>
                    ڕێکخستنەکان
                </h1>
                <p className="text-slate-500 mt-2 text-sm">بەڕێوەبردنی کلیلی API، مۆدێلەکان و داتا کەسییەکانت</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* API Key Section */}
                <section className="bg-slate-800/40 border border-white/5 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-2 text-white font-bold mb-4">
                        <Key size={18} className="text-soran-400" />
                        <h2>نهێنی و پاراستن</h2>
                    </div>

                    <div>
                        <label htmlFor="geminiApiKey" className="text-xs text-slate-400 uppercase tracking-wider mb-2 block font-bold">Gemini API Key</label>
                        <div className="relative">
                            <input
                                id="geminiApiKey"
                                type={showKey ? "text" : "password"}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="AI Key لێرە دابنێ..."
                                className="w-full bg-slate-900/60 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-soran-500/50 pr-12 font-mono"
                            />
                            <button
                                onClick={() => setShowKey(!showKey)}
                                aria-label={showKey ? "شاردنەوەی کلیل" : "پیشاندانی کلیل"}
                                aria-pressed={showKey}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            >
                                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                            <Info size={10} className="inline ml-1" /> کلیلی API تەنها لەناو وێبگەڕەکەتدا (Local Storage) پاشەکەوت دەکرێت و بۆ هیچ سێرڤەرێک نانێردرێت. لەبەر ئەوەی کلیلەکە لێرە دەمێنێتەوە، هەر سکریپتێکی زیانبەخش (XSS) لەسەر ئەم پەڕەیە دەتوانێت بیخوێنێتەوە. تکایە لە بەکارهێنانی سکریپت و پێوەکراوی (Extension) نەناسراو دووربکەوە. بۆ پاراستنی زیاتر، دەتوانیت بیر لە رێکاری وەک کۆدکردنی کلیلەکە (Encryption) بکەیتەوە.
                        </p>
                    </div>

                    <button
                        onClick={handleSaveKey}
                        className="w-full py-3 bg-soran-600 hover:bg-soran-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-soran-900/10 flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 size={18} /> پاشەکەوتکردن
                    </button>
                </section>

                {/* AI Model Settings */}
                <section className="bg-slate-800/40 border border-white/5 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-2 text-white font-bold mb-4">
                        <Cpu size={18} className="text-indigo-400" />
                        <h2>مۆدێلی بنەڕەتی</h2>
                    </div>

                    <div className="space-y-2" role="radiogroup" aria-label="هەڵبژاردنی مۆدێل">
                        {AVAILABLE_MODELS.map(model => (
                            <button
                                key={model.id}
                                role="radio"
                                aria-checked={selectedModel === model.id}
                                onClick={() => handleModelChange(model.id)}
                                className={`w-full text-right p-4 rounded-xl border transition-all flex items-center justify-between ${selectedModel === model.id ? 'bg-indigo-600/20 border-indigo-500/50 text-white' : 'bg-slate-900/40 border-slate-700/50 text-slate-400 hover:border-white/10'}`}
                            >
                                <div className="flex flex-col items-start">
                                    <span className="font-bold text-sm">{model.name}</span>
                                    <span className="text-[10px] opacity-60 mt-1">{model.description}</span>
                                </div>
                                {selectedModel === model.id && <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]"></div>}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Usage Stats Summary */}
                <section className="bg-slate-800/40 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 text-white font-bold">
                            <BarChart3 size={18} className="text-emerald-400" />
                            <h2>ئاماری بەکارهێنان</h2>
                        </div>
                        <button onClick={handleResetStats} aria-label="سفرکردنەوەی ئامارەکان" className="text-slate-500 hover:text-rose-400 transition-colors">
                            <RefreshCcw size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5">
                            <p className="text-[10px] text-slate-500 uppercase mb-1">TTS</p>
                            <p className="text-lg font-black text-white">{currentStats?.ttsCount || 0}</p>
                        </div>
                        <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5">
                            <p className="text-[10px] text-slate-500 uppercase mb-1">STT</p>
                            <p className="text-lg font-black text-white">{currentStats?.sttCount || 0}</p>
                        </div>
                        <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5">
                            <p className="text-[10px] text-slate-500 uppercase mb-1">OCR</p>
                            <p className="text-lg font-black text-white">{currentStats?.ocrCount || 0}</p>
                        </div>
                        <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5">
                            <p className="text-[10px] text-slate-500 uppercase mb-1">وەرگێڕان</p>
                            <p className="text-lg font-black text-white">{currentStats?.translationCount || 0}</p>
                        </div>
                    </div>
                </section>

                {/* Data Management */}
                <section className="bg-slate-800/40 border border-white/5 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-2 text-white font-bold mb-4">
                        <Database size={18} className="text-rose-400" />
                        <h2>بەڕێوەبردنی داتا</h2>
                    </div>

                    <div className="space-y-3">
                        <div className="p-4 bg-slate-900/40 rounded-xl border border-white/5 flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-bold text-white">سڕینەوەی مێژوو</h4>
                                <p className="text-[10px] text-slate-500 mt-0.5">سڕینەوەی هەموو ئەو دەنگ و دەقانەی پێشتر دروستکراون</p>
                            </div>
                            <button
                                onClick={handleClearHistory}
                                aria-label="سڕینەوەی مێژوو"
                                className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-colors border border-rose-500/20"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <div className="p-4 bg-slate-900/40 rounded-xl border border-white/5 flex items-center justify-between opacity-50 grayscale cursor-not-allowed">
                            <div>
                                <h4 className="text-sm font-bold text-white text-right">ڕوخساری گۆڕاو (Theme)</h4>
                                <p className="text-[10px] text-slate-500 mt-0.5">گۆڕین لە نێوان دۆخی تاریک و ڕوون</p>
                            </div>
                            <button disabled aria-disabled="true" className="p-2.5 bg-slate-700 rounded-lg">
                                <Sun size={18} />
                            </button>
                        </div>
                    </div>
                </section>

            </div>

            {/* Footer Status */}
            <div className="flex items-center justify-center gap-6 pt-4 border-t border-white/5 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                <div className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-emerald-500" /> Secure Storage</div>
                <div className="flex items-center gap-1.5"><RefreshCcw size={12} className="text-indigo-500" /> Auto-Sync Local</div>
            </div>
        </div>
    );
};

export default SettingsPage;
