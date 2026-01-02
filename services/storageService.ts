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
}

export const saveToHistory = async (item: AnyHistoryItem) => {
    let storedItem: StoredItem = {
        id: item.id,
        type: item.type,
        content: item.content,
        timestamp: item.timestamp
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
                    audioBuffer: audioBuffer
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
                timestamp: s.timestamp
            } as STTHistoryItem;
        } else {
            return {
                id: s.id,
                type: 'OCR',
                content: s.content,
                timestamp: s.timestamp
            } as OCRHistoryItem;
        }
    }));

    // Filter out failed decodes
    return loadedItems.filter((i): i is AnyHistoryItem => i !== null);
};

export const clearHistory = async () => {
    await set(STORAGE_KEY, []);
}

// Helper to re-use the WAV conversion logic but return Blob

