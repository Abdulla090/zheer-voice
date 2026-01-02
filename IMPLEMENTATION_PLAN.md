# Zheer Saz Voice - Upgrade Implementation Plan

This document outlines the step-by-step plan to upgrade the Zheer Saz Voice application with rich features and improved intelligence.

## Phase 1: Real-Time Audio Visualization & Player Control (COMPLETED)
- [x] **Real-Time FFT Visualizer**: Upgrade `Waveform.tsx` to use `AnalyserNode` from Web Audio API. It should react to actual audio frequencies using bars or a dynamic wave.
- [x] **Audio Player Controls**: Add seeking (scrubbing bar), volume control, and playback speed selector (0.5x, 1x, 1.5x, 2x) to the player card in `App.tsx`.

## Phase 2: Core Intelligence (Smart Input) (COMPLETED)
- [x] **Smart Text Pre-processor**: Create a utility to convert English numerals (0-9) to Kurdish text (سفر، یەک، دوو...) automatically before generation to ensure correct pronunciation.
- [x] **Text Normalization**: Clean up common punctuation issues that might confuse the TTS.

## Phase 3: Persistence & History Management (COMPLETED)
- [x] **IndexedDB Integration**: Use a lightweight wrapper (like `idb-keyval`) to store the actual audio blobs of history items, so they persist even after page refresh.
- [x] **Expanded History UI**: Increase history limit and allow deleting individual items.

## Phase 4: Premium UI Polish (COMPLETED)
- [x] **Glassmorphism 2.0**: Add animated background blobs (using CSS keyframes) behind the glass cards for a "living" background.
- [x] **Batch Mode**: Toggle switch for processing multiple lines.

## Phase 5: Intelligence Suite (COMPLETED)
- [x] **Smart Translation**: Add a mode to input English/Arabic text -> Auto-translate to Kurdish Sorani -> Speak.
- [x] **AI Grammar Fixer (Magic Wand)**: Add a button to automatically correct spelling and grammar of the Kurdish text before generation.
- [x] **PWA Support**: precise manifest and service worker configuration to make the app installable.

## Phase 6: Platform Migration & Expansion (COMPLETED)
- [x] **Architecture Shift**: Convert from single-page to multi-page platform using `react-router-dom`.
- [x] **Sidebar Navigation**: Create a persistent, premium sidebar for easy navigation between tools.
- [x] **OCR Module (Scanner)**: New page to extract Kurdish text from images using Gemini Vision.
- [x] **STT Module (Transcriber)**: New page to convert Speech-to-Text (Audio files or Mic) using Gemini Multimodal.
- [x] **Grammar Studio**: Dedicated full-screen editor for polishing text.
- [x] **Unified History**: Single history page showing all TTS, STT, and OCR results.
- [x] **Responsive Desktop/Mobile Views**: Completely different UI layouts for Desktop and Mobile.

## Phase 7: Advanced Features & Polish (NEXT)
- [ ] **Download Audio**: Allow users to download generated audio as MP3/WAV files.
- [ ] **Translation Tool**: Dedicated page for bidirectional translation (Any Language <-> Kurdish).
- [ ] **Dark/Light Theme Toggle**: Allow users to switch between dark and light modes.
- [ ] **Settings Page**: Dedicated settings page for API key, default voice, model selection, etc.
- [ ] **Keyboard Shortcuts**: Add keyboard shortcuts for power users (Ctrl+Enter to generate, etc.).
- [ ] **Notification Toast System**: Replace alerts with a proper toast notification system.
- [ ] **Loading Skeletons**: Add skeleton loaders for better perceived performance.
- [ ] **Error Boundary**: Add React error boundaries for graceful error handling.
