
import React, { useEffect, useState } from 'react';
import { loadHistory, clearHistory } from '../../services/storageService';
import { AnyHistoryItem, TTSHistoryItem } from '../../types';
import { Play, Trash2, Filter, FileText, Mic, Image as ImageIcon, Copy, Clock } from 'lucide-react';
import { getAudioContext } from '../../services/audioUtils';

const HistoryPage: React.FC = () => {
    const [history, setHistory] = useState<AnyHistoryItem[]>([]);
    const [filter, setFilter] = useState<'ALL' | 'TTS' | 'STT' | 'OCR'>('ALL');
    const [playingId, setPlayingId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await loadHistory();
        setHistory(data);
    };

    const handleClear = async () => {
        if (window.confirm("دڵنیایت لە سڕینەوەی تەواوی مێژوو؟")) {
            await clearHistory();
            setHistory([]);
        }
    };

    const playAudio = (buffer: AudioBuffer, id: string) => {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => setPlayingId(null);
        source.start();
        setPlayingId(id);
    };

    const filteredHistory = history.filter(item => filter === 'ALL' || item.type === filter);

    const getIcon = (type: string) => {
        switch (type) {
            case 'TTS': return <FileText size={16} className="text-indigo-400" />;
            case 'STT': return <Mic size={16} className="text-emerald-400" />;
            case 'OCR': return <ImageIcon size={16} className="text-pink-400" />;
            default: return <FileText size={16} />;
        }
    };

    const getBgColor = (type: string) => {
        switch (type) {
            case 'TTS': return 'bg-indigo-500/10 border-indigo-500/20';
            case 'STT': return 'bg-emerald-500/10 border-emerald-500/20';
            case 'OCR': return 'bg-pink-500/10 border-pink-500/20';
            default: return 'bg-slate-800';
        }
    };

    // ============================================
    // MOBILE VIEW
    // ============================================
    const MobileView = () => (
        <div className="lg:hidden flex flex-col gap-4 py-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <Clock size={20} className="text-slate-400" />
                    مێژوو
                </h1>
                <button onClick={handleClear} className="p-2 bg-rose-500/10 text-rose-400 rounded-lg"><Trash2 size={16} /></button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
                {(['ALL', 'TTS', 'STT', 'OCR'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${filter === f ? 'bg-soran-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {f === 'ALL' ? 'هەمووی' : f}
                    </button>
                ))}
            </div>

            <div className="space-y-2">
                {filteredHistory.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">هیچ داتایەک نییە</p>
                ) : (
                    filteredHistory.map(item => (
                        <div key={item.id} className={`p-3 rounded-xl border ${getBgColor(item.type)}`}>
                            <div className="flex items-center gap-2 mb-2">
                                {getIcon(item.type)}
                                <span className="text-[10px] text-slate-500 uppercase">{item.type}</span>
                                <span className="text-[10px] text-slate-600 mr-auto" dir="ltr">{new Date(item.timestamp).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-slate-200 line-clamp-2 font-kurdish">{item.content}</p>
                            <div className="flex gap-2 mt-2">
                                {item.type === 'TTS' && (
                                    <button onClick={() => playAudio((item as TTSHistoryItem).audioBuffer, item.id)} className="p-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"><Play size={14} /></button>
                                )}
                                <button onClick={() => navigator.clipboard.writeText(item.content)} className="p-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"><Copy size={14} /></button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    // ============================================
    // DESKTOP VIEW (Professional Table/List)
    // ============================================
    const DesktopView = () => (
        <div className="hidden lg:flex flex-col h-[calc(100vh-100px)] gap-4">

            {/* Header Bar */}
            <div className="flex items-center justify-between shrink-0 bg-slate-800/30 border border-white/5 rounded-xl px-5 py-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-700/50 flex items-center justify-center text-slate-400">
                        <Clock size={18} />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-white">مێژووی بەکارهێنان</h1>
                        <p className="text-[10px] text-slate-500">History &bull; {filteredHistory.length} تۆمار</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex gap-1 bg-slate-900/50 p-1 rounded-lg">
                        {(['ALL', 'TTS', 'STT', 'OCR'] as const).map(f => (
                            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filter === f ? 'bg-soran-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                                {f === 'ALL' ? 'هەمووی' : f}
                            </button>
                        ))}
                    </div>
                    <button onClick={handleClear} className="px-3 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-colors text-xs font-bold flex items-center gap-1.5">
                        <Trash2 size={14} /> سڕینەوە
                    </button>
                </div>
            </div>

            {/* Main List Area */}
            <div className="flex-1 bg-slate-800/20 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-xs text-slate-500 uppercase tracking-wide shrink-0">
                    <div className="col-span-1">جۆر</div>
                    <div className="col-span-7">ناوەڕۆک</div>
                    <div className="col-span-2">کات</div>
                    <div className="col-span-2 text-left">کردار</div>
                </div>

                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredHistory.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600">
                            <Filter size={40} className="mb-3 opacity-30" />
                            <p>هیچ داتایەک نەدۆزرایەوە</p>
                        </div>
                    ) : (
                        filteredHistory.map(item => (
                            <div key={item.id} className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center group">
                                <div className="col-span-1">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getBgColor(item.type)}`}>
                                        {getIcon(item.type)}
                                    </div>
                                </div>
                                <div className="col-span-7">
                                    <p className="text-sm text-slate-200 font-kurdish line-clamp-1">{item.content}</p>
                                    {item.type === 'TTS' && (item as TTSHistoryItem).voiceName && (
                                        <p className="text-[10px] text-indigo-400 mt-0.5">دەنگ: {(item as TTSHistoryItem).voiceName}</p>
                                    )}
                                </div>
                                <div className="col-span-2">
                                    <span className="text-xs text-slate-500" dir="ltr">{new Date(item.timestamp).toLocaleString()}</span>
                                </div>
                                <div className="col-span-2 flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                    {item.type === 'TTS' && (
                                        <button onClick={() => playAudio((item as TTSHistoryItem).audioBuffer, item.id)} className={`p-2 rounded-lg text-xs transition-all ${playingId === item.id ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-emerald-500 hover:text-white'}`}>
                                            <Play size={14} />
                                        </button>
                                    )}
                                    <button onClick={() => navigator.clipboard.writeText(item.content)} className="p-2 bg-slate-700 text-slate-300 hover:bg-white hover:text-slate-900 rounded-lg transition-colors">
                                        <Copy size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
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

export default HistoryPage;
