import { set, get, update } from 'idb-keyval';
import { AnyHistoryItem, TTSHistoryItem, STTHistoryItem, OCRHistoryItem } from '../types';
import { audioBufferToWav } from './audioUtils';

const STORAGE_KEY = 'zheer_saz_universal_history';

// Stored Format (Serializable)
interface StoredItem {
    id: string;
    type: 'TTS' | 'STT' | 'OCR';
    content: string;
    timestamp: Date;
    voiceName?: string;       // TTS only
    audioData?: ArrayBuffer;  // TTS only
    isFavorite?: boolean;     // Star/favorite flag
    tags?: string[];          // User-defined tags
}

export const saveToHistory = async (item: AnyHistoryItem) => {
    let storedItem: StoredItem = {
        id: item.id,
        type: item.type,
        content: item.content,
        timestamp: item.timestamp,
        isFavorite: item.isFavorite || false,
        tags: item.tags || []
    };

    if (item.type === 'TTS') {
        const ttsItem = item as TTSHistoryItem;
        const wavBlob = await audioBufferToWav(ttsItem.audioBuffer);
        storedItem.voiceName = ttsItem.voiceName;
        storedItem.audioData = await wavBlob.arrayBuffer();
    }

    // 2. Add to IDB
    await update(STORAGE_KEY, (val: StoredItem[] | undefined) => {
        const current = val || [];
        // Keep only last 20 items
        return [storedItem, ...current].slice(0, 20);
    });
};

export const loadHistory = async (): Promise<AnyHistoryItem[]> => {
    const stored = await get<StoredItem[]>(STORAGE_KEY);
    if (!stored) return [];

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    const loadedItems: AnyHistoryItem[] = await Promise.all(stored.map(async (s) => {
        if (s.type === 'TTS' && s.audioData) {
            try {
                // Decode audio
                const audioBuffer = await ctx.decodeAudioData(s.audioData.slice(0));
                return {
                    id: s.id,
                    type: 'TTS',
                    content: s.content,
                    timestamp: s.timestamp,
                    voiceName: s.voiceName || 'Unknown',
                    audioBuffer: audioBuffer,
                    isFavorite: s.isFavorite || false,
                    tags: s.tags || []
                } as TTSHistoryItem;
            } catch (e) {
                console.error("Failed to decode audio for history item", s.id);
                return null;
            }
        } else if (s.type === 'STT') {
            return {
                id: s.id,
                type: 'STT',
                content: s.content,
                timestamp: s.timestamp,
                isFavorite: s.isFavorite || false,
                tags: s.tags || []
            } as STTHistoryItem;
        } else {
            return {
                id: s.id,
                type: 'OCR',
                content: s.content,
                timestamp: s.timestamp,
                isFavorite: s.isFavorite || false,
                tags: s.tags || []
            } as OCRHistoryItem;
        }
    }));

    // Filter out failed decodes
    return loadedItems.filter((i): i is AnyHistoryItem => i !== null);
};

export const clearHistory = async () => {
    await set(STORAGE_KEY, []);
}

// Toggle favorite status
export const toggleFavorite = async (id: string) => {
    await update(STORAGE_KEY, (val: StoredItem[] | undefined) => {
        if (!val) return val;
        return val.map(item =>
            item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
        );
    });
};

// Add tag to item
export const addTagToItem = async (id: string, tag: string) => {
    await update(STORAGE_KEY, (val: StoredItem[] | undefined) => {
        if (!val) return val;
        return val.map(item => {
            if (item.id === id) {
                const tags = item.tags || [];
                if (!tags.includes(tag)) {
                    return { ...item, tags: [...tags, tag] };
                }
            }
            return item;
        });
    });
};

// Remove tag from item
export const removeTagFromItem = async (id: string, tag: string) => {
    await update(STORAGE_KEY, (val: StoredItem[] | undefined) => {
        if (!val) return val;
        return val.map(item => {
            if (item.id === id) {
                const tags = item.tags || [];
                return { ...item, tags: tags.filter(t => t !== tag) };
            }
            return item;
        });
    });
};

// Delete individual item
export const deleteHistoryItem = async (id: string) => {
    await update(STORAGE_KEY, (val: StoredItem[] | undefined) => {
        if (!val) return val;
        return val.filter(item => item.id !== id);
    });
};
