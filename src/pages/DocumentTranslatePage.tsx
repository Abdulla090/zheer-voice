import React, { useState, useRef } from 'react';
import { FileText, Upload, Loader2, Download, Languages, CheckCircle, AlertCircle, X, ChevronDown, FileType, Presentation, File } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { useToast } from '../components/Toast/ToastProvider';
import FormattedText from '../components/FormattedText';
import {
    translateDocx,
    translatePptx,
    translatePdfToHtml,
    getDocumentType,
    getLanguageName,
    SourceLanguage,
    TargetLanguage
} from '../../services/documentTranslationService';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type ProcessingStage = 'idle' | 'uploading' | 'parsing' | 'translating' | 'complete' | 'error';
type TranslationMode = 'format' | 'text';

interface DocumentMetadata {
    filename: string;
    type: 'pdf' | 'docx' | 'pptx' | 'txt';
    size: number;
    pageCount?: number;
}

interface TranslationResult {
    blob?: Blob;
    html?: string;
    text: string;
    outputType: 'docx' | 'pptx' | 'html' | 'txt';
}

const SUPPORTED_LANGUAGES: { code: SourceLanguage; name: string; flag: string }[] = [
    { code: 'en', name: 'ئینگلیزی', flag: '🇬🇧' },
    { code: 'ar', name: 'عەرەبی', flag: '🇸🇦' },
    { code: 'tr', name: 'تورکی', flag: '🇹🇷' },
    { code: 'fa', name: 'فارسی', flag: '🇮🇷' },
    { code: 'auto', name: 'خۆکار', flag: '🔄' },
];

const DocumentTranslatePage: React.FC = () => {
    const [stage, setStage] = useState<ProcessingStage>('idle');
    const [metadata, setMetadata] = useState<DocumentMetadata | null>(null);
    const [originalText, setOriginalText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [translationMode, setTranslationMode] = useState<TranslationMode>('format');
    const [sourceLang, setSourceLang] = useState<SourceLanguage>('en');
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
    const [currentFile, setCurrentFile] = useState<File | null>(null);

    const langDropdownRef = useRef<HTMLDivElement>(null);
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
                setProgress(Math.floor((i / totalPages) * 30));
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
        setProgressMessage('بارکردن...');
        setError(null);
        setCurrentFile(file);

        try {
            // Determine file type
            const fileType = getDocumentType(file.name);

            if (!fileType) {
                throw new Error('جۆری فایل پشتیوانی ناکرێت. تکایە PDF، DOCX، PPTX یان TXT بەکاربێنە');
            }

            setMetadata({
                filename: file.name,
                type: fileType as any,
                size: file.size
            });

            // For format-preserving mode with supported types
            if (translationMode === 'format' && (fileType === 'docx' || fileType === 'pptx')) {
                setStage('translating');
                setProgressMessage('وەرگێڕان بە پاراستنی شێواز...');

                let result: Blob;

                if (fileType === 'docx') {
                    result = await translateDocx(file, apiKey, sourceLang, 'ku', (progress) => {
                        setProgress(progress.current);
                        setProgressMessage(progress.message);
                    });

                    setTranslationResult({
                        blob: result,
                        text: '',
                        outputType: 'docx'
                    });
                } else {
                    result = await translatePptx(file, apiKey, sourceLang, 'ku', (progress) => {
                        setProgress(progress.current);
                        setProgressMessage(progress.message);
                    });

                    setTranslationResult({
                        blob: result,
                        text: '',
                        outputType: 'pptx'
                    });
                }

                setStage('complete');
                setProgress(100);
                showToast('وەرگێڕانی بەڵگەنامە تەواو بوو - شێواز پاراستراوە!', 'success');
                return;
            }

            // Parse document for text extraction
            setStage('parsing');
            setProgressMessage('خوێندنەوەی بەڵگەنامە...');
            let extractedText = '';

            if (fileType === 'pdf') {
                extractedText = await parsePDF(file);
            } else if (fileType === 'docx') {
                extractedText = await parseDOCX(file);
            } else if (fileType === 'pptx') {
                // For text mode, we still need to extract text from PPTX
                extractedText = '(پشتیوانی ناکرێت - تکایە شێوازی "پاراستنی شێواز" بەکاربێنە)';
            } else {
                extractedText = await parseTextFile(file);
            }

            if (!extractedText.trim()) {
                throw new Error('هیچ دەقێک لە بەڵگەنامەکە نەدۆزرایەوە');
            }

            setOriginalText(extractedText);
            setProgress(40);

            // For PDF in format mode, use HTML output
            if (translationMode === 'format' && fileType === 'pdf') {
                setStage('translating');
                setProgressMessage('وەرگێڕانی PDF...');

                const { html, translatedText: translated } = await translatePdfToHtml(
                    extractedText,
                    apiKey,
                    sourceLang,
                    'ku',
                    file.name,
                    (progress) => {
                        setProgress(40 + Math.floor(progress.current * 0.6));
                        setProgressMessage(progress.message);
                    }
                );

                setTranslatedText(translated);
                setTranslationResult({
                    html,
                    text: translated,
                    outputType: 'html'
                });

                setStage('complete');
                setProgress(100);
                showToast('وەرگێڕانی PDF تەواو بوو', 'success');
                return;
            }

            // Text-only translation (original behavior)
            setStage('translating');
            setProgressMessage('وەرگێڕان...');

            const { translatePdfToHtml: translateText } = await import('../../services/documentTranslationService');
            const { translatedText: translated } = await translateText(
                extractedText,
                apiKey,
                sourceLang,
                'ku',
                file.name,
                (progress) => {
                    setProgress(40 + Math.floor(progress.current * 0.6));
                    setProgressMessage(progress.message);
                }
            );

            setTranslatedText(translated);
            setTranslationResult({
                text: translated,
                outputType: 'txt'
            });

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

    const downloadTranslation = () => {
        if (!translationResult || !metadata) return;

        let blob: Blob;
        let filename: string;
        const baseName = metadata.filename.split('.')[0];

        switch (translationResult.outputType) {
            case 'docx':
                blob = translationResult.blob!;
                filename = `${baseName}_kurdish.docx`;
                break;
            case 'pptx':
                blob = translationResult.blob!;
                filename = `${baseName}_kurdish.pptx`;
                break;
            case 'html':
                blob = new Blob([translationResult.html!], { type: 'text/html;charset=utf-8' });
                filename = `${baseName}_kurdish.html`;
                break;
            default:
                blob = new Blob([translationResult.text], { type: 'text/plain;charset=utf-8' });
                filename = `${baseName}_kurdish.txt`;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
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
        setProgressMessage('');
        setError(null);
        setTranslationResult(null);
        setCurrentFile(null);
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

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText size={20} className="text-red-400" />;
            case 'docx': return <FileType size={20} className="text-blue-400" />;
            case 'pptx': return <Presentation size={20} className="text-orange-400" />;
            default: return <File size={20} className="text-slate-400" />;
        }
    };

    const getOutputDescription = () => {
        if (!translationResult) return '';
        switch (translationResult.outputType) {
            case 'docx': return 'فایلی Word (.docx) - شێواز پاراستراوە';
            case 'pptx': return 'فایلی PowerPoint (.pptx) - شێواز پاراستراوە';
            case 'html': return 'فایلی HTML - شێواز پاراستراوە';
            default: return 'فایلی دەق (.txt)';
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
                    <p className="text-xs text-slate-400">PDF، DOCX، PPTX</p>
                </div>
            </div>

            {/* Settings */}
            {stage === 'idle' && (
                <div className="space-y-3">
                    {/* Translation Mode */}
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl p-3">
                        <label className="text-xs text-slate-400 mb-2 block">شێوازی وەرگێڕان</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setTranslationMode('format')}
                                className={`py-2 px-3 rounded-lg text-sm font-bold transition-all ${translationMode === 'format'
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                            >
                                ✨ پاراستنی شێواز
                            </button>
                            <button
                                onClick={() => setTranslationMode('text')}
                                className={`py-2 px-3 rounded-lg text-sm font-bold transition-all ${translationMode === 'text'
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                            >
                                📝 دەق تەنها
                            </button>
                        </div>
                    </div>

                    {/* Source Language */}
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl p-3">
                        <label className="text-xs text-slate-400 mb-2 block">زمانی سەرچاوە</label>
                        <div className="relative" ref={langDropdownRef}>
                            <button
                                onClick={() => setShowLangDropdown(!showLangDropdown)}
                                className="w-full flex items-center justify-between bg-slate-700 rounded-lg px-4 py-2 text-white"
                            >
                                <span className="flex items-center gap-2">
                                    <span>{SUPPORTED_LANGUAGES.find(l => l.code === sourceLang)?.flag}</span>
                                    <span>{getLanguageName(sourceLang)}</span>
                                </span>
                                <ChevronDown size={18} className={`transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} />
                            </button>
                            {showLangDropdown && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 rounded-lg overflow-hidden z-50 shadow-xl border border-white/10">
                                    {SUPPORTED_LANGUAGES.map(lang => (
                                        <button
                                            key={lang.code}
                                            onClick={() => {
                                                setSourceLang(lang.code);
                                                setShowLangDropdown(false);
                                            }}
                                            className={`w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-600 transition-colors ${sourceLang === lang.code ? 'bg-purple-500/20' : ''
                                                }`}
                                        >
                                            <span>{lang.flag}</span>
                                            <span className="text-white">{lang.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upload Area */}
                    <label className="relative cursor-pointer">
                        <input
                            type="file"
                            accept=".pdf,.docx,.doc,.pptx,.ppt,.txt"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-2 border-dashed border-purple-500/30 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-purple-500/50 transition-all">
                            <Upload size={40} className="text-purple-400" />
                            <p className="text-white font-bold">فایلێک هەڵبژێرە</p>
                            <p className="text-xs text-slate-400">PDF، DOCX، PPTX یان TXT</p>
                        </div>
                    </label>
                </div>
            )}

            {/* Processing */}
            {(stage === 'uploading' || stage === 'parsing' || stage === 'translating') && (
                <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-white">{progressMessage || getStageLabel()}</span>
                        <span className="text-xs text-slate-400">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    {metadata && (
                        <div className="flex items-center gap-2 mt-3">
                            {getFileIcon(metadata.type)}
                            <p className="text-xs text-slate-500 font-kurdish">{metadata.filename}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Complete */}
            {stage === 'complete' && translationResult && (
                <div className="space-y-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
                        <CheckCircle size={24} className="text-emerald-400" />
                        <div className="flex-1">
                            <p className="text-sm font-bold text-emerald-300">وەرگێڕان تەواو بوو</p>
                            <p className="text-xs text-slate-400">{getOutputDescription()}</p>
                        </div>
                    </div>

                    {translationResult.text && (
                        <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-4 max-h-96 overflow-y-auto">
                            <FormattedText text={translationResult.text} className="text-sm text-slate-200 font-kurdish" />
                        </div>
                    )}

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
                        <p className="text-[10px] text-slate-500">Smart Document Translator • Format Preserving</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Translation Mode Toggle */}
                    {stage === 'idle' && (
                        <>
                            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                                <button
                                    onClick={() => setTranslationMode('format')}
                                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${translationMode === 'format'
                                            ? 'bg-purple-500 text-white'
                                            : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    ✨ پاراستنی شێواز
                                </button>
                                <button
                                    onClick={() => setTranslationMode('text')}
                                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${translationMode === 'text'
                                            ? 'bg-purple-500 text-white'
                                            : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    📝 دەق تەنها
                                </button>
                            </div>

                            {/* Language Selector */}
                            <div className="relative" ref={langDropdownRef}>
                                <button
                                    onClick={() => setShowLangDropdown(!showLangDropdown)}
                                    className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-1.5 text-white text-sm"
                                >
                                    <span>{SUPPORTED_LANGUAGES.find(l => l.code === sourceLang)?.flag}</span>
                                    <span>{getLanguageName(sourceLang)}</span>
                                    <Languages size={14} className="text-slate-400" />
                                    <span className="text-slate-400">→</span>
                                    <span>🟢</span>
                                    <span>کوردی</span>
                                    <ChevronDown size={14} className={`transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} />
                                </button>
                                {showLangDropdown && (
                                    <div className="absolute top-full right-0 mt-1 bg-slate-800 rounded-lg overflow-hidden z-50 shadow-xl border border-white/10 min-w-[160px]">
                                        <p className="px-3 py-1.5 text-xs text-slate-500 border-b border-white/5">زمانی سەرچاوە</p>
                                        {SUPPORTED_LANGUAGES.map(lang => (
                                            <button
                                                key={lang.code}
                                                onClick={() => {
                                                    setSourceLang(lang.code);
                                                    setShowLangDropdown(false);
                                                }}
                                                className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-700 transition-colors ${sourceLang === lang.code ? 'bg-purple-500/20' : ''
                                                    }`}
                                            >
                                                <span>{lang.flag}</span>
                                                <span className="text-white text-sm">{lang.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {stage === 'complete' && (
                        <button onClick={reset} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-bold">
                            بەڵگەنامەیەکی نوێ
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            {stage === 'idle' && (
                <div className="flex-1 flex items-center justify-center">
                    <label className="relative cursor-pointer">
                        <input
                            type="file"
                            accept=".pdf,.docx,.doc,.pptx,.ppt,.txt"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <div className="bg-gradient-to-br from-purple-500/5 to-indigo-500/5 border-2 border-dashed border-purple-500/20 rounded-3xl p-16 flex flex-col items-center justify-center gap-4 hover:border-purple-500/40 hover:bg-purple-500/10 transition-all w-[600px]">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white">
                                <Upload size={40} />
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-bold text-white mb-2">فایلی بەڵگەنامە هەڵبژێرە</p>
                                <p className="text-sm text-slate-400">پشتیوانی PDF، DOCX، PPTX و TXT</p>
                                {translationMode === 'format' && (
                                    <p className="text-xs text-purple-400 mt-2">✨ شێواز و دیزاین دەپارێزرێت</p>
                                )}
                            </div>
                            <div className="flex gap-4 mt-4">
                                <div className="bg-slate-800/50 rounded-lg px-4 py-2 flex items-center gap-2">
                                    <FileText size={16} className="text-red-400" />
                                    <span className="text-xs text-slate-300">PDF</span>
                                </div>
                                <div className="bg-slate-800/50 rounded-lg px-4 py-2 flex items-center gap-2">
                                    <FileType size={16} className="text-blue-400" />
                                    <span className="text-xs text-slate-300">DOCX</span>
                                </div>
                                <div className="bg-slate-800/50 rounded-lg px-4 py-2 flex items-center gap-2">
                                    <Presentation size={16} className="text-orange-400" />
                                    <span className="text-xs text-slate-300">PPTX</span>
                                </div>
                                <div className="bg-slate-800/50 rounded-lg px-4 py-2 flex items-center gap-2">
                                    <File size={16} className="text-slate-400" />
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
                                <h3 className="text-lg font-bold text-white">{progressMessage || getStageLabel()}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    {metadata && getFileIcon(metadata.type)}
                                    <p className="text-xs text-slate-400 font-kurdish">{metadata?.filename}</p>
                                </div>
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
                            <div className={`p-3 rounded-lg ${stage === 'uploading' || stage === 'parsing' ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-slate-900/50'}`}>
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
            {stage === 'complete' && translationResult && (
                <div className="flex-1 flex flex-col gap-4 min-h-0">
                    {/* Success Banner */}
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-5 py-3 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <CheckCircle size={24} className="text-emerald-400" />
                            <div>
                                <p className="text-sm font-bold text-emerald-300">وەرگێڕان تەواو بوو</p>
                                <p className="text-xs text-slate-400">{getOutputDescription()}</p>
                            </div>
                        </div>
                        <button onClick={downloadTranslation} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-bold flex items-center gap-2">
                            <Download size={16} /> داگیراندنی فایل
                        </button>
                    </div>

                    {/* Content Preview */}
                    {translationResult.text ? (
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
                                    <span className="text-[10px] text-slate-600">{translationResult.text.length} پیت</span>
                                </div>
                                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                                    <FormattedText text={translationResult.text} className="text-sm text-white font-kurdish leading-relaxed" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-slate-800/30 border border-white/5 rounded-2xl">
                            <div className="text-center">
                                {metadata && (
                                    <div className="inline-flex items-center gap-3 bg-slate-700/50 rounded-xl px-6 py-4 mb-4">
                                        {getFileIcon(metadata.type)}
                                        <div className="text-right">
                                            <p className="text-white font-bold">{metadata.filename.split('.')[0]}_kurdish.{translationResult.outputType}</p>
                                            <p className="text-xs text-slate-400">ئامادەیە بۆ داگیراندن</p>
                                        </div>
                                    </div>
                                )}
                                <p className="text-slate-400 text-sm">شێواز و دیزاینی فایلەکە پاراستراوە</p>
                            </div>
                        </div>
                    )}
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
