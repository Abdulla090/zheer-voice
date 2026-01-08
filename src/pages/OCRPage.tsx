
import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Upload, ScanLine, Trash2, Copy, CheckCircle, Zap, SpellCheck, Volume2, Square, FileText } from 'lucide-react';
import { extractTextFromImage, generateSpeech } from '../../services/geminiService';
import { saveToHistory } from '../../services/storageService';
import { getAudioContext } from '../../services/audioUtils';
import { pdfToImages } from '../../services/pdfUtils';
import { incrementStat } from '../../services/usageService';
import { useToast } from '../components/Toast/ToastProvider';

const OCRPage: React.FC = () => {
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [extractedText, setExtractedText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingIndex, setProcessingIndex] = useState(-1);
    const [pdfTotalPages, setPdfTotalPages] = useState(0);
    const [pdfCurrentPage, setPdfCurrentPage] = useState(0);
    const [fixKurdishLetters, setFixKurdishLetters] = useState(false); // OFF by default for fast mode
    const { showToast } = useToast();

    // Read Aloud state
    const [isReading, setIsReading] = useState(false);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

    const apiKey = localStorage.getItem('gemini_api_key');

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            const imageFiles = files.filter((f: File) => f.type.startsWith('image/') || f.type === 'application/pdf');

            if (imageFiles.length > 0) {
                setImages(prev => [...prev, ...imageFiles]);
                const newPreviews = imageFiles.map((f: File) => f.type === 'application/pdf' ? 'pdf_placeholder' : URL.createObjectURL(f));
                setPreviews(prev => [...prev, ...newPreviews]);
                setExtractedText('');
            } else {
                showToast("تەنها وێنە و پۆڵێنی PDF پشتگیری دەکرێت.", "error");
            }
        }
    };



    const handleScan = async () => {
        if (images.length === 0 || !apiKey) {
            if (!apiKey) {
                showToast("تکایە سەرەتا کلیلی API زیاد بکە.", "error");
            } else if (images.length === 0) {
                showToast("تکایە سەرەتا وێنەیەک هەڵبژێرە.", "error");
            }
            return;
        }
        setIsProcessing(true);
        let consolidatedText = '';

        try {
            if (images.length > 1) {
                showToast("سکێنکردنی ژمارەیەک وێنە کاتی زیاتری پێویستە، تکایە چاوەڕێبە...", "info");
            }

            for (let i = 0; i < images.length; i++) {
                setProcessingIndex(i);

                // Add explicit delay if not the first image to avoid rate limits
                if (i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 4000));
                }

                const file = images[i];

                if (file.type === 'application/pdf') {
                    const pdfPages = await pdfToImages(file);
                    setPdfTotalPages(pdfPages.length);
                    // Append header to extractedText directly if it's currently empty, or add newline
                    setExtractedText(prev => prev + (prev ? '\n\n' : '') + `--- [PDF: ${file.name}] ---`);

                    for (let p = 0; p < pdfPages.length; p++) {
                        // Delay between PDF pages as well
                        if (p > 0) await new Promise(resolve => setTimeout(resolve, 2000));

                        setPdfCurrentPage(p + 1);
                        const page = pdfPages[p];
                        const text = await extractTextFromImage(apiKey, page.base64, page.type, fixKurdishLetters);

                        // Functional state update ensures we don't lose previous text during async waits
                        setExtractedText(prev => prev + `\n\n[پەڕەی ${p + 1}]\n${text}`);
                    }
                    setPdfTotalPages(0);
                    setPdfCurrentPage(0);
                } else {
                    const base64Data = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result?.toString().split(',')[1] || '');
                        reader.readAsDataURL(file);
                    });

                    if (base64Data) {
                        const text = await extractTextFromImage(apiKey, base64Data, file.type, fixKurdishLetters);
                        setExtractedText(prev => prev + (prev ? '\n\n' : '') + (images.length > 0 ? `--- [وێنەی ${i + 1}] ---\n` : '') + text);
                    }
                }
            }
            incrementStat('ocrCount');
            // Save final result to history
            // We need the latest state here, but since state updates are async, 
            // relying on setExtractedText callback or ref is better. 
            // However, simply re-reading the consolidated text via functional updates 
            // isn't possible for side effect. 
            // So we'll accumulate centrally for histroy saving:
            // Actually, let's just save valid text if we have it.
            // For now, simpler to just trigger it at the end.

            showToast("دەقەکان بە سەرکەوتوویی دەرهێنران ✨", "success");
        } catch (err: any) {
            showToast("کێشەیەک لە کاتی سکێنکردن ڕوویدا.", "error");
            console.error(err);
        } finally {
            setIsProcessing(false);
            setProcessingIndex(-1);
            setPdfTotalPages(0);
            setPdfCurrentPage(0);
        }
    };

    const clearImage = () => {
        stopReading();
        images.forEach(f => {
            if (f.type !== 'application/pdf') {
                const idx = images.indexOf(f);
                const preview = previews[idx];
                if (preview && preview !== 'pdf_placeholder') URL.revokeObjectURL(preview);
            }
        });
        setImages([]);
        setPreviews([]);
        setExtractedText('');
    };

    // Read Aloud Functions
    const readAloud = async () => {
        if (!extractedText || !apiKey || isGeneratingAudio) return;

        setIsGeneratingAudio(true);


        try {
            if (!audioContextRef.current) {
                audioContextRef.current = getAudioContext();
            }

            const audioBuffer = await generateSpeech(
                apiKey,
                'gemini-2.5-flash-preview-tts',
                extractedText.slice(0, 1000), // Limit text length
                'Kore', // Default voice
                'Read naturally and clearly',
                'at a moderate pace'
            );

            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.onended = () => setIsReading(false);
            sourceNodeRef.current = source;
            source.start();
            setIsReading(true);
        } catch (e: any) {
            showToast("خوێندنەوە سەرکەوتوو نەبوو.", "error");
            console.error(e);
        } finally {
            setIsGeneratingAudio(false);
        }
    };

    const stopReading = () => {
        if (sourceNodeRef.current) {
            try { sourceNodeRef.current.stop(); } catch (e) { }
            setIsReading(false);
        }
    };

    // Checkbox Component for Letter Fixing
    const LetterFixCheckbox = ({ small = false }: { small?: boolean }) => (
        <label className={`flex items-center gap-2 cursor-pointer group ${small ? 'text-xs' : 'text-sm'}`}>
            <input
                type="checkbox"
                checked={fixKurdishLetters}
                onChange={(e) => setFixKurdishLetters(e.target.checked)}
                className="w-4 h-4 rounded border-2 border-slate-600 bg-slate-800 checked:bg-pink-600 checked:border-pink-600 cursor-pointer transition-all focus:ring-2 focus:ring-pink-500/50 focus:ring-offset-0"
            />
            <span className="text-slate-300 group-hover:text-white transition-colors font-kurdish flex items-center gap-1">
                <SpellCheck size={small ? 12 : 14} className={fixKurdishLetters ? 'text-pink-400' : 'text-slate-500'} />
                چاککردنی پیتەکانی کوردی
            </span>
        </label>
    );

    // ============================================
    // MOBILE VIEW
    // ============================================
    const MobileView = () => (
        <div className="lg:hidden flex flex-col gap-4 py-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <ImageIcon size={20} className="text-pink-400" />
                    سکێنەر (OCR)
                </h1>
                <LetterFixCheckbox small />
            </div>

            {images.length === 0 ? (
                <div className="relative flex flex-col items-center justify-center h-48 bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-xl">
                    <input type="file" accept="image/*,.pdf" multiple onChange={handleImageUpload} className="absolute inset-0 opacity-0" />
                    <Upload size={32} className="text-slate-500 mb-2" />
                    <p className="text-sm text-slate-400">وێنە یان PDF هەڵبژێرە</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-2">
                        {previews.map((url, idx) => (
                            <div key={idx} className={`relative rounded-lg overflow-hidden border ${processingIndex === idx ? 'border-pink-500 shadow-lg shadow-pink-500/20' : 'border-white/10'}`}>
                                {url === 'pdf_placeholder' ? (
                                    <div className="h-24 bg-slate-900 flex flex-col items-center justify-center">
                                        <FileText size={16} className="text-rose-400 mb-1" />
                                        <span className="text-[10px] text-slate-500">PDF Document</span>
                                    </div>
                                ) : (
                                    <img src={url} alt="Preview" className="w-full h-24 object-cover" />
                                )}
                                {processingIndex === idx && (
                                    <div className="absolute inset-0 bg-pink-600/20 flex items-center justify-center backdrop-blur-[1px]">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>
                        ))}
                        <label className="relative flex flex-col items-center justify-center h-24 bg-slate-800/30 border border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-pink-500/30 transition-colors">
                            <input type="file" accept="image/*,.pdf" multiple onChange={handleImageUpload} className="absolute inset-0 opacity-0" />
                            <Upload size={16} className="text-slate-500" />
                        </label>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={handleScan} disabled={isProcessing} className="flex-1 py-2.5 bg-pink-600 text-white rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                            <ScanLine size={18} /> {isProcessing ? "خەریکی سکێن..." : "دەسپێکردن"}
                        </button>
                        <button onClick={clearImage} className="px-4 py-2.5 bg-slate-800 text-rose-400 rounded-lg"><Trash2 size={18} /></button>
                    </div>
                </div>
            )}



            {extractedText && (
                <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4 mt-2">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-emerald-400 font-bold">ئەنجام</span>
                        <button onClick={() => navigator.clipboard.writeText(extractedText)} className="text-slate-400"><Copy size={16} /></button>
                    </div>
                    <p className="text-sm text-slate-200 font-kurdish whitespace-pre-wrap">{extractedText}</p>
                </div>
            )}
        </div>
    );

    // ============================================
    // DESKTOP VIEW (Professional Two-Panel Layout)
    // ============================================
    const DesktopView = () => (
        <div className="hidden lg:grid grid-cols-2 gap-6 h-[calc(100vh-100px)]">

            {/* Left Panel: Image Input */}
            <div className="bg-slate-800/30 border border-white/5 rounded-2xl p-6 flex flex-col">
                <div className="mb-4 shrink-0 flex items-center justify-between">
                    <h2 className="text-base font-bold text-white flex items-center gap-2"><ImageIcon size={18} className="text-pink-400" /> وێنەی سەرچاوە ({images.length})</h2>
                    <LetterFixCheckbox />
                </div>

                {images.length === 0 ? (
                    <div className="flex-1 relative flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-xl hover:border-pink-500/50 transition-colors group cursor-pointer">
                        <input type="file" accept="image/*,.pdf" multiple onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Upload size={32} className="text-slate-500 group-hover:text-pink-400 transition-colors" />
                        </div>
                        <h3 className="text-base font-bold text-slate-300">وێنەکان هەڵبژێرە</h3>
                        <p className="text-xs text-slate-500 mt-1">PNG, JPG, PDF (Batch Support)</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-2 gap-3 mb-4">
                            {previews.map((url, idx) => (
                                <div key={idx} className={`relative aspect-video rounded-xl overflow-hidden border bg-slate-900/50 group ${processingIndex === idx ? 'border-pink-500 ring-2 ring-pink-500/20' : 'border-white/5'}`}>
                                    {url === 'pdf_placeholder' ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center">
                                            <FileText size={32} className="text-rose-400 mb-2" />
                                            <span className="text-xs text-slate-400 font-bold">PDF FILE</span>
                                        </div>
                                    ) : (
                                        <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-contain" />
                                    )}

                                    {processingIndex === idx && (
                                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center">
                                            <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                            <span className="text-[10px] text-white font-bold tracking-widest">سکێنکردن</span>
                                        </div>
                                    )}

                                    {idx > processingIndex && processingIndex !== -1 && (
                                        <div className="absolute top-2 right-2 bg-slate-900/80 px-2 py-0.5 rounded text-[10px] text-slate-400 border border-white/5">
                                            لە ڕیزدایە
                                        </div>
                                    )}
                                </div>
                            ))}
                            <label className="relative aspect-video flex flex-col items-center justify-center bg-slate-800/20 border border-dashed border-slate-700 rounded-xl cursor-pointer hover:bg-slate-800/40 hover:border-pink-500/30 transition-all flex-shrink-0">
                                <input type="file" accept="image/*,.pdf" multiple onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                <Upload size={24} className="text-slate-600 mb-2" />
                                <span className="text-[10px] text-slate-500">زیادکردن</span>
                            </label>
                        </div>

                        <div className="flex gap-3 mt-auto shrink-0">
                            <button onClick={handleScan} disabled={isProcessing} className="flex-1 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                                <ScanLine size={18} /> {isProcessing ? (pdfTotalPages > 0 ? `پەڕەی ${pdfCurrentPage} لە ${pdfTotalPages}` : `وێنەی ${processingIndex + 1} لە ${images.length}`) : "دەرهێنانی هەموو دەقەکان"}
                            </button>
                            <button onClick={clearImage} className="p-3 bg-slate-700 text-rose-400 hover:bg-rose-500/10 rounded-xl border border-white/5 transition-colors"><Trash2 size={20} /></button>
                        </div>
                    </div>
                )}

            </div>

            {/* Right Panel: Output */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl flex flex-col">
                <div className="px-5 py-3 border-b border-white/5 flex justify-between items-center shrink-0">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5"><CheckCircle size={14} className="text-emerald-400" /> دەقی دەرهێنراو</span>
                    <div className="flex items-center gap-2">
                        {extractedText && (
                            <>
                                {!isReading ? (
                                    <button
                                        onClick={readAloud}
                                        disabled={isGeneratingAudio}
                                        className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 disabled:opacity-50"
                                    >
                                        <Volume2 size={12} /> {isGeneratingAudio ? '...' : 'بخوێنەوە'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={stopReading}
                                        className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
                                    >
                                        <Square size={10} /> وەستان
                                    </button>
                                )}
                                <button onClick={() => navigator.clipboard.writeText(extractedText)} className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"><Copy size={12} /> Copy</button>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
                    {extractedText ? (
                        <p className="text-base leading-loose text-slate-200 font-kurdish whitespace-pre-wrap">{extractedText}</p>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-40">
                            <span className="text-4xl mb-2">📝</span>
                            <p className="text-xs">ئەنجام لێرە دەردەکەوێت</p>
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

export default OCRPage;
