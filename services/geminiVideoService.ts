import { GoogleGenAI } from '@google/genai';

export async function processYouTubeVideo(
    apiKey: string,
    youtubeUrl: string,
    speed: 'fast' | 'accurate' = 'fast'
) {
    const ai = new GoogleGenAI({ apiKey });

    // Try Gemini 3 Flash first (latest preview), fallback to 2.5 based on speed
    const models = speed === 'fast'
        ? ['gemini-3-flash-preview', 'gemini-2.5-flash']
        : ['gemini-3-flash-preview', 'gemini-2.5-pro'];

    let lastError: any = null;

    for (const model of models) {
        try {
            // For YouTube videos, pass the URL directly in the text prompt
            const response = await ai.models.generateContent({
                model,
                contents: `Please transcribe all the speech in this YouTube video. Only provide the transcription text, nothing else.

YouTube URL: ${youtubeUrl}`
            });

            return response.text;
        } catch (error: any) {
            console.log(`Model ${model} failed, trying next...`, error);
            lastError = error;
            continue;
        }
    }

    throw new Error(lastError?.message || 'All models failed to process video');
}

export async function translateToKurdish(
    apiKey: string,
    text: string,
    speed: 'fast' | 'accurate' = 'fast'
) {
    const ai = new GoogleGenAI({ apiKey });

    const models = speed === 'fast'
        ? ['gemini-3-flash-preview', 'gemini-2.5-flash']
        : ['gemini-3-flash-preview', 'gemini-2.5-pro'];

    let lastError: any = null;

    for (const model of models) {
        try {
            const response = await ai.models.generateContent({
                model,
                contents: `You are a professional translator. Translate the following text to Kurdish Sorani (سۆرانی) ONLY. 

CRITICAL RULES:
- Output ONLY the translation
- Do NOT add any explanations, introductions, or notes
- Do NOT mention "Here is the translation" or similar phrases
- Do NOT translate to Kurmanji (کورمانجی) - ONLY Sorani
- Preserve the original formatting and structure

Text to translate:
${text}`
            });

            return response.text;
        } catch (error: any) {
            console.log(`Model ${model} failed, trying next...`, error);
            lastError = error;
            continue;
        }
    }

    throw new Error(lastError?.message || 'All models failed to translate');
}

// Chat with video content (using transcript as context)
export async function chatWithVideoContext(
    apiKey: string,
    transcript: string,
    question: string,
    speed: 'fast' | 'accurate' = 'fast'
) {
    const ai = new GoogleGenAI({ apiKey });

    const models = speed === 'fast'
        ? ['gemini-3-flash-preview', 'gemini-2.5-flash']
        : ['gemini-3-flash-preview', 'gemini-2.5-pro'];

    let lastError: any = null;

    for (const model of models) {
        try {
            const response = await ai.models.generateContent({
                model,
                contents: `You are a helpful AI assistant. Answer the user's question based ONLY on the provided Video Transcript.
        
Video Transcript:
${transcript.substring(0, 100000)}

User Question: ${question}

Instructions:
1. Answer in Kurdish Sorani (سۆرانی).
2. If the answer is found in the transcript, provide it clearly.
3. If the answer is NOT found in the transcript, strictly reply with exactly: "[SEARCH_NEEDED]"
4. Do not make up information not present in the transcript.
`
            });

            return response.text;
        } catch (error: any) {
            console.log(`Model ${model} failed, trying next...`, error);
            lastError = error;
            continue;
        }
    }

    throw new Error(lastError?.message || 'Failed to answer question');
}

// Chat with Web Search (Grounding)
export async function chatWithWebGrounding(
    apiKey: string,
    question: string
) {
    const ai = new GoogleGenAI({ apiKey });

    // Use models that support tools/grounding reliably
    const models = ['gemini-1.5-pro', 'gemini-2.0-flash-exp'];

    let lastError: any = null;

    for (const model of models) {
        try {
            const response = await ai.models.generateContent({
                model,
                config: {
                    tools: [{ googleSearch: {} }] // Enable Google Search
                },
                contents: `Answer the following question in Kurdish Sorani (سۆرانی) using Google Search.
        
Question: ${question}`
            });

            return response.text;
        } catch (error: any) {
            console.log(`Model ${model} failed, trying next...`, error);
            lastError = error;
            continue;
        }
    }

    throw new Error(lastError?.message || 'Failed to perform web search');
}
