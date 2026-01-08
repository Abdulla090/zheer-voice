
import React, { useEffect, useState } from 'react';
import { loadHistory, clearHistory, toggleFavorite, addTagToItem, removeTagFromItem, deleteHistoryItem } from '../../services/storageService';
import { AnyHistoryItem, TTSHistoryItem } from '../../types';
import { Play, Trash2, Filter, FileText, Mic, Image as ImageIcon, Copy, Clock, X, Volume2, Square, Eye, Star, Tag, Search, Plus } from 'lucide-react';
import { getAudioContext } from '../../services/audioUtils';
import { useToast } from '../components/Toast/ToastProvider';

const PREDEFINED_TAGS = ['عەملی', 'خوێندنگە', 'فرێزە', 'گرنگ', 'تێبینی'];

const HistoryPage: React.FC = () => {
    const [history, setHistory] = useState<AnyHistoryItem[]>([]);
    const [filter, setFilter] = useState<'ALL' | 'TTS' | 'STT' | 'OCR'>('ALL');
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<AnyHistoryItem | null>(null);
    const [sourceNode, setSourceNode] = useState<AudioBufferSourceNode | null>(null);

    // Premium features state
    const [searchQuery, setSearchQuery] = useState('');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
    const [showTagModal, setShowTagModal] = useState(false);
    const [tagModalItemId, setTagModalItemId] = useState<string | null>(null);
    const [customTagInput, setCustomTagInput] = useState('');

    const { showToast } = useToast();

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
            showToast("مێژوو سڕایەوە", 'success');
        }
    };

    const handleDeleteItem = async (id: string) => {
        await deleteHistoryItem(id);
        await loadData();
        showToast("بڕگەکە سڕایەوە", 'success');
    };

    const handleToggleFavorite = async (id: string) => {
        await toggleFavorite(id);
        await loadData();
    };

    const handleAddTag = async (id: string, tag: string) => {
        await addTagToItem(id, tag);
        await loadData();
        showToast(`تاگی "${tag}" زیادکرا`, 'success');
    };

    const handleRemoveTag = async (id: string, tag: string) => {
        await removeTagFromItem(id, tag);
        await loadData();
    };

    const openTagModal = (itemId: string) => {
        setTagModalItemId(itemId);
        setShowTagModal(true);
    };

    const addCustomTag = () => {
        if (customTagInput.trim() && tagModalItemId) {
            handleAddTag(tagModalItemId, customTagInput.trim());
            setCustomTagInput('');
        }
    };

    const playAudio = (buffer: AudioBuffer, id: string) => {
        if (sourceNode) {
            try { sourceNode.stop(); } catch (e) { }
        }

        const ctx = getAudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => {
            setPlayingId(null);
            setSourceNode(null);
        };
        source.start();
        setPlayingId(id);
        setSourceNode(source);
    };

    const stopAudio = () => {
        if (sourceNode) {
            try { sourceNode.stop(); } catch (e) { }
            setPlayingId(null);
            setSourceNode(null);
        }
    };

    // Advanced filtering logic
    let filteredHistory = history.filter(item => filter === 'ALL' || item.type === filter);

    // Search filter
    if (searchQuery) {
        filteredHistory = filteredHistory.filter(item =>
            item.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    // Favorites filter
    if (showFavoritesOnly) {
        filteredHistory = filteredHistory.filter(item => item.isFavorite);
    }

    // Tag filter
    if (selectedTagFilter) {
        filteredHistory = filteredHistory.filter(item =>
            item.tags?.includes(selectedTagFilter)
        );
    }

    // Get all unique tags from history
    const allTags = Array.from(new Set(history.flatMap(item => item.tags || [])));

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

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'TTS': return 'دەنگی دروستکراو';
            case 'STT': return 'دەنگی وەرگێڕدراو';
            case 'OCR': return 'دەقی سکێنکراو';
            default: return type;
        }
    };

    // Tag Modal Component
    const TagModal = () => {
        if (!showTagModal || !tagModalItemId) return null;
        const item = history.find(i => i.id === tagModalItemId);
        if (!item) return null;

        return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowTagModal(false)}>
                <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Tag size={18} className="text-amber-400" />
                            <h3 className="font-bold text-white">بەڕێوەبردنی تاگەکان</h3>
                        </div>
                        <button onClick={() => setShowTagModal(false)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-5 space-y-4">
                        {/* Current Tags */}
                        {item.tags && item.tags.length > 0 && (
                            <div>
                                <p className="text-xs text-slate-400 mb-2">تاگە هەنووکەییەکان</p>
                                <div className="flex flex-wrap gap-2">
                                    {item.tags.map(tag => (
                                        <div key={tag} className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/30 rounded-lg px-2 py-1">
                                            <span className="text-xs text-amber-300 font-kurdish">{tag}</span>
                                            <button onClick={() => handleRemoveTag(item.id, tag)} className="text-amber-400 hover:text-red-400">
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Predefined Tags */}
                        <div>
                            <p className="text-xs text-slate-400 mb-2">تاگەکانی پێشوەخت دیاریکراو</p>
                            <div className="flex flex-wrap gap-2">
                                {PREDEFINED_TAGS.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => handleAddTag(item.id, tag)}
                                        disabled={item.tags?.includes(tag)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-kurdish transition-all ${item.tags?.includes(tag)
                                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                                : 'bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-white/5 hover:border-amber-500/30'
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Tag Input */}
                        <div>
                            <p className="text-xs text-slate-400 mb-2">تاگی تایبەت زیادبکە</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={customTagInput}
                                    onChange={(e) => setCustomTagInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
                                    placeholder="ناوی تاگ بنووسە..."
                                    className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 font-kurdish"
                                />
                                <button
                                    onClick={addCustomTag}
                                    disabled={!customTagInput.trim()}
                                    className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-amber-400 rounded-lg transition-colors"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Detail Modal Component
    const DetailModal = () => {
        if (!selectedItem) return null;

        return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
                <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                    {/* Modal Header */}
                    <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getBgColor(selectedItem.type)}`}>
                                {getIcon(selectedItem.type)}
                            </div>
                            <div>
                                <h2 className="font-bold text-white">{getTypeLabel(selectedItem.type)}</h2>
                                <p className="text-xs text-slate-500" dir="ltr">{new Date(selectedItem.timestamp).toLocaleString()}</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedItem(null)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Tags Display */}
                    {selectedItem.tags && selectedItem.tags.length > 0 && (
                        <div className="px-5 py-3 border-b border-white/5 flex flex-wrap gap-2">
                            {selectedItem.tags.map(tag => (
                                <span key={tag} className="px-2 py-1 bg-amber-500/20 border border-amber-500/30 rounded-lg text-xs text-amber-300 font-kurdish">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Modal Content */}
                    <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                        <p className="text-slate-200 font-kurdish whitespace-pre-wrap leading-relaxed text-base">
                            {selectedItem.content}
                        </p>
                    </div>

                    {/* Modal Footer Actions */}
                    <div className="px-5 py-4 border-t border-white/10 flex items-center gap-3 shrink-0 flex-wrap">
                        {selectedItem.type === 'TTS' && (
                            <>
                                {playingId === selectedItem.id ? (
                                    <button onClick={stopAudio} className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg transition-colors font-bold text-sm">
                                        <Square size={16} /> وەستان
                                    </button>
                                ) : (
                                    <button onClick={() => playAudio((selectedItem as TTSHistoryItem).audioBuffer, selectedItem.id)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition-colors font-bold text-sm">
                                        <Volume2 size={16} /> گوێبیستن
                                    </button>
                                )}
                            </>
                        )}
                        <button onClick={() => navigator.clipboard.writeText(selectedItem.content)} className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white hover:bg-slate-600 rounded-lg transition-colors font-bold text-sm">
                            <Copy size={16} /> کۆپی کردن
                        </button>
                        <button onClick={() => openTagModal(selectedItem.id)} className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg transition-colors font-bold text-sm">
                            <Tag size={16} /> تاگەکان
                        </button>
                        <span className="text-xs text-slate-500 mr-auto">
                            {selectedItem.content.length} پیت
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    // Mobile View
    const MobileView = () => (
        <div className="lg:hidden flex flex-col gap-4 py-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <Clock size={20} className="text-slate-400" />
                    مێژوو
                </h1>
                <button onClick={handleClear} className="p-2 bg-rose-500/10 text-rose-400 rounded-lg"><Trash2 size={16} /></button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="گەڕان لە مێژوودا..."
                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg pr-10 pl-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-soran-500/50 font-kurdish"
                />
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1 ${showFavoritesOnly ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400'}`}>
                    <Star size={12} fill={showFavoritesOnly ? 'currentColor' : 'none'} /> دڵخوازەکان
                </button>
                {(['ALL', 'TTS', 'STT', 'OCR'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${filter === f ? 'bg-soran-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {f === 'ALL' ? 'هەمووی' : f}
                    </button>
                ))}
            </div>

            {/* Tags Filter */}
            {allTags.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    <button onClick={() => setSelectedTagFilter(null)} className={`px-3 py-1.5 rounded-lg text-xs font-kurdish whitespace-nowrap ${!selectedTagFilter ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800/50 text-slate-400'}`}>
                        هەموو تاگەکان
                    </button>
                    {allTags.map(tag => (
                        <button key={tag} onClick={() => setSelectedTagFilter(tag === selectedTagFilter ? null : tag)} className={`px-3 py-1.5 rounded-lg text-xs font-kurdish whitespace-nowrap ${selectedTagFilter === tag ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800/50 text-slate-400'}`}>
                            {tag}
                        </button>
                    ))}
                </div>
            )}

            <div className="space-y-2">
                {filteredHistory.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">هیچ داتایەک نەدۆزرایەوە</p>
                ) : (
                    filteredHistory.map(item => (
                        <div key={item.id} onClick={() => setSelectedItem(item)} className={`p-3 rounded-xl border cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all ${getBgColor(item.type)}`}>
                            <div className="flex items-center gap-2 mb-2">
                                {getIcon(item.type)}
                                <span className="text-[10px] text-slate-500 uppercase">{item.type}</span>
                                <span className="text-[10px] text-slate-600 mr-auto" dir="ltr">{new Date(item.timestamp).toLocaleDateString()}</span>
                                <button onClick={(e) => { e.stopPropagation(); handleToggleFavorite(item.id); }} className="p-1">
                                    <Star size={14} className={item.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-500'} />
                                </button>
                                <Eye size={14} className="text-slate-500" />
                            </div>
                            <p className="text-sm text-slate-200 line-clamp-2 font-kurdish">{item.content}</p>
                            {item.tags && item.tags.length > 0 && (
                                <div className="flex gap-1 mt-2 flex-wrap">
                                    {item.tags.map(tag => (
                                        <span key={tag} className="px-1.5 py-0.5 bg-amber-500/20 rounded text-[10px] text-amber-400 font-kurdish">{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    // Desktop View
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
                        <p className="text-[10px] text-slate-500">History • {filteredHistory.length} تۆمار</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="گەڕان..."
                            className="bg-slate-900/50 border border-white/5 rounded-lg pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-soran-500/50 font-kurdish w-48"
                        />
                    </div>

                    {/* Favorites Toggle */}
                    <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${showFavoritesOnly ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-900/50 text-slate-400 hover:text-white'}`}>
                        <Star size={14} fill={showFavoritesOnly ? 'currentColor' : 'none'} /> دڵخوازەکان
                    </button>

                    {/* Type Filters */}
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

            {/* Tags Filter Row */}
            {allTags.length > 0 && (
                <div className="shrink-0 bg-slate-800/20 border border-white/5 rounded-xl px-5 py-3">
                    <div className="flex items-center gap-2 overflow-x-auto">
                        <Tag size={14} className="text-amber-400 shrink-0" />
                        <button onClick={() => setSelectedTagFilter(null)} className={`px-3 py-1.5 rounded-lg text-xs font-kurdish whitespace-nowrap transition-all ${!selectedTagFilter ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'}`}>
                            هەموو تاگەکان
                        </button>
                        {allTags.map(tag => (
                            <button key={tag} onClick={() => setSelectedTagFilter(tag === selectedTagFilter ? null : tag)} className={`px-3 py-1.5 rounded-lg text-xs font-kurdish whitespace-nowrap transition-all ${selectedTagFilter === tag ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'}`}>
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Main List Area */}
            <div className="flex-1 bg-slate-800/20 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-xs text-slate-500 uppercase tracking-wide shrink-0">
                    <div className="col-span-1">جۆر</div>
                    <div className="col-span-6">ناوەڕۆک</div>
                    <div className="col-span-2">کات</div>
                    <div className="col-span-3 text-left">کردار</div>
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
                            <div key={item.id} onClick={() => setSelectedItem(item)} className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-white/5 hover:bg-white/[0.04] transition-colors items-center group cursor-pointer">
                                <div className="col-span-1">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getBgColor(item.type)}`}>
                                        {getIcon(item.type)}
                                    </div>
                                </div>
                                <div className="col-span-6">
                                    <p className="text-sm text-slate-200 font-kurdish line-clamp-1 group-hover:text-white transition-colors">{item.content}</p>
                                    {item.tags && item.tags.length > 0 && (
                                        <div className="flex gap-1 mt-1 flex-wrap">
                                            {item.tags.map(tag => (
                                                <span key={tag} className="px-1.5 py-0.5 bg-amber-500/20 rounded text-[10px] text-amber-400 font-kurdish">{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="col-span-2">
                                    <span className="text-xs text-slate-500" dir="ltr">{new Date(item.timestamp).toLocaleString()}</span>
                                </div>
                                <div className="col-span-3 flex gap-2 justify-end" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => handleToggleFavorite(item.id)} className={`p-2 rounded-lg transition-all ${item.isFavorite ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700/50 text-slate-400 hover:bg-amber-500/20 hover:text-amber-400 opacity-0 group-hover:opacity-100'}`}>
                                        <Star size={14} fill={item.isFavorite ? 'currentColor' : 'none'} />
                                    </button>
                                    <button onClick={() => openTagModal(item.id)} className="p-2 bg-slate-700/50 text-slate-400 hover:bg-amber-500/20 hover:text-amber-400 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                        <Tag size={14} />
                                    </button>
                                    {item.type === 'TTS' && (
                                        <button onClick={() => playAudio((item as TTSHistoryItem).audioBuffer, item.id)} className={`p-2 rounded-lg text-xs transition-all ${playingId === item.id ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-emerald-500 hover:text-white opacity-0 group-hover:opacity-100'}`}>
                                            <Play size={14} />
                                        </button>
                                    )}
                                    <button onClick={() => setSelectedItem(item)} className="p-2 bg-slate-700/50 text-slate-400 hover:bg-soran-500 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                        <Eye size={14} />
                                    </button>
                                    <button onClick={() => handleDeleteItem(item.id)} className="p-2 bg-slate-700/50 text-slate-400 hover:bg-rose-500 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                        <Trash2 size={14} />
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
            <DetailModal />
            <TagModal />
        </>
    );
};

export default HistoryPage;
