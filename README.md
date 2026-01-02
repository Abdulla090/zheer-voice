<div align="center">

# 🎙️ Zheer Saz Voice

### ژیر ساز ڤۆیس — AI-Powered Kurdish Language Suite

[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

<br/>

<img src="assets/hero-banner.png" alt="Zheer Saz Voice Banner" width="80%" />

<br/>
<br/>

**A comprehensive AI toolkit designed specifically for the Kurdish Sorani language, featuring text-to-speech, speech recognition, OCR, translation, and grammar correction.**

[✨ Features](#-features) • 
[🚀 Getting Started](#-getting-started) • 
[📖 Documentation](#-documentation) • 
[🤝 Contributing](#-contributing)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔊 Voice Studio (دەنگساز)
Transform Kurdish text into natural, human-like speech with multiple voice options, customizable tones, and adjustable speeds.

- **10+ Natural Voices** — Male & Female options
- **Emotion Presets** — Neutral, Happy, Sad, Excited
- **Speed Control** — From slow to fast playback
- **Batch Processing** — Convert multiple texts at once
- **Real-time Waveform** — Visual audio feedback
- **Download as WAV** — Export for offline use

</td>
<td width="50%">

### 🎤 Transcriber (وەرگێڕی دەنگ)
Convert spoken Kurdish audio into accurate text with word-by-word highlighting during playback.

- **Live Recording** — Record directly from microphone
- **File Upload** — Support for WAV, MP3, and more
- **Word Highlighting** — Follow along as audio plays
- **Subtitle Export** — Download as SRT or VTT
- **Copy & Share** — Easy text extraction

</td>
</tr>
<tr>
<td width="50%">

### 📷 OCR Scanner (سکێنەر)
Extract Kurdish text from images and PDFs with intelligent character recognition.

- **Multi-Image Batch** — Process multiple images at once
- **PDF Support** — Extract text from PDF documents
- **Kurdish Letter Fix** — Correct common OCR mistakes
- **Read Aloud** — Listen to extracted text
- **Copy Results** — Quick clipboard access

</td>
<td width="50%">

### 🌐 Smart Translator (وەرگێڕ)
Translate between Kurdish Sorani and other languages with AI-powered accuracy.

- **Bidirectional** — Kurdish ↔ Other Languages
- **Phrasebook** — Save favorite translations
- **Pronunciation** — Listen to translations
- **Context-Aware** — Understands Kurdish nuances
- **Instant Results** — Fast translation speed

</td>
</tr>
<tr>
<td colspan="2">

### ✨ Grammar Fixer (باشساز)
Correct spelling, grammar, and improve the quality of Kurdish text with one click.

- **Spelling Correction** — Fix typos and mistakes
- **Grammar Enhancement** — Improve sentence structure
- **Style Suggestions** — Make text more natural
- **Side-by-Side View** — Compare original vs fixed

</td>
</tr>
</table>

---

## 🎨 Design Philosophy

Zheer Saz Voice is built with a **modern, sleek dark theme** optimized for Kurdish RTL (right-to-left) text:

- 🌙 **Dark Mode First** — Easy on the eyes
- 📱 **Fully Responsive** — Works on all devices
- ⚡ **Fast & Smooth** — Optimized animations
- 🎯 **RTL Native** — Perfect Kurdish text rendering
- ✨ **Glassmorphism** — Modern visual effects

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Gemini API Key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/zheer-saz-voice.git

# Navigate to project directory
cd zheer-saz-voice

# Install dependencies
npm install

# Start development server
npm run dev
```

### Configuration

1. Visit [Google AI Studio](https://aistudio.google.com/) to get your API key
2. Open the app and click the ⚙️ Settings icon
3. Enter your Gemini API key
4. Start using all features!

---

## 📁 Project Structure

```
zheer-saz-voice/
├── src/
│   ├── pages/           # Main app pages
│   │   ├── HomePage.tsx
│   │   ├── TTSPage.tsx
│   │   ├── STTPage.tsx
│   │   ├── OCRPage.tsx
│   │   ├── TranslatePage.tsx
│   │   └── GrammarPage.tsx
│   ├── components/      # Reusable components
│   └── styles/          # Global styles
├── services/            # API & utility services
│   ├── geminiService.ts # Google Gemini integration
│   ├── audioUtils.ts    # Audio processing
│   ├── storageService.ts# Local storage
│   └── usageService.ts  # Usage tracking
├── constants.ts         # App constants
└── types.ts             # TypeScript definitions
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework |
| **TypeScript** | Type Safety |
| **Vite** | Build Tool |
| **Tailwind CSS** | Styling |
| **Framer Motion** | Animations |
| **Lucide React** | Icons |
| **Google Gemini** | AI Backend |

---

## 📖 Documentation

### API Integration

Zheer Saz Voice uses the **Google Gemini 2.0 Flash** model for all AI operations:

- **TTS**: `gemini-2.5-flash-preview-tts` for natural speech
- **STT**: Audio transcription with Gemini
- **OCR**: Vision model for text extraction
- **Translation**: Text generation with Kurdish context
- **Grammar**: Intelligent text improvement

### Local Storage

The app stores data locally:
- `gemini_api_key` — Your API key (encrypted)
- `zheer_saz_stats` — Usage statistics
- `zheer_history` — Generation history
- `zheer_phrasebook` — Saved translations

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini Team** — For the incredible AI models
- **Kurdish Language Community** — For feedback and support
- **Open Source Contributors** — For the amazing tools

---

<div align="center">

**Made with ❤️ for the Kurdish community**

⭐ Star this repo if you find it useful!

</div>
