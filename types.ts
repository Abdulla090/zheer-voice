export interface VoiceConfig {
  name: string;      // Kurdish Display Name
  originalName: string; // Original English Name for reference if needed
  id: string;        // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr', 'Aoede', 'Algenib', 'Sulafat', 'Schedar', 'Autonoe'
  gender: 'Male' | 'Female';
  description: string; // Kurdish description
}

export interface ToneConfig {
  name: string;
  promptModifier: string;
  description: string;
}

export interface SpeedConfig {
  name: string;
  value: string; // Description for the prompt (e.g., "slowly", "quickly")
}

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
}

export type HistoryItemType = 'TTS' | 'STT' | 'OCR';

export interface BaseHistoryItem {
  id: string;
  type: HistoryItemType;
  timestamp: Date;
  content: string; // The main text content (OCR text, Transcription, or Input Text for TTS)
  isFavorite?: boolean; // Star/favorite flag
  tags?: string[]; // User-defined tags for organization
}

export interface TTSHistoryItem extends BaseHistoryItem {
  type: 'TTS';
  audioBuffer: AudioBuffer;
  voiceName: string;
}

export interface STTHistoryItem extends BaseHistoryItem {
  type: 'STT';
  audioUrl?: string; // Optional: URL to the recorded audio blob (blob urls are ephemeral, so maybe we don't store audio for STT long term? Or store as ArrayBuffer like TTS)
  // For simplicity, let's just store the text for STT/OCR for now to avoid huge storage usage.
}

export interface OCRHistoryItem extends BaseHistoryItem {
  type: 'OCR';
  imageUrl?: string; // Base64 or Blob URL? Base64 is heavy. Let's just store text for now.
}

export type AnyHistoryItem = TTSHistoryItem | STTHistoryItem | OCRHistoryItem;

// Legacy support alias
export type GeneratedAudio = TTSHistoryItem;

export enum TTSStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  PLAYING = 'PLAYING',
  ERROR = 'ERROR',
}

// Video Translation Types
export interface VideoMetadata {
  filename: string;
  duration: number;
  size: number;
  format: string;
  uploadedAt: number;
}

export interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  originalText: string;
  translatedText: string;
  language: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface VideoContext {
  metadata: VideoMetadata;
  originalTranscript: string;
  kurdishTranslation: string;
  language: string;
  segments?: TranscriptSegment[];
  summary?: string;
  topics?: string[];
}

export type ProcessingStage =
  | 'idle'
  | 'uploading'
  | 'extracting'
  | 'transcribing'
  | 'translating'
  | 'generating'
  | 'complete'
  | 'error';