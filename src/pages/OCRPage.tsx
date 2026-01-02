
import React, { useState } from 'react';
import { Image as ImageIcon, Upload, ScanLine, Trash2, Copy, CheckCircle, Zap, SpellCheck } from 'lucide-react';
import { extractTextFromImage } from '../../services/geminiService';
import { saveToHistory } from '../../services/storageService';

const OCRPage: React.FC = () => {
    const [image, setImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [extractedText, setExtractedText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fixKurdishLetters, setFixKurdishLetters] = useState(false); // OFF by default for fast mode

    const apiKey = localStorage.getItem('gemini_api_key');

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type.startsWith('image/')) {
                setImage(file);
                setPreviewUrl(URL.createObjectURL(file));
                setExtractedText('');
            } else {
                setError("تەنها وێنە.");
            }
        }
    };

    const handleScan = async () => {
        if (!image || !apiKey) {
            if (!apiKey) setError("کلیلی API داخل بکە.");
            return;
        }

        setIsProcessing(true);
        setError(null);

        const reader = new FileReader();
        reader.readAsDataURL(image);
        reader.onloadend = async () => {
            const base64Data = reader.result?.toString().split(',')[1];
            if (base64Data) {
                try {
                    const text = await extractTextFromImage(apiKey, base64Data, image.type, fixKurdishLetters);
                    setExtractedText(text);
                    saveToHistory({ id: Date.now().toString(), type: 'OCR', content: text, timestamp: new Date() });
                } catch {
                    setError("کێشەیەک ڕوویدا.");
                } finally {
                    setIsProcessing(false);
                }
            }
        };
    };

    const clearImage = () => {
        setImage(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setExtractedText('');
    };

    // Toggle Component
    const ToggleSwitch = ({ small = false }: { small?: boolean }) => (
        <label className={`flex items-center gap-2 cursor-pointer ${small ? 'text-xs' : 'text-sm'}`}>
            <div className="relative">
                <input
                    type="checkbox"
                    checked={fixKurdishLetters}
                    onChange={(e) => setFixKurdishLetters(e.target.checked)}
                    className="sr-only"
                />
                <div className={`${small ? 'w-8 h-4' : 'w-10 h-5'} bg-slate-700 rounded-full transition-colors ${fixKurdishLetters ? 'bg-pink-600' : ''}`}></div>
                <div className={`absolute top-0.5 ${small ? 'left-0.5 w-3 h-3' : 'left-0.5 w-4 h-4'} bg-white rounded-full transition-transform ${fixKurdishLetters ? (small ? 'translate-x-4' : 'translate-x-5') : ''}`}></div>
            </div>
            <span className="text-slate-300 flex items-center gap-1">
                {fixKurdishLetters ? <SpellCheck size={small ? 12 : 14} className="text-pink-400" /> : <Zap size={small ? 12 : 14} className="text-emerald-400" />}
                {fixKurdishLetters ? 'چاککردنی پیتەکان' : 'خێرا'}
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
                <ToggleSwitch small />
            </div>

            {!image ? (
                <div className="relative flex flex-col items-center justify-center h-48 bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-xl">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0" />
                    <ImageIcon size={32} className="text-slate-500 mb-2" />
                    <p className="text-sm text-slate-400">وێنەیەک هەڵبژێرە</p>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-4">
                    <img src={previewUrl!} alt="Preview" className="w-full max-h-48 object-contain rounded-xl border border-white/10" />
                    <div className="flex gap-2">
                        <button onClick={handleScan} disabled={isProcessing} className="px-4 py-2 bg-pink-600 text-white rounded-lg font-bold disabled:opacity-50 flex items-center gap-2">
                            <ScanLine size={16} /> {isProcessing ? "..." : "سکێن"}
                        </button>
                        <button onClick={clearImage} className="p-2 bg-slate-800 text-rose-400 rounded-lg"><Trash2 size={18} /></button>
                    </div>
                </div>
            )}

            {error && <p className="text-rose-400 text-xs text-center">{error}</p>}

            {extractedText && (
                <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4 mt-2">
                    <p className="text-sm text-slate-200 font-kurdish">{extractedText}</p>
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
                    <h2 className="text-base font-bold text-white flex items-center gap-2"><ImageIcon size={18} className="text-pink-400" /> وێنەی سەرچاوە</h2>
                    <ToggleSwitch />
                </div>

                {!image ? (
                    <div className="flex-1 relative flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-xl hover:border-pink-500/50 transition-colors group cursor-pointer">
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <ImageIcon size={32} className="text-slate-500 group-hover:text-pink-400 transition-colors" />
                        </div>
                        <h3 className="text-base font-bold text-slate-300">وێنەیەک لێرە دابنێ</h3>
                        <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col">
                        <div className="flex-1 relative rounded-xl overflow-hidden border border-white/10 bg-slate-900/50 group">
                            <img src={previewUrl!} alt="Preview" className="w-full h-full object-contain" />
                            {isProcessing && (
                                <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-pink-500/50 animate-scan"></div>
                                    <p className="text-white font-bold animate-pulse">سکێنکردن...</p>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button onClick={handleScan} disabled={isProcessing} className="flex-1 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                                <ScanLine size={18} /> {isProcessing ? "سکێنکردن..." : "دەرهێنانی نووسین"}
                            </button>
                            <button onClick={clearImage} className="p-2.5 bg-slate-700 text-rose-400 hover:bg-rose-500/10 rounded-lg border border-white/5"><Trash2 size={18} /></button>
                        </div>
                    </div>
                )}
                {error && <p className="mt-4 text-rose-400 text-sm text-center">{error}</p>}
            </div>

            {/* Right Panel: Output */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl flex flex-col">
                <div className="px-5 py-3 border-b border-white/5 flex justify-between items-center shrink-0">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5"><CheckCircle size={14} className="text-emerald-400" /> دەقی دەرهێنراو</span>
                    {extractedText && <button onClick={() => navigator.clipboard.writeText(extractedText)} className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"><Copy size={12} /> Copy</button>}
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
