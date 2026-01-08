
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Waveform from '../../components/Waveform';
import { AVAILABLE_VOICES, AVAILABLE_TONES, AVAILABLE_SPEEDS, SAMPLE_TEXTS, AVAILABLE_MODELS } from '../../constants';
import { VoiceConfig, ToneConfig, SpeedConfig, TTSStatus, GeneratedAudio, ModelConfig } from '../../types';
import { generateSpeech, improveText } from '../../services/geminiService';
import { getAudioContext, audioBufferToWav } from '../../services/audioUtils';
import { normalizeKurdishText } from '../../services/textUtils';
import { loadHistory, saveToHistory, clearHistory } from '../../services/storageService';
import { incrementStat } from '../../services/usageService';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../components/Toast/ToastProvider';

const TTSPage: React.FC = () => {
    // Access shared state from Layout if needed, but for now we keep local state 
    // actually, apiKey should probably be global context, but let's keep it simple and load from localStorage

    const [text, setText] = useState<string>('');
    const [selectedVoice, setSelectedVoice] = useState<VoiceConfig>(AVAILABLE_VOICES[0]);
    const [selectedTone, setSelectedTone] = useState<ToneConfig>(AVAILABLE_TONES[0]);
    const [selectedSpeed, setSelectedSpeed] = useState<SpeedConfig>(AVAILABLE_SPEEDS[1]);
    const [selectedModel, setSelectedModel] = useState<ModelConfig>(AVAILABLE_MODELS[0]);
    const [language, setLanguage] = useState<'ku' | 'en'>('ku');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const [status, setStatus] = useState<TTSStatus>(TTSStatus.IDLE);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [history, setHistory] = useState<GeneratedAudio[]>([]);

    // Word highlighting state
    const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
    const [playStartTime, setPlayStartTime] = useState<number>(0);
    const [currentText, setCurrentText] = useState<string>(''); // Text being played (for highlighting)

    // API Key & Usage State
    const [apiKey, setApiKey] = useState<string>('');
    // Note: We might want to move showKeyModal to the layout or context
    // For now, we'll let the user open settings via header (which is in Layout)
    // But wait, Layout has the header. How does Layout trigger this modal?
    // Ideally, context. For simplicity, we'll assume the key is in localStorage.

    const [usageCount, setUsageCount] = useState<number>(0);
    const [requestCountToday, setRequestCountToday] = useState<number>(0);
    const [requestCountMinute, setRequestCountMinute] = useState<number>(0);

    // Batch Mode State
    const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
    const [bgProcessing, setBgProcessing] = useState<number>(0);

    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
    const animationRef = useRef<number | null>(null);

    // Player Settings
    const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
    const [volume, setVolume] = useState<number>(1.0);
    const { showToast } = useToast();

    // Get words from current text
    const words = currentText ? currentText.split(/\s+/).filter(w => w.length > 0) : [];

    // Update word highlighting during playback
    const updateWordHighlight = useCallback(() => {
        if (status !== TTSStatus.PLAYING || !audioBuffer || words.length === 0) {
            return;
        }

        const elapsed = (performance.now() - playStartTime) / 1000 * playbackSpeed;
        const duration = audioBuffer.duration;
        const timePerWord = duration / words.length;

        const newIndex = Math.min(Math.floor(elapsed / timePerWord), words.length - 1);

        if (newIndex !== currentWordIndex && newIndex >= 0) {
            setCurrentWordIndex(newIndex);
        }

        if (elapsed < duration) {
            animationRef.current = requestAnimationFrame(updateWordHighlight);
        }
    }, [status, audioBuffer, words, playStartTime, currentWordIndex, playbackSpeed]);

    // Start/stop animation loop for highlighting
    useEffect(() => {
        if (status === TTSStatus.PLAYING && audioBuffer) {
            animationRef.current = requestAnimationFrame(updateWordHighlight);
        } else {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            if (status !== TTSStatus.PLAYING) {
                setCurrentWordIndex(-1);
            }
        }
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [status, audioBuffer, updateWordHighlight]);

    // Load Persistence
    useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) setApiKey(storedKey);
        // else setShowKeyModal(true); // Don't auto show on page load, maybe distracting if switching pages

        const storedUsage = localStorage.getItem('usage_count');
        if (storedUsage) setUsageCount(parseInt(storedUsage, 10));

        // Load Daily Usage
        const today = new Date().toDateString();
        const storedDate = localStorage.getItem('usage_date');
        const storedDaily = localStorage.getItem('usage_daily_requests');

        if (storedDate === today && storedDaily) {
            setRequestCountToday(parseInt(storedDaily, 10));
        } else {
            setRequestCountToday(0);
            localStorage.setItem('usage_date', today);
            localStorage.setItem('usage_daily_requests', '0');
        }
    }, []);

    // Load History
    useEffect(() => {
        loadHistory().then(items => {
            setHistory(items);
        });
    }, []);

    // Audio Context Init
    useEffect(() => {
        const initAudio = () => {
            if (!audioContextRef.current) {
                audioContextRef.current = getAudioContext();
            }
        };
        window.addEventListener('click', initAudio);
        return () => window.removeEventListener('click', initAudio);
    }, []);

    const updateUsageStats = (charCount: number) => {
        const newTotal = usageCount + charCount;
        const newDaily = requestCountToday + 1;
        const newMinute = requestCountMinute + 1;

        setUsageCount(newTotal);
        setRequestCountToday(newDaily);
        setRequestCountMinute(newMinute);

        localStorage.setItem('usage_count', newTotal.toString());
        localStorage.setItem('usage_daily_requests', newDaily.toString());
        localStorage.setItem('usage_date', new Date().toDateString());
    };

    const handleGenerate = async () => {
        if (!text.trim()) return;

        if (!apiKey) {
            // Trigger global modal or local alert
            showToast("تکایە سەرەتا کلیلی API لە ڕێکخستنەکان دابنێ.", "error");
            return;
        }

        if (sourceNodeRef.current) {
            try { sourceNodeRef.current.stop(); } catch (e) { }
        }
        setAudioBuffer(null);
        setErrorMsg(null);
        setCurrentWordIndex(-1);

        // BATCH MODE
        if (isBatchMode) {
            const lines = text.split('\n').filter(l => l.trim().length > 0);
            if (lines.length === 0) return;

            setStatus(TTSStatus.GENERATING);
            setBgProcessing(lines.length);

            try {
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const processedText = normalizeKurdishText(line);
                    const buffer = await generateSpeech(apiKey, selectedModel.id, processedText, selectedVoice.id, selectedTone.promptModifier, selectedSpeed.value, language);
                    updateUsageStats(processedText.length);
                    const newHistoryItem: GeneratedAudio = {
                        id: Date.now().toString() + i,
                        type: 'TTS',
                        content: line.length > 50 ? line.substring(0, 50) + '...' : line,
                        audioBuffer: buffer,
                        timestamp: new Date(),
                        voiceName: selectedVoice.name
                    };
                    setHistory(prev => [newHistoryItem, ...prev].slice(0, 20));
                    saveToHistory(newHistoryItem);
                    incrementStat('ttsCount');
                    await new Promise(r => setTimeout(r, 500));
                    setBgProcessing(prev => prev - 1);
                }
                setStatus(TTSStatus.IDLE);
            } catch (err: any) {
                console.error(err);
                setErrorMsg("کێشەیەک لە پرۆسەی کۆمەڵ (Batch) ڕوویدا.");
                setStatus(TTSStatus.ERROR);
                setBgProcessing(0);
            }
            return;
        }

        // SINGLE MODE
        setStatus(TTSStatus.GENERATING);
        try {
            const processedText = normalizeKurdishText(text);
            const buffer = await generateSpeech(apiKey, selectedModel.id, processedText, selectedVoice.id, selectedTone.promptModifier, selectedSpeed.value, language);
            setAudioBuffer(buffer);
            setCurrentText(text); // Store the text for highlighting
            incrementStat('ttsCount');
            setStatus(TTSStatus.IDLE);
            playAudio(buffer, text);
            updateUsageStats(processedText.length);
            const newHistoryItem: GeneratedAudio = {
                id: Date.now().toString(),
                type: 'TTS',
                content: text.length > 50 ? text.substring(0, 50) + '...' : text,
                audioBuffer: buffer,
                timestamp: new Date(),
                voiceName: selectedVoice.name
            };
            setHistory(prev => [newHistoryItem, ...prev].slice(0, 10));
            saveToHistory(newHistoryItem);
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "کێشەیەک ڕوویدا.");
            showToast("کێشەیەک لە دروستکردنی دەنگ ڕوویدا.", "error");
            setStatus(TTSStatus.ERROR);
        }
    };

    const playAudio = (buffer: AudioBuffer | null = audioBuffer, textToHighlight: string = currentText) => {
        if (!buffer || !audioContextRef.current) return;
        if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
        stopAudio();

        setCurrentText(textToHighlight);
        setCurrentWordIndex(-1);

        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = playbackSpeed;
        const gainNode = audioContextRef.current.createGain();
        gainNode.gain.value = volume;
        const analyserNode = audioContextRef.current.createAnalyser();
        analyserNode.fftSize = 256;
        source.connect(gainNode);
        gainNode.connect(analyserNode);
        analyserNode.connect(audioContextRef.current.destination);
        source.onended = () => {
            setStatus(TTSStatus.IDLE);
            setCurrentWordIndex(-1);
        };
        sourceNodeRef.current = source;
        gainNodeRef.current = gainNode;
        setAnalyser(analyserNode);
        setPlayStartTime(performance.now());
        source.start();
        setStatus(TTSStatus.PLAYING);
    };

    useEffect(() => {
        if (gainNodeRef.current) gainNodeRef.current.gain.value = volume;
        if (sourceNodeRef.current) sourceNodeRef.current.playbackRate.value = playbackSpeed;
    }, [volume, playbackSpeed]);

    const stopAudio = () => {
        if (sourceNodeRef.current) {
            try { sourceNodeRef.current.stop(); } catch (e) { }
            setStatus(TTSStatus.IDLE);
            setCurrentWordIndex(-1);
        }
    };

    const handleDownload = (buffer: AudioBuffer | null = audioBuffer) => {
        if (!buffer) return;
        const wavBlob = audioBufferToWav(buffer);
        const url = URL.createObjectURL(wavBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ZheerSaz-Voice-${Date.now()}.wav`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImproveText = async (task: 'fix_grammar' | 'translate_to_kurdish') => {
        if (!text.trim() || !apiKey) return;

        const originalText = text;
        setStatus(TTSStatus.GENERATING);
        setErrorMsg(null);

        try {
            const result = await improveText(apiKey, selectedModel.id, text, task, language);
            setText(result);
            setStatus(TTSStatus.IDLE);
        } catch (e: any) {
            console.error(e);
            setErrorMsg("کێشەیەک لە پرۆسێسکردنی دەق ڕوویدا.");
            showToast("کێشەیەک لە پرۆسێسکردنی دەق ڕوویدا.", "error");
            setStatus(TTSStatus.ERROR);
            setText(originalText);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleGenerate();
        }
    };
    // Highlighted Text Display Component
    const HighlightedTextDisplay = () => {
        if (!currentText || words.length === 0) return null;

        return (
            <div className="bg-slate-900/50 rounded-xl p-4 mb-4 border border-white/5 max-h-32 overflow-y-auto custom-scrollbar">
                <p className="text-sm leading-relaxed text-slate-200 font-kurdish text-right">
                    {words.map((word, index) => (
                        <span
                            key={index}
                            className={`transition-all duration-150 inline-block ${index === currentWordIndex
                                ? 'bg-soran-500/50 text-white px-1 py-0.5 rounded scale-105'
                                : index < currentWordIndex
                                    ? 'text-slate-500'
                                    : 'text-slate-300'
                                }`}
                        >
                            {word}{' '}
                        </span>
                    ))}
                </p>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-8 h-[calc(100vh-140px)]">
            {/* Right Column: Controls */}
            <section className="flex flex-col space-y-6 overflow-y-auto custom-scrollbar pr-2">
                {/* Text Input */}
                <div className="bg-slate-800/50 rounded-2xl p-1 border border-white/10 shadow-xl backdrop-blur-sm shrink-0">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center">
                        <label className="text-sm font-bold text-slate-300">{language === 'ku' ? 'دەقی کوردی (سۆرانی)' : 'English Text'}</label>
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pl-2">
                            {/* Smart Tools */}
                            <button
                                onClick={() => handleImproveText('fix_grammar')}
                                disabled={status === TTSStatus.GENERATING}
                                className="flex-shrink-0 flex items-center gap-1 text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded transition-colors border border-emerald-500/20 whitespace-nowrap"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" clipRule="evenodd" /></svg>
                                چاککردن
                            </button>

                            <button
                                onClick={() => handleImproveText('translate_to_kurdish')}
                                disabled={status === TTSStatus.GENERATING}
                                className="flex-shrink-0 flex items-center gap-1 text-[10px] bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 px-2 py-1 rounded transition-colors border border-purple-500/20 whitespace-nowrap"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.89 18.89 0 01-2.46 6.374 18.897 18.897 0 016 3.126 1 1 0 101.414-1.414 20.9 20.9 0 00-5.698-3.053c.681-1.04 1.5-2.008 2.459-2.803a1 1 0 10-1.415-1.414 16.92 16.92 0 00-2.388 2.924H2a1 1 0 010-2h4V3a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                وەرگێڕان
                            </button>

                            {/* Language Toggle */}
                            <button onClick={() => setLanguage(l => l === 'ku' ? 'en' : 'ku')} className={`flex-shrink-0 text-xs px-3 py-1 rounded-full border transition-all flex items-center gap-1 ${language === 'en' ? 'bg-blue-500/20 text-blue-300 border-blue-500/50' : 'bg-green-500/20 text-green-300 border-green-500/50'}`}>
                                <span className={language === 'ku' ? 'font-bold' : 'opacity-50'}>KU</span>
                                <span className="opacity-30">/</span>
                                <span className={language === 'en' ? 'font-bold' : 'opacity-50'}>EN</span>
                            </button>

                            <div className="w-px h-4 bg-white/10 mx-1 flex-shrink-0"></div>

                            {/* Batch Toggle */}
                            <button onClick={() => setIsBatchMode(!isBatchMode)} className={`flex-shrink-0 text-xs px-3 py-1 rounded-full border transition-all whitespace-nowrap ${isBatchMode ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50' : 'bg-slate-700/50 text-slate-400 border-transparent hover:bg-slate-700'}`}>
                                {isBatchMode ? 'مۆدی کۆمەڵ' : 'تاک'}
                            </button>

                            <button onClick={() => setText('')} className="flex-shrink-0 text-xs text-rose-400 hover:text-rose-300 transition-colors bg-rose-500/10 px-3 py-1 rounded-full whitespace-nowrap">پاککردنەوە</button>
                        </div>
                    </div>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="لێرە بنووسە... (تکایە دەقی کوردی بنووسە - یان English بۆ وەرگێڕان)"
                        className="w-full h-48 bg-transparent p-4 text-right font-kurdish text-lg md:text-xl text-white placeholder-slate-600 focus:outline-none resize-none leading-loose"
                    />
                    <div className="p-3 bg-slate-900/50 rounded-b-xl flex gap-2 overflow-x-auto scrollbar-hide">
                        {SAMPLE_TEXTS.map((sample, idx) => (
                            <button key={idx} onClick={() => setText(sample)} className="whitespace-nowrap px-4 py-2 rounded-full bg-slate-800 border border-slate-700 hover:border-soran-500/50 hover:bg-slate-700 text-xs text-slate-300 transition-all font-kurdish">
                                نموونەی {idx + 1}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Settings Section */}
                <div className="flex flex-col gap-3 shrink-0">
                    <button
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-between transition-all ${isSettingsOpen ? 'bg-slate-700 text-white' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white border border-white/10'}`}
                    >
                        <span className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                            ڕێکخستنەکان (دەنگ و شێواز)
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-300 ${isSettingsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Collapsible Settings Area - Fixed height to prevent layout shift */}
                    {isSettingsOpen && (
                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">

                            {/* Voice Selection */}
                            <div className="bg-slate-800/50 p-5 rounded-2xl border border-white/10">
                                <h3 className="text-base font-bold text-slate-200 mb-4">دەنگ هەڵبژێرە</h3>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                    {AVAILABLE_VOICES.map((voice) => (
                                        <button key={voice.id} onClick={() => setSelectedVoice(voice)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${selectedVoice.id === voice.id ? 'bg-indigo-600/20 border-indigo-500/50 ring-1 ring-indigo-500/50' : 'bg-slate-900/40 border-slate-700/50'}`}>
                                            <div className="flex flex-col items-start text-right">
                                                <span className="font-bold text-base text-white">{voice.name}</span>
                                                <span className="text-xs text-slate-400 mt-1">{voice.description}</span>
                                            </div>
                                            {selectedVoice.id === voice.id && <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)] shrink-0 mr-2"></div>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tone & Speed */}
                            <div className="bg-slate-800/50 p-5 rounded-2xl border border-white/10">
                                <h3 className="text-base font-bold text-slate-200 mb-4">شێواز</h3>
                                <div className="grid grid-cols-2 gap-2 mb-6 max-h-40 overflow-y-auto custom-scrollbar">
                                    {AVAILABLE_TONES.map((tone) => (
                                        <button key={tone.name} onClick={() => setSelectedTone(tone)} className={`text-right p-2.5 rounded-lg border transition-all ${selectedTone.name === tone.name ? 'bg-soran-600/20 border-soran-500/50 text-white' : 'bg-slate-900/40 border-slate-700/50 text-slate-400'}`}>
                                            <div className="font-medium text-xs md:text-sm">{tone.name}</div>
                                        </button>
                                    ))}
                                </div>

                                <h3 className="text-base font-bold text-slate-200 mb-4">خێرایی</h3>
                                <div className="flex gap-2 flex-wrap">
                                    {AVAILABLE_SPEEDS.map((speed) => (
                                        <button key={speed.name} onClick={() => setSelectedSpeed(speed)} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all min-w-[60px] ${selectedSpeed.name === speed.name ? 'bg-soran-600 text-white' : 'bg-slate-900/60 text-slate-400'}`}>{speed.name}</button>
                                    ))}
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </section>

            {/* Left Column: Output - Fixed width */}
            <section className="flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group shrink-0">
                    <div className="absolute top-0 left-0 -ml-16 -mt-16 w-32 h-32 bg-soran-500/20 blur-3xl rounded-full group-hover:bg-soran-500/30 transition-all duration-700"></div>
                    <button onClick={handleGenerate} disabled={status === TTSStatus.GENERATING || !text} className={`w-full relative py-4 rounded-xl font-bold text-xl tracking-wide shadow-lg transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden ${status === TTSStatus.GENERATING || !text ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-soran-600 text-white hover:scale-[1.02]'}`}>
                        {status === TTSStatus.GENERATING ? <span className="font-kurdish flex items-center gap-2">جێبەجێکردن... {bgProcessing > 0 && `(${bgProcessing})`}</span> : <span className="font-kurdish">دروستکردنی دەنگ</span>}
                    </button>
                    {errorMsg && <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm text-center font-kurdish">{errorMsg}</div>}
                </div>

                <div className={`transition-all duration-500 shrink-0 ${audioBuffer ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 pointer-events-none grayscale'}`}>
                    <div className="bg-slate-800/80 p-6 rounded-3xl border border-white/10 backdrop-blur-md shadow-lg">
                        <div className="flex justify-between items-end mb-4">
                            <div className="text-right"><h4 className="text-white font-bold text-lg">پێشبینینی دەنگ</h4><p className="text-xs text-slate-400 mt-1 font-sans">{selectedVoice.name}</p></div>
                            {status === TTSStatus.PLAYING && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-soran-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-soran-500"></span></span>}
                        </div>

                        {/* Highlighted Text Display */}
                        {(status === TTSStatus.PLAYING || currentText) && <HighlightedTextDisplay />}

                        <div className="bg-slate-900/50 rounded-xl p-2 mb-4 border border-white/5 h-24 flex items-center justify-center relative overflow-hidden">
                            <Waveform analyser={analyser} isPlaying={status === TTSStatus.PLAYING} color="#38bdf8" />
                        </div>
                        <div className="flex gap-4 mb-6">
                            {/* Controls */}
                            <div className="flex-1 bg-slate-900/40 p-2 rounded-lg border border-white/5 flex flex-col items-center"><span className="text-[10px] text-slate-400 mb-1">SPEED</span><input type="range" min="0.5" max="2" step="0.25" value={playbackSpeed} onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))} className="w-full h-1 bg-slate-700 rounded-full" /></div>
                            <div className="flex-1 bg-slate-900/40 p-2 rounded-lg border border-white/5 flex flex-col items-center"><span className="text-[10px] text-slate-400 mb-1">VOL</span><input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-full h-1 bg-slate-700 rounded-full" /></div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={status === TTSStatus.PLAYING ? stopAudio : () => playAudio(audioBuffer)} className={`flex-1 ${status === TTSStatus.PLAYING ? 'bg-slate-700 text-white' : 'bg-white text-slate-900'} py-3 rounded-xl font-bold transition-colors flex justify-center items-center gap-2`}>{status === TTSStatus.PLAYING ? 'وەستان' : 'لێدانەوە'}</button>
                            <button onClick={() => handleDownload(audioBuffer)} className="w-14 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
                        </div>
                    </div>
                </div>

                {/* History - Always reserve space to prevent layout shift */}
                <div className="bg-slate-800/40 p-4 rounded-3xl border border-white/5 min-h-[120px] shrink-0">
                    <h4 className="text-slate-400 text-sm font-bold mb-3 px-2">دوایین بەرهەمەکان</h4>
                    {history.length > 0 ? (
                        <div className="space-y-2">
                            {history.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl hover:bg-slate-800 transition-colors group">
                                    <div className="flex-1 min-w-0 ml-3"><p className="text-white text-sm truncate font-medium">{item.content}</p><p className="text-slate-500 text-xs">{item.voiceName}</p></div>
                                    <div className="flex gap-2"><button onClick={() => playAudio(item.audioBuffer, item.content)} className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-soran-600 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg></button></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-16 text-slate-600 text-xs">
                            هیچ مێژوویەک نییە
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default TTSPage;
