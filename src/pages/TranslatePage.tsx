
import React, { useState } from 'react';
import { Languages, ArrowLeftRight, Copy, Loader2 } from 'lucide-react';
import { improveText } from '../../services/geminiService';
import { useToast } from '../components/Toast/ToastProvider';
import FormattedText from '../components/FormattedText';

const TranslatePage: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [direction, setDirection] = useState<'to_kurdish' | 'from_kurdish'>('to_kurdish');

    const apiKey = localStorage.getItem('gemini_api_key');
    const { showToast } = useToast();

    const handleTranslate = async () => {
        if (!inputText.trim() || !apiKey) {
            if (!apiKey) showToast("کلیلی API داخل بکە", 'error');
            return;
        }

        setIsProcessing(true);
        try {
            const task = direction === 'to_kurdish' ? 'translate_to_kurdish' : 'translate_from_kurdish';
            const result = await improveText(apiKey, 'gemini-2.5-flash', inputText, task);
            setOutputText(result);
            showToast("وەرگێڕان تەواو بوو", 'success');
        } catch (e) {
            console.error(e);
            showToast("کێشەیەک ڕوویدا", 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const swapLanguages = () => {
        setDirection(prev => prev === 'to_kurdish' ? 'from_kurdish' : 'to_kurdish');
        setInputText(outputText);
        setOutputText('');
    };

    const copyOutput = () => {
        navigator.clipboard.writeText(outputText);
        showToast("کۆپی کرا", 'success');
    };

    // ============================================
    // MOBILE VIEW
    // ============================================
    const MobileView = () => (
        <div className="lg:hidden flex flex-col gap-4 py-4">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Languages size={20} className="text-blue-400" />
                وەرگێڕ
            </h1>

            <div className="flex items-center justify-center gap-3 py-2">
                <span className={`text-sm font-bold ${direction === 'to_kurdish' ? 'text-slate-400' : 'text-blue-400'}`}>کوردی</span>
                <button onClick={swapLanguages} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                    <ArrowLeftRight size={16} />
                </button>
                <span className={`text-sm font-bold ${direction === 'to_kurdish' ? 'text-blue-400' : 'text-slate-400'}`}>زمانەکەی تر</span>
            </div>

            <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={direction === 'to_kurdish' ? "دەقی ئینگلیزی/عەرەبی..." : "دەقی کوردی..."}
                className="w-full h-32 bg-slate-800/50 border border-white/10 rounded-xl p-4 text-sm resize-none focus:outline-none focus:border-blue-500/50 placeholder-slate-600 font-kurdish"
            />

            <button
                onClick={handleTranslate}
                disabled={isProcessing || !inputText}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isProcessing ? <><Loader2 size={16} className="animate-spin" /> وەرگێڕان...</> : "وەرگێڕان"}
            </button>

            {outputText && (
                <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-blue-400 font-bold">ئەنجام</span>
                        <button onClick={copyOutput} className="text-xs text-slate-400"><Copy size={14} /></button>
                    </div>
                    <FormattedText text={outputText} className="text-sm text-slate-200 font-kurdish" />
                </div>
            )}
        </div>
    );

    // ============================================
    // DESKTOP VIEW
    // ============================================
    const DesktopView = () => (
        <div className="hidden lg:flex flex-col h-[calc(100vh-100px)] gap-4">

            {/* Header Bar */}
            <div className="flex items-center justify-between shrink-0 bg-slate-800/30 border border-white/5 rounded-xl px-5 py-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                        <Languages size={18} />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-white">وەرگێڕی زیرەک</h1>
                        <p className="text-[10px] text-slate-500">Smart Translator &bull; Powered by Gemini</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-white/5">
                        <span className={`text-xs font-bold ${direction === 'from_kurdish' ? 'text-blue-400' : 'text-slate-500'}`}>کوردی</span>
                        <button onClick={swapLanguages} className="p-1 text-slate-400 hover:text-white transition-colors">
                            <ArrowLeftRight size={14} />
                        </button>
                        <span className={`text-xs font-bold ${direction === 'to_kurdish' ? 'text-blue-400' : 'text-slate-500'}`}>زمانەکەی تر</span>
                    </div>

                    <button
                        onClick={handleTranslate}
                        disabled={isProcessing || !inputText}
                        className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/20"
                    >
                        {isProcessing ? <><Loader2 size={16} className="animate-spin" /> وەرگێڕان...</> : <><Languages size={16} /> وەرگێڕان</>}
                    </button>
                </div>
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">

                {/* Input Panel */}
                <div className="flex flex-col bg-slate-800/30 border border-white/5 rounded-2xl overflow-hidden">
                    <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between shrink-0">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                            {direction === 'to_kurdish' ? 'دەقی سەرچاوە (ئینگلیزی/عەرەبی)' : 'دەقی کوردی'}
                        </span>
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
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">
                            {direction === 'to_kurdish' ? 'وەرگێڕان بە کوردی' : 'وەرگێڕان بە زمانی تر'}
                        </span>
                        {outputText && (
                            <button onClick={copyOutput} className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
                                <Copy size={12} /> Copy
                            </button>
                        )}
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                        {outputText ? (
                            <FormattedText text={outputText} className="text-sm text-slate-200 font-kurdish" />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-40">
                                <Languages size={32} className="mb-2" />
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

export default TranslatePage;
