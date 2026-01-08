import { GoogleGenAI } from '@google/genai';

// Helper to extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// Invidious instances with working APIs (free, no CORS issues)
const INVIDIOUS_INSTANCES = [
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://invidious.privacyredirect.com',
    'https://invidious.protokolla.fi',
    'https://iv.datura.network',
    'https://invidious.lunar.icu',
];

// Fetch transcript from Invidious API
async function fetchTranscriptFromInvidious(videoId: string): Promise<string> {
    for (const instance of INVIDIOUS_INSTANCES) {
        try {
            // First get video captions info
            const captionsUrl = `${instance}/api/v1/captions/${videoId}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(captionsUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) continue;

            const data = await response.json();

            if (data.captions && data.captions.length > 0) {
                // Find English or auto-generated captions
                const englishCaption = data.captions.find((c: any) =>
                    c.language_code === 'en' || c.language_code?.startsWith('en')
                );
                const autoCaption = data.captions.find((c: any) =>
                    c.label?.toLowerCase().includes('auto')
                );
                const caption = englishCaption || autoCaption || data.captions[0];

                // Fetch the actual caption content
                const captionUrl = `${instance}${caption.url}`;
                const captionResponse = await fetch(captionUrl, {
                    signal: AbortSignal.timeout(8000)
                });

                if (captionResponse.ok) {
                    const captionText = await captionResponse.text();

                    // Parse VTT or SRT format
                    const lines = captionText.split('\n');
                    const textLines: string[] = [];

                    for (const line of lines) {
                        // Skip timestamps, WEBVTT header, and empty lines
                        if (
                            line.trim() === '' ||
                            line.includes('-->') ||
                            line.startsWith('WEBVTT') ||
                            line.startsWith('Kind:') ||
                            line.startsWith('Language:') ||
                            /^\d+$/.test(line.trim()) ||
                            /^\d{2}:\d{2}/.test(line.trim())
                        ) {
                            continue;
                        }

                        // Clean up the text
                        const cleanLine = line
                            .replace(/<[^>]*>/g, '') // Remove HTML tags
                            .replace(/&amp;/g, '&')
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>')
                            .replace(/&quot;/g, '"')
                            .replace(/&#39;/g, "'")
                            .trim();

                        if (cleanLine) {
                            textLines.push(cleanLine);
                        }
                    }

                    if (textLines.length > 0) {
                        return textLines.join(' ').replace(/\s+/g, ' ').trim();
                    }
                }
            }
        } catch (error) {
            console.log(`Invidious instance ${instance} failed, trying next...`);
            continue;
        }
    }

    throw new Error('TRANSCRIPT_NOT_AVAILABLE');
}

// 1. Process YouTube Video - Get REAL transcript
export async function processYouTubeVideo(
    apiKey: string,
    youtubeUrl: string,
    speed: 'fast' | 'accurate' = 'fast'
): Promise<string> {
    const videoId = extractVideoId(youtubeUrl);

    if (!videoId) {
        throw new Error('لینکی یوتیوب دروست نییە. تکایە لینکێکی دروست بنووسە.');
    }

    try {
        // Get real transcript from Invidious
        const transcript = await fetchTranscriptFromInvidious(videoId);

        // For 'accurate' mode, clean up with AI
        if (speed === 'accurate' && apiKey && transcript) {
            const ai = new GoogleGenAI({ apiKey });
            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `Clean up this transcript. Add punctuation and paragraphs. Keep ALL content. Output ONLY cleaned text:

${transcript.substring(0, 30000)}`
                });
                return response.text || transcript;
            } catch {
                return transcript;
            }
        }

        return transcript;

    } catch (error: any) {
        if (error.message === 'TRANSCRIPT_NOT_AVAILABLE') {
            throw new Error('ئەم ڤیدیۆیە ژێرنووسی (CC) نییە. تکایە ڤیدیۆیەکی تر هەڵبژێرە کە ژێرنووسی هەبێت.');
        }
        throw new Error('هەڵەیەک ڕوویدا: ' + (error.message || 'نەزانراو'));
    }
}

// 2. Translate Text to Kurdish
export async function translateToKurdish(
    apiKey: string,
    text: string,
    speed: 'fast' | 'accurate' = 'fast'
): Promise<string> {
    const ai = new GoogleGenAI({ apiKey });
    const model = speed === 'fast' ? 'gemini-2.5-flash' : 'gemini-2.5-pro';

    try {
        const response = await ai.models.generateContent({
            model,
            contents: `You are a professional translator. Translate this text to Kurdish Sorani (سۆرانی) ONLY.

RULES:
- Output ONLY the translation
- Keep the same formatting
- Do NOT add any notes

Text:
${text}`
        });
        return response.text || '';
    } catch {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Translate to Kurdish Sorani. Output only translation:

${text}`
            });
            return response.text || '';
        } catch {
            throw new Error('وەرگێڕان سەرکەوتوو نەبوو.');
        }
    }
}

// 3. Chat with Video Context
export async function chatWithVideoContext(
    apiKey: string,
    transcript: string,
    question: string,
    speed: 'fast' | 'accurate' = 'fast'
): Promise<string> {
    const ai = new GoogleGenAI({ apiKey });
    const model = speed === 'fast' ? 'gemini-2.5-flash' : 'gemini-2.5-pro';

    try {
        const response = await ai.models.generateContent({
            model,
            contents: `Answer based ONLY on this transcript. Reply in Kurdish Sorani.
If NOT in transcript, reply: "[SEARCH_NEEDED]"

Transcript: ${transcript.substring(0, 50000)}

Question: ${question}`
        });
        return response.text || '';
    } catch {
        throw new Error('هەڵەیەک ڕوویدا');
    }
}

// 4. Web Search
export async function chatWithWebGrounding(
    apiKey: string,
    question: string
): Promise<string> {
    const ai = new GoogleGenAI({ apiKey });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            config: {
                tools: [{ googleSearch: {} }]
            },
            contents: `Answer in Kurdish Sorani using Google Search:

${question}`
        });
        return response.text || '';
    } catch {
        throw new Error('گەڕان سەرکەوتوو نەبوو');
    }
}
