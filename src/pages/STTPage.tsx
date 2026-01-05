
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TranscriptionActions } from '../components/STT/TranscriptionActions';
import { Mic, Upload, FileAudio, Trash2, Copy, CheckCircle, Play, Pause, Square } from 'lucide-react';
import { transcribeAudio } from '../../services/geminiService';
import { saveToHistory } from '../../services/storageService';
import { incrementStat } from '../../services/usageService';


const STTPage: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [transcription, setTranscription] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [targetLanguage, setTargetLanguage] = useState<'ku' | 'en' | 'auto'>('ku');

    // Audio playback with highlighting
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const [audioDuration, setAudioDuration] = useState(0);

    const apiKey = localStorage.getItem('gemini_api_key');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const animationRef = useRef<number | null>(null);

    // Create audio URL when blob changes
    useEffect(() => {
        if (audioBlob) {
            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);

            // Get audio duration
            const audio = new Audio(url);
            audio.onloadedmetadata = () => {
                setAudioDuration(audio.duration);
            };

            return () => URL.revokeObjectURL(url);
        }
    }, [audioBlob]);

    // Split transcription into words
    const words = transcription ? transcription.split(/\s+/).filter(w => w.length > 0) : [];

    // Calculate word timing based on audio duration
    const getWordTimings = useCallback(() => {
        if (words.length === 0 || audioDuration === 0) return [];
        const timePerWord = audioDuration / words.length;
        return words.map((_, index) => ({
            start: index * timePerWord,
            end: (index + 1) * timePerWord
        }));
    }, [words, audioDuration]);

    // Update highlighted word based on current time
    const updateHighlight = useCallback(() => {
        if (!audioRef.current || !isPlaying) return;

        const currentTime = audioRef.current.currentTime;
        const timings = getWordTimings();

        let newIndex = -1;
        for (let i = 0; i < timings.length; i++) {
            if (currentTime >= timings[i].start && currentTime < timings[i].end) {
                newIndex = i;
                break;
            }
        }

        if (newIndex !== currentWordIndex) {
            setCurrentWordIndex(newIndex);
        }

        if (isPlaying) {
            animationRef.current = requestAnimationFrame(updateHighlight);
        }
    }, [isPlaying, currentWordIndex, getWordTimings]);

    // Start/stop animation loop
    useEffect(() => {
        if (isPlaying) {
            animationRef.current = requestAnimationFrame(updateHighlight);
        } else {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        }
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isPlaying, updateHighlight]);

    const playAudio = () => {
        if (!audioUrl) return;

        if (!audioRef.current) {
            audioRef.current = new Audio(audioUrl);
            audioRef.current.onended = () => {
                setIsPlaying(false);
                setCurrentWordIndex(-1);
            };
        }

        audioRef.current.play();
        setIsPlaying(true);
    };

    const pauseAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        setIsPlaying(false);
    };

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
        setCurrentWordIndex(-1);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setError(null);
        } catch (e: any) {
            setError("هەڵە لە کردنەوەی مایک.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type.startsWith('audio/')) {
                setAudioBlob(file);
                setTranscription('');
                setCurrentWordIndex(-1);
            } else {
                setError("تەنها پەڕگەی دەنگی.");
            }
        }
    };

    const handleTranscribe = async () => {
        if (!audioBlob || !apiKey) {
            if (!apiKey) setError("کلیلی API داخل بکە.");
            return;
        }

        setIsProcessing(true);
        setError(null);
        setCurrentWordIndex(-1);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            const base64Data = reader.result?.toString().split(',')[1];
            if (base64Data) {
                try {
                    const text = await transcribeAudio(apiKey, base64Data, audioBlob.type || 'audio/wav', targetLanguage);
                    setTranscription(text);
                    incrementStat('sttCount');
                    saveToHistory({ id: Date.now().toString(), type: 'STT', content: text, timestamp: new Date() });
                } catch {
                    setError("کێشەیەک ڕوویدا.");
                } finally {
                    setIsProcessing(false);
                }
            }
        };
    };

    const clearAudio = () => {
        stopAudio();
        setAudioBlob(null);
        setAudioUrl(null);
        setTranscription('');
        audioRef.current = null;
    };

    // Highlighted Text Component
    const HighlightedText = ({ isMobile = false }: { isMobile?: boolean }) => (
        <p className={`${isMobile ? 'text-sm' : 'text-base'} leading-loose text-slate-200 font-kurdish whitespace-pre-wrap`}>
            {words.map((word, index) => (
                <span
                    key={index}
                    className={`transition-all duration-150 ${index === currentWordIndex
                        ? 'bg-emerald-500/40 text-white px-1 py-0.5 rounded'
                        : index < currentWordIndex
                            ? 'text-slate-400'
                            : ''
                        }`}
                >
                    {word}{' '}
                </span>
            ))}
        </p>
    );

    // Playback Controls Component
    const PlaybackControls = ({ small = false }: { small?: boolean }) => (
        <div className={`flex items-center gap-2 ${small ? 'mt-2' : 'mt-4'}`}>
            {!isPlaying ? (
                <button
                    onClick={playAudio}
                    className={`flex items-center gap-1.5 ${small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors`}
                >
                    <Play size={small ? 14 : 16} /> پەخشکردن
                </button>
            ) : (
                <>
                    <button
                        onClick={pauseAudio}
                        className={`flex items-center gap-1.5 ${small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold transition-colors`}
                    >
                        <Pause size={small ? 14 : 16} /> وەستان
                    </button>
                    <button
                        onClick={stopAudio}
                        className={`flex items-center gap-1.5 ${small ? 'px-2 py-1.5' : 'px-3 py-2'} bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors`}
                    >
                        <Square size={small ? 12 : 14} />
                    </button>
                </>
            )}
            {isPlaying && (
                <span className="text-xs text-emerald-400 animate-pulse flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
                    پەخشدەکرێت...
                </span>
            )}
        </div>
    );

    const LanguageSelector = () => (
        <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
            <button onClick={() => setTargetLanguage('ku')} className={`px-3 py-1 text-xs rounded-md transition-all ${targetLanguage === 'ku' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}>Kurdish</button>
            <button onClick={() => setTargetLanguage('en')} className={`px-3 py-1 text-xs rounded-md transition-all ${targetLanguage === 'en' ? 'bg-blue-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}>English</button>
            <button onClick={() => setTargetLanguage('auto')} className={`px-3 py-1 text-xs rounded-md transition-all ${targetLanguage === 'auto' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}>Auto</button>
        </div>
    );

    // ============================================
    // MOBILE VIEW
    // ============================================
    const MobileView = () => (
        <div className="lg:hidden flex flex-col gap-4 py-4">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Mic size={20} className="text-emerald-400" />
                وەرگێڕی دەنگ
            </h1>

            {!audioBlob ? (
                <div className="flex flex-col items-center gap-4 py-8">
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}
                    >
                        {isRecording ? <div className="w-8 h-8 bg-white rounded-md"></div> : <Mic size={36} className="text-white" />}
                    </button>
                    <p className="text-sm text-slate-400">{isRecording ? "تۆمارکردن..." : "کلیک بکە"}</p>

                    <div className="relative mt-4">
                        <input type="file" accept="audio/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0" />
                        <button className="px-4 py-2 bg-slate-800 text-slate-400 rounded-lg text-sm flex items-center gap-2"><Upload size={14} />هەڵبژاردنی پەڕگە</button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400"><FileAudio size={32} /></div>
                    <p className="text-sm text-slate-400">{(audioBlob.size / 1024 / 1024).toFixed(2)} MB</p>

                    <LanguageSelector />

                    <div className="flex gap-2">
                        <button onClick={handleTranscribe} disabled={isProcessing} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold disabled:opacity-50">{isProcessing ? "..." : "وەرگێڕان"}</button>
                        <button onClick={clearAudio} className="p-2 bg-slate-800 text-rose-400 rounded-lg"><Trash2 size={18} /></button>
                    </div>
                </div>
            )}

            {error && <p className="text-rose-400 text-xs text-center">{error}</p>}

            {transcription && (
                <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4 mt-4">
                    <HighlightedText isMobile />
                    {audioUrl && <PlaybackControls small />}
                    <TranscriptionActions
                        transcription={transcription}
                        audioDuration={audioDuration}
                        className="mt-3 pt-3 border-t border-white/5 w-full justify-between"
                        buttonClassName="text-[10px] text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded border border-white/5 flex-1 flex justify-center"
                    />
                </div>
            )}
        </div>
    );

    // ============================================
    // DESKTOP VIEW (Professional Two-Panel Layout)
    // ============================================
    const DesktopView = () => (
        <div className="hidden lg:grid grid-cols-2 gap-6 h-[calc(100vh-100px)]">

            {/* Left Panel: Input */}
            <div className="bg-slate-800/30 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center">
                {!audioBlob ? (
                    <>
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`w-28 h-28 rounded-full flex items-center justify-center transition-all shadow-2xl ${isRecording ? 'bg-rose-500 shadow-rose-500/30 scale-110' : 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:scale-105 shadow-emerald-500/20'}`}
                        >
                            {isRecording ? <div className="w-10 h-10 bg-white rounded-md"></div> : <Mic size={44} className="text-white" />}
                        </button>
                        <p className="mt-4 text-base font-bold text-slate-300">{isRecording ? "تۆمارکردن..." : "کلیک بکە بۆ تۆمارکردن"}</p>

                        <div className="flex items-center gap-3 my-6 w-full px-16">
                            <div className="h-px bg-white/10 flex-1"></div>
                            <span className="text-slate-500 text-xs">یان</span>
                            <div className="h-px bg-white/10 flex-1"></div>
                        </div>

                        <div className="relative">
                            <input type="file" accept="audio/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-700/50 border border-white/10 text-slate-300 hover:bg-slate-700 transition-colors text-sm">
                                <Upload size={16} /> هەڵبژاردنی پەڕگەی دەنگی
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-center">
                        <div className="w-20 h-20 mx-auto bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20"><FileAudio size={40} /></div>
                        <h3 className="text-lg font-bold text-white mt-4">پەڕگەی دەنگی ئامادەیە</h3>
                        <p className="text-slate-400 text-sm">{(audioBlob.size / 1024 / 1024).toFixed(2)} MB</p>

                        <div className="flex justify-center mt-4">
                            <LanguageSelector />
                        </div>

                        <div className="flex gap-3 mt-6 justify-center">
                            <button onClick={handleTranscribe} disabled={isProcessing} className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 flex items-center gap-2 transition-all">
                                {isProcessing ? <><span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span> دەیکەمە نووسین...</> : "وەرگێڕان بۆ نووسین"}
                            </button>
                            <button onClick={clearAudio} className="p-2.5 bg-slate-700 text-rose-400 hover:bg-rose-500/10 rounded-lg border border-white/5"><Trash2 size={18} /></button>
                        </div>
                    </div>
                )}
                {error && <p className="mt-4 text-rose-400 text-sm">{error}</p>}
            </div>

            {/* Right Panel: Output */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl flex flex-col">
                <div className="px-5 py-3 border-b border-white/5 flex justify-between items-center shrink-0">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5"><CheckCircle size={14} className="text-emerald-400" /> دەقی وەرگیراو</span>
                    <div className="flex items-center gap-2">
                        {transcription && audioUrl && (
                            <>
                                {!isPlaying ? (
                                    <button onClick={playAudio} className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"><Play size={12} /> پەخش</button>
                                ) : (
                                    <button onClick={pauseAudio} className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1"><Pause size={12} /> وەستان</button>
                                )}
                            </>
                        )}
                        {transcription && (
                            <TranscriptionActions
                                transcription={transcription}
                                audioDuration={audioDuration}
                                buttonClassName="text-[10px] text-slate-400 hover:text-white bg-white/5 px-2 py-1 rounded hover:bg-white/10 transition-colors"
                            />
                        )}
                    </div>
                </div>
                <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
                    {transcription ? (
                        <>
                            <HighlightedText />
                            {audioUrl && <PlaybackControls />}
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-40">
                            <span className="text-4xl mb-2">✎</span>
                            <p className="text-xs">وەرگێڕان لێرە دەردەکەوێت</p>
                        </div>
                    )}
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

export default STTPage;
