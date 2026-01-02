
import React, { useState } from 'react';
import { Wand2, Check, Copy, Sparkles } from 'lucide-react';
import { improveText } from '../../services/geminiService';
import FormattedText from '../components/FormattedText';
import { incrementStat } from '../../services/usageService';

const GrammarPage: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [fixedText, setFixedText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const apiKey = localStorage.getItem('gemini_api_key');

    const handleFix = async () => {
        if (!inputText.trim() || !apiKey) {
            if (!apiKey) alert("تکایە سەرەتا کلیلی API زیاد بکە.");
            return;
        }

        setIsProcessing(true);
        try {
            const result = await improveText(apiKey, 'gemini-2.5-flash', inputText, 'fix_grammar');
            setFixedText(result);
            incrementStat('grammarCount');
        } catch (e) {
            console.error(e);
            alert("کێشەیەک ڕوویدا.");
        } finally {
            setIsProcessing(false);
        }
    };

    // ============================================
    // MOBILE VIEW
    // ============================================
    const MobileView = () => (
        <div className="lg:hidden flex flex-col gap-4 py-4">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Wand2 size={20} className="text-purple-400" />
                باشسازی ڕێنووس
            </h1>

            <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="دەقەکەت لێرە بنووسە..."
                className="w-full h-40 bg-slate-800/50 border border-white/10 rounded-xl p-4 text-sm resize-none focus:outline-none focus:border-purple-500/50 placeholder-slate-600 font-kurdish"
            />

            <button
                onClick={handleFix}
                disabled={isProcessing || !inputText}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold disabled:opacity-50"
            >
                {isProcessing ? "چاککردن..." : "چاککردنی هەڵەکان"}
            </button>

            {fixedText && (
                <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-emerald-400 font-bold">دەقی چاککراو</span>
                        <button onClick={() => navigator.clipboard.writeText(fixedText)} className="text-xs text-slate-400"><Copy size={14} /></button>
                    </div>
                    <FormattedText text={fixedText} className="text-sm text-slate-200 font-kurdish" />
                </div>
            )}
        </div>
    );

    // ============================================
    // DESKTOP VIEW (Professional Side-by-Side Editor)
    // ============================================
    const DesktopView = () => (
        <div className="hidden lg:flex flex-col h-[calc(100vh-100px)] gap-4">

            {/* Header Bar */}
            <div className="flex items-center justify-between shrink-0 bg-slate-800/30 border border-white/5 rounded-xl px-5 py-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                        <Wand2 size={18} />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-white">باشسازی ڕێنووس</h1>
                        <p className="text-[10px] text-slate-500">Grammar Fixer &bull; Powered by Gemini</p>
                    </div>
                </div>

                <button
                    onClick={handleFix}
                    disabled={isProcessing || !inputText}
                    className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-900/20"
                >
                    <Sparkles size={16} />
                    {isProcessing ? "چاککردن..." : "چاککردن"}
                </button>
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">

                {/* Input Panel */}
                <div className="flex flex-col bg-slate-800/30 border border-white/5 rounded-2xl overflow-hidden">
                    <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between shrink-0">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">دەقی سەرەکی</span>
                        <span className="text-[10px] text-slate-600">{inputText.length} پیت</span>
                    </div>
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="دەقەکەت لێرە بنووسە..."
                        className="flex-1 w-full bg-transparent p-4 text-sm leading-relaxed resize-none focus:outline-none placeholder-slate-600 font-kurdish"
                    />
                </div>

                {/* Output Panel */}
                <div className="flex flex-col bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
                    <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between shrink-0">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                            <Check size={14} />
                            دەقی چاککراو
                        </span>
                        {fixedText && (
                            <button onClick={() => navigator.clipboard.writeText(fixedText)} className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
                                <Copy size={12} /> Copy
                            </button>
                        )}
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                        {fixedText ? (
                            <FormattedText text={fixedText} className="text-sm text-slate-200 font-kurdish" />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-40">
                                <Sparkles size={32} className="mb-2" />
                                <p className="text-xs">ئەنجام لێرە دەردەکەوێت</p>
                            </div>
                        )}
                    </div>
                </div>

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

export default GrammarPage;
