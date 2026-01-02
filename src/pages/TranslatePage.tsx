
import React, { useState, useRef, useEffect } from 'react';
import { Languages, ArrowLeftRight, Copy, Loader2, Star, Volume2, BookOpen, Trash2, X } from 'lucide-react';
import { improveText, generateSpeech } from '../../services/geminiService';
import { useToast } from '../components/Toast/ToastProvider';
import FormattedText from '../components/FormattedText';
import { savePhrase, getPhrases, deletePhrase, SavedPhrase } from '../../services/phrasebookService';
import { getAudioContext } from '../../services/audioUtils';
import { incrementStat } from '../../services/usageService';

const TranslatePage: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [direction, setDirection] = useState<'to_kurdish' | 'from_kurdish'>('to_kurdish');

    // Phrasebook state
    const [savedPhrases, setSavedPhrases] = useState<SavedPhrase[]>([]);
    const [showPhrasebook, setShowPhrasebook] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    // Pronunciation audio state
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

    const apiKey = localStorage.getItem('gemini_api_key');
    const { showToast } = useToast();

    // Load saved phrases on mount
    useEffect(() => {
        setSavedPhrases(getPhrases());
    }, []);

    // Check if current translation is saved
    useEffect(() => {
        if (inputText && outputText) {
            const exists = savedPhrases.some(p =>
                p.originalText === inputText && p.translatedText === outputText
            );
            setIsSaved(exists);
        } else {
            setIsSaved(false);
        }
    }, [inputText, outputText, savedPhrases]);

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
            incrementStat('translationCount');
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

    // Save to Phrasebook
    const handleSavePhrase = () => {
        if (!inputText || !outputText) return;

        try {
            savePhrase({
                originalText: inputText,
                translatedText: outputText,
                fromLang: direction === 'to_kurdish' ? 'other' : 'kurdish',
                toLang: direction === 'to_kurdish' ? 'kurdish' : 'other'
            });
            setSavedPhrases(getPhrases());
            showToast("پاشەکەوت کرا ⭐", 'success');
        } catch (e) {
            showToast("پێشتر پاشەکەوت کراوە", 'info');
        }
    };

    // Delete from Phrasebook
    const handleDeletePhrase = (id: string) => {
        deletePhrase(id);
        setSavedPhrases(getPhrases());
        showToast("سڕایەوە", 'success');
    };

    // Play pronunciation
    const playPronunciation = async (text: string) => {
        if (!apiKey || isPlayingAudio || !text) return;

        setIsPlayingAudio(true);
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = getAudioContext();
            }

            const audioBuffer = await generateSpeech(
                apiKey,
                'gemini-2.5-flash-preview-tts',
                text.slice(0, 500),
                'Kore',
                'Read clearly for pronunciation',
                'at a moderate pace'
            );

            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.onended = () => setIsPlayingAudio(false);
            sourceNodeRef.current = source;
            source.start();
        } catch (e) {
            showToast("گوێدان سەرکەوتوو نەبوو", 'error');
            setIsPlayingAudio(false);
        }
    };

    // Load phrase from phrasebook
    const loadPhrase = (phrase: SavedPhrase) => {
        setInputText(phrase.originalText);
        setOutputText(phrase.translatedText);
        setDirection(phrase.fromLang === 'kurdish' ? 'from_kurdish' : 'to_kurdish');
        setShowPhrasebook(false);
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

                    <div className="flex items-center gap-2">
                        {/* Phrasebook Button */}
                        <button
                            onClick={() => setShowPhrasebook(true)}
                            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-amber-500/20 transition-colors"
                        >
                            <BookOpen size={14} /> فەرهەنگ ({savedPhrases.length})
                        </button>

                        <button
                            onClick={handleTranslate}
                            disabled={isProcessing || !inputText}
                            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/20"
                        >
                            {isProcessing ? <><Loader2 size={16} className="animate-spin" /> وەرگێڕان...</> : <><Languages size={16} /> وەرگێڕان</>}
                        </button>
                    </div>
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
                        <div className="flex items-center gap-2">
                            {outputText && (
                                <>
                                    {/* Save to Phrasebook */}
                                    <button
                                        onClick={handleSavePhrase}
                                        disabled={isSaved}
                                        className={`text-[10px] flex items-center gap-1 transition-colors ${isSaved ? 'text-amber-400' : 'text-slate-400 hover:text-amber-400'}`}
                                    >
                                        <Star size={12} fill={isSaved ? 'currentColor' : 'none'} /> {isSaved ? 'پاشەکەوتکراو' : 'پاشەکەوت'}
                                    </button>
                                    {/* Pronunciation */}
                                    <button
                                        onClick={() => playPronunciation(outputText)}
                                        disabled={isPlayingAudio}
                                        className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 disabled:opacity-50 transition-colors"
                                    >
                                        <Volume2 size={12} /> {isPlayingAudio ? '...' : 'گوێبیستن'}
                                    </button>
                                    {/* Copy */}
                                    <button onClick={copyOutput} className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
                                        <Copy size={12} /> Copy
                                    </button>
                                </>
                            )}
                        </div>
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

            {/* Phrasebook Modal */}
            {showPhrasebook && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
                        {/* Modal Header */}
                        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <BookOpen size={20} className="text-amber-400" />
                                <h2 className="text-lg font-bold text-white">فەرهەنگی من</h2>
                                <span className="text-xs text-slate-500">({savedPhrases.length})</span>
                            </div>
                            <button onClick={() => setShowPhrasebook(false)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Phrases List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {savedPhrases.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600 py-12">
                                    <BookOpen size={40} className="mb-3 opacity-40" />
                                    <p className="text-sm">هیچ وشەیەک پاشەکەوت نەکراوە</p>
                                    <p className="text-xs mt-1 opacity-60">وەرگێڕان بکە و ⭐ بکە بۆ پاشەکەوت</p>
                                </div>
                            ) : (
                                savedPhrases.map((phrase) => (
                                    <div key={phrase.id} className="bg-slate-800/50 border border-white/5 rounded-xl p-4 hover:border-amber-500/30 transition-colors group">
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => loadPhrase(phrase)}>
                                                <p className="text-sm text-slate-400 truncate">{phrase.originalText}</p>
                                                <p className="text-sm text-white font-kurdish mt-1">{phrase.translatedText}</p>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => playPronunciation(phrase.translatedText)}
                                                    disabled={isPlayingAudio}
                                                    className="p-1.5 hover:bg-emerald-500/20 rounded text-emerald-400 transition-colors"
                                                >
                                                    <Volume2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePhrase(phrase.id)}
                                                    className="p-1.5 hover:bg-rose-500/20 rounded text-rose-400 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TranslatePage;
