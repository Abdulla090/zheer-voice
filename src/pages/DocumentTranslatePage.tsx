import React, { useState } from 'react';
import { FileText, Upload, Loader2, Download, Languages, CheckCircle, AlertCircle, X } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { improveText } from '../../services/geminiService';
import { useToast } from '../components/Toast/ToastProvider';
import FormattedText from '../components/FormattedText';

// Set up PDF.js worker - use https:// instead of protocol-relative URL
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type ProcessingStage = 'idle' | 'uploading' | 'parsing' | 'translating' | 'complete' | 'error';

interface DocumentMetadata {
    filename: string;
    type: 'pdf' | 'docx' | 'txt';
    size: number;
    pageCount?: number;
}

const DocumentTranslatePage: React.FC = () => {
    const [stage, setStage] = useState<ProcessingStage>('idle');
    const [metadata, setMetadata] = useState<DocumentMetadata | null>(null);
    const [originalText, setOriginalText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const apiKey = localStorage.getItem('gemini_api_key');
    const { showToast } = useToast();

    const parseTextFile = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = () => reject(new Error('فایلی دەقی نەخوێندرایەوە'));
            reader.readAsText(file);
        });
    };

    const parsePDF = async (file: File): Promise<string> => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            let fullText = '';
            const totalPages = pdf.numPages;

            for (let i = 1; i <= totalPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                    .map((item: any) => item.str)
                    .join(' ');
                fullText += pageText + '\n\n';
                setProgress(Math.floor((i / totalPages) * 50)); // First 50% for parsing
            }

            return fullText;
        } catch (err: any) {
            console.error('PDF parsing error:', err);
            throw new Error(`کێشەیەک لە خوێندنەوەی PDF ڕوویدا: ${err.message || 'نەزانراو'}`);
        }
    };

    const parseDOCX = async (file: File): Promise<string> => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            return result.value;
        } catch (err) {
            throw new Error('کێشەیەک لە خوێندنەوەی DOCX ڕوویدا');
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !apiKey) {
            if (!apiKey) showToast('کلیلی API داخل بکە', 'error');
            return;
        }

        setStage('uploading');
        setProgress(0);
        setError(null);

        try {
            // Determine file type
            const fileType = file.name.toLowerCase().endsWith('.pdf') ? 'pdf'
                : file.name.toLowerCase().endsWith('.docx') ? 'docx'
                    : file.name.toLowerCase().endsWith('.txt') ? 'txt'
                        : null;

            if (!fileType) {
                throw new Error('جۆری فایل پشتیوانی ناکرێت. تکایە PDF، DOCX یان TXT بەکاربێنە');
            }

            setMetadata({
                filename: file.name,
                type: fileType,
                size: file.size
            });

            // Parse document
            setStage('parsing');
            let extractedText = '';

            if (fileType === 'pdf') {
                extractedText = await parsePDF(file);
            } else if (fileType === 'docx') {
                extractedText = await parseDOCX(file);
            } else {
                extractedText = await parseTextFile(file);
            }

            if (!extractedText.trim()) {
                throw new Error('هیچ دەقێک لە بەڵگەنامەکە نەدۆزرایەوە');
            }

            setOriginalText(extractedText);
            setProgress(50);

            // Translate document in chunks
            setStage('translating');
            const chunks = chunkText(extractedText, 3000); // Split into ~3000 char chunks
            let translatedChunks: string[] = [];

            for (let i = 0; i < chunks.length; i++) {
                const translatedChunk = await improveText(
                    apiKey,
                    'gemini-2.0-flash-exp',
                    chunks[i],
                    'translate_to_kurdish'
                );
                translatedChunks.push(translatedChunk);
                setProgress(50 + Math.floor(((i + 1) / chunks.length) * 50));
            }

            const fullTranslation = translatedChunks.join('\n\n');
            setTranslatedText(fullTranslation);
            setStage('complete');
            setProgress(100);
            showToast('وەرگێڕانی بەڵگەنامە تەواو بوو', 'success');

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'کێشەیەک ڕوویدا');
            setStage('error');
            showToast(err.message || 'کێشەیەک ڕوویدا', 'error');
        }
    };

    const chunkText = (text: string, maxLength: number): string[] => {
        const chunks: string[] = [];
        const paragraphs = text.split('\n\n');
        let currentChunk = '';

        for (const paragraph of paragraphs) {
            if ((currentChunk + paragraph).length > maxLength && currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = paragraph;
            } else {
                currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk.trim());
        }

        return chunks;
    };

    const downloadTranslation = () => {
        if (!translatedText || !metadata) return;

        const blob = new Blob([translatedText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${metadata.filename.split('.')[0]}_kurdish.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast('فایلی وەرگێڕدراو داگیرا', 'success');
    };

    const reset = () => {
        setStage('idle');
        setMetadata(null);
        setOriginalText('');
        setTranslatedText('');
        setProgress(0);
        setError(null);
    };

    const getStageLabel = () => {
        switch (stage) {
            case 'uploading': return 'بارکردن...';
            case 'parsing': return 'خوێندنەوەی بەڵگەنامە...';
            case 'translating': return 'وەرگێڕان...';
            case 'complete': return 'تەواو بوو!';
            case 'error': return 'هەڵە!';
            default: return 'ئامادە';
        }
    };

    // Mobile View
    const MobileView = () => (
        <div className="lg:hidden flex flex-col gap-4 py-4">
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white">
                    <FileText size={20} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white">وەرگێڕی بەڵگەنامە</h1>
                    <p className="text-xs text-slate-400">PDF & DOCX</p>
                </div>
            </div>

            {/* Upload Area */}
            {stage === 'idle' && (
                <label className="relative cursor-pointer">
                    <input
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-2 border-dashed border-purple-500/30 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-purple-500/50 transition-all">
                        <Upload size={40} className="text-purple-400" />
                        <p className="text-white font-bold">فایلێک هەڵبژێرە</p>
                        <p className="text-xs text-slate-400">PDF، DOCX یان TXT</p>
                    </div>
                </label>
            )}

            {/* Processing */}
            {(stage === 'uploading' || stage === 'parsing' || stage === 'translating') && (
                <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-white">{getStageLabel()}</span>
                        <span className="text-xs text-slate-400">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    {metadata && (
                        <p className="text-xs text-slate-500 mt-3 font-kurdish">{metadata.filename}</p>
                    )}
                </div>
            )}

            {/* Complete */}
            {stage === 'complete' && translatedText && (
                <div className="space-y-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
                        <CheckCircle size={24} className="text-emerald-400" />
                        <div className="flex-1">
                            <p className="text-sm font-bold text-emerald-300">وەرگێڕان تەواو بوو</p>
                            <p className="text-xs text-slate-400 font-kurdish">{metadata?.filename}</p>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-4 max-h-96 overflow-y-auto">
                        <FormattedText text={translatedText} className="text-sm text-slate-200 font-kurdish" />
                    </div>

                    <div className="flex gap-3">
                        <button onClick={downloadTranslation} className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                            <Download size={18} /> داگیراندن
                        </button>
                        <button onClick={reset} className="px-4 bg-slate-700 text-white rounded-xl">
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Error */}
            {stage === 'error' && error && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle size={24} className="text-rose-400" />
                    <div className="flex-1">
                        <p className="text-sm font-bold text-rose-300">هەڵە ڕوویدا</p>
                        <p className="text-xs text-slate-400 font-kurdish">{error}</p>
                    </div>
                    <button onClick={reset} className="p-2 hover:bg-rose-500/20 rounded-lg">
                        <X size={18} className="text-rose-400" />
                    </button>
                </div>
            )}
        </div>
    );

    // Desktop View
    const DesktopView = () => (
        <div className="hidden lg:flex flex-col h-[calc(100vh-100px)] gap-4">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0 bg-slate-800/30 border border-white/5 rounded-xl px-5 py-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                        <FileText size={18} />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-white">وەرگێڕی زیرەکی بەڵگەنامە</h1>
                        <p className="text-[10px] text-slate-500">Smart Document Translator • PDF & DOCX Support</p>
                    </div>
                </div>

                {stage === 'complete' && (
                    <button onClick={reset} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-bold">
                        بەڵگەنامەیەکی نوێ
                    </button>
                )}
            </div>

            {/* Main Content */}
            {stage === 'idle' && (
                <div className="flex-1 flex items-center justify-center">
                    <label className="relative cursor-pointer">
                        <input
                            type="file"
                            accept=".pdf,.docx,.txt"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <div className="bg-gradient-to-br from-purple-500/5 to-indigo-500/5 border-2 border-dashed border-purple-500/20 rounded-3xl p-16 flex flex-col items-center justify-center gap-4 hover:border-purple-500/40 hover:bg-purple-500/10 transition-all w-[600px]">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white">
                                <Upload size={40} />
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-bold text-white mb-2">فایلی بەڵگەنامە هەڵبژێرە</p>
                                <p className="text-sm text-slate-400">پشتیوانی PDF، DOCX و TXT</p>
                            </div>
                            <div className="flex gap-4 mt-4">
                                <div className="bg-slate-800/50 rounded-lg px-4 py-2 flex items-center gap-2">
                                    <FileText size={16} className="text-red-400" />
                                    <span className="text-xs text-slate-300">PDF</span>
                                </div>
                                <div className="bg-slate-800/50 rounded-lg px-4 py-2 flex items-center gap-2">
                                    <FileText size={16} className="text-blue-400" />
                                    <span className="text-xs text-slate-300">DOCX</span>
                                </div>
                                <div className="bg-slate-800/50 rounded-lg px-4 py-2 flex items-center gap-2">
                                    <FileText size={16} className="text-slate-400" />
                                    <span className="text-xs text-slate-300">TXT</span>
                                </div>
                            </div>
                        </div>
                    </label>
                </div>
            )}

            {/* Processing State */}
            {(stage === 'uploading' || stage === 'parsing' || stage === 'translating') && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-8 w-[600px]">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                <Loader2 size={24} className="text-purple-400 animate-spin" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white">{getStageLabel()}</h3>
                                <p className="text-xs text-slate-400 font-kurdish mt-1">{metadata?.filename}</p>
                            </div>
                            <span className="text-2xl font-bold text-purple-400">{progress}%</span>
                        </div>

                        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300 rounded-full"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                            <div className={`p-3 rounded-lg ${stage === 'uploading' || stage === 'parsing' || stage === 'translating' ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-slate-900/50'}`}>
                                <p className="text-xs text-slate-400">خوێندنەوە</p>
                                <p className="text-lg font-bold text-white">1</p>
                            </div>
                            <div className={`p-3 rounded-lg ${stage === 'translating' ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-slate-900/50'}`}>
                                <p className="text-xs text-slate-400">وەرگێڕان</p>
                                <p className="text-lg font-bold text-white">2</p>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-900/50">
                                <p className="text-xs text-slate-400">تەواو</p>
                                <p className="text-lg font-bold text-white">3</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Complete State */}
            {stage === 'complete' && translatedText && (
                <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                    {/* Original Text */}
                    <div className="flex flex-col bg-slate-800/30 border border-white/5 rounded-2xl overflow-hidden">
                        <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between shrink-0">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">دەقی سەرەتایی</span>
                            <span className="text-[10px] text-slate-600">{originalText.length} پیت</span>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                            <FormattedText text={originalText} className="text-sm text-slate-400 leading-relaxed" />
                        </div>
                    </div>

                    {/* Translated Text */}
                    <div className="flex flex-col bg-slate-900/50 border border-purple-500/20 rounded-2xl overflow-hidden">
                        <div className="px-4 py-2 border-b border-purple-500/10 flex items-center justify-between shrink-0">
                            <span className="text-xs font-bold text-purple-400 uppercase tracking-wide flex items-center gap-2">
                                <Languages size={14} /> وەرگێڕان بە کوردی
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-600">{translatedText.length} پیت</span>
                                <button onClick={downloadTranslation} className="p-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded transition-colors">
                                    <Download size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                            <FormattedText text={translatedText} className="text-sm text-white font-kurdish leading-relaxed" />
                        </div>
                    </div>
                </div>
            )}

            {/* Error State */}
            {stage === 'error' && error && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-8 w-[600px]">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center">
                                <AlertCircle size={24} className="text-rose-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-rose-300">هەڵە ڕوویدا</h3>
                                <p className="text-sm text-slate-400 font-kurdish mt-1">{error}</p>
                            </div>
                        </div>
                        <button onClick={reset} className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-colors">
                            دووبارە هەوڵبدەرەوە
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <>
            <MobileView />
            <DesktopView />
        </>
    );
};

export default DocumentTranslatePage;
