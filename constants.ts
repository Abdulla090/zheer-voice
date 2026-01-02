import { VoiceConfig, ToneConfig, SpeedConfig, ModelConfig } from './types';

export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: 'gemini-2.5-flash-preview-tts',
    name: 'Gemini 2.5 Flash TTS (Recommended)',
    description: 'Specialized model for low-latency text-to-speech tasks.'
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'General purpose fast model. Good for standard generation.'
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    description: 'High-intelligence model. Best for complex nuance (Experimental for Audio).'
  }
];

export const AVAILABLE_VOICES: VoiceConfig[] = [
  {
    name: 'نازناز (Naznaz)',
    originalName: 'Kore',
    id: 'Kore',
    gender: 'Female',
    description: 'دەنگێکی هاوسەنگ، گەرم و سروشتی. زۆر باشە بۆ خوێندنەوەی گشتی.'
  },
  {
    name: 'ئاشتی (Aştî)',
    originalName: 'Zephyr',
    id: 'Zephyr',
    gender: 'Female',
    description: 'دەنگێکی ڕوون، پیشەیی و میدیایی. گونجاوە بۆ هەواڵ و وانەبێژی.'
  },
  {
    name: 'شێرکۆ (Şêrko)',
    originalName: 'Fenrir',
    id: 'Fenrir',
    gender: 'Male',
    description: 'دەنگێکی قووڵ، پڕ هیبە و سەنگین. گونجاوە بۆ ڕاگەیاندنی فەرمی.'
  },
  {
    name: 'باڵان (Balan)',
    originalName: 'Puck',
    id: 'Puck',
    gender: 'Male',
    description: 'دەنگێکی نەرم، دۆستانە و نزیک. زۆر باشە بۆ چیرۆک و حەکایەت.'
  },
  {
    name: 'زاگۆ (Zagor)',
    originalName: 'Charon',
    id: 'Charon',
    gender: 'Male',
    description: 'دەنگێکی گڕ، پڕ و جدی. گونجاوە بۆ بابەتی مێژوویی و ئەفسانەیی.'
  },
  {
    name: 'نازەنین (Nazanin)',
    originalName: 'Aoede',
    id: 'Aoede',
    gender: 'Female',
    description: 'دەنگێکی زۆر ڕوون و گفتوگۆیی. زیرەک و بەتوانا دەردەکەوێت.'
  },
  {
    name: 'لانە (Lana)',
    originalName: 'Algenib',
    id: 'Algenib',
    gender: 'Female',
    description: 'دەنگێکی گەرم و پڕ متمانە. گونجاوە بۆ پێشکەشکردن و بەڵگەفیلم.'
  },
  {
    name: 'شنیار (Shnyar)',
    originalName: 'Sulafat',
    id: 'Sulafat',
    gender: 'Female',
    description: 'دەنگێکی پیشەیی و کاریگەر. بۆ بابەتی بازرگانی و فێرکاری زۆر گونجاوە.'
  },
  {
    name: 'کاروان (Karwan)',
    originalName: 'Schedar',
    id: 'Schedar',
    gender: 'Male',
    description: 'دەنگێکی سروشتی و هاوڕێیانە. گونجاوە بۆ ڤلۆگ و وانەی نافەرمی.'
  },
  {
    name: 'مەریوان (Mariwan)',
    originalName: 'Autonoe',
    id: 'Autonoe',
    gender: 'Male',
    description: 'دەنگێکی پێگەیشتوو و دان بەخۆداگرتوو. بۆ خوێندنەوەی کتێب و بەڵگەفیلم.'
  }
];

export const AVAILABLE_TONES: ToneConfig[] = [
  {
    name: 'ئاسایی / سروشتی',
    promptModifier: 'Speak naturally, clearly, and conversationally.',
    description: 'شێوازی گفتوگۆی ڕۆژانە.'
  },
  {
    name: 'هۆنراوە / پڕ هەست',
    promptModifier: 'Read this with deep emotion, poetic rhythm, and artistic flair.',
    description: 'خوێندنەوەی پڕ سۆز بۆ شیعر و ئەدەب.'
  },
  {
    name: 'هەواڵ / فەرمی',
    promptModifier: 'Read this in a professional news anchor style. Authoritative, crisp, and neutral.',
    description: 'شێوازی بێژەری هەواڵ، ڕوون و جددی.'
  },
  {
    name: 'دڵخۆش / بەجۆش',
    promptModifier: 'Read this with happiness, high energy, and a smile in the voice.',
    description: 'پڕ لە وزە و ئەرێنی.'
  },
  {
    name: 'چرپە / ئارام',
    promptModifier: 'Read this softly, almost like a whisper, very calm and soothing.',
    description: 'هێواش و وەک دەنگی پێش خەوتن.'
  },
  {
    name: 'چیرۆکبێژ / حەکایەت',
    promptModifier: 'Read this like a traditional storyteller narrator, engaging and dramatic.',
    description: 'شێوازی گێڕانەوەی چیرۆکی منداڵان.'
  },
  {
    name: 'خەمبار / مات',
    promptModifier: 'Read this with a sad, melancholic, and slow tone.',
    description: 'دەربڕینی خەم و پەژارە.'
  }
];

export const AVAILABLE_SPEEDS: SpeedConfig[] = [
  { name: 'خاو (Slow)', value: 'slowly and deliberately' },
  { name: 'مامناوەند (Normal)', value: 'at a normal, natural pace' },
  { name: 'خێرا (Fast)', value: 'quickly and efficiently' },
];

export const SAMPLE_TEXTS = [
  "هەموو مرۆڤەکان بە ئازادی و لە کەرامەت و مافدا بە یەکسانی لەدایک دەبن.",
  "سڵاو، هیوای ڕۆژێکی خۆشت بۆ دەخوازم. چۆن دەتوانم ئەمڕۆ یارمەتیت بدەم؟",
  "کوردستان نیشتمانی جوان و دڵگیرە، شاخەکانی بەرز و ئاوەکەی ڕوونە.",
  "شیعر دەرگایەکە بۆ جیهانی خەیاڵ، وشەکان وەک مۆسیقا سەمای تێدا دەکەن."
];