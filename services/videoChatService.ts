import { GoogleGenAI } from '@google/genai';
import { VideoMetadata, ChatMessage, VideoContext } from '../types';

/**
 * Build video context for chatbot
 */
export const buildVideoContext = (
    metadata: VideoMetadata,
    originalTranscript: string,
    kurdishTranslation: string,
    language: string
): VideoContext => {
    return {
        metadata,
        originalTranscript,
        kurdishTranslation,
        language
    };
};

/**
 * Chat with video content using Gemini 2.5 Flash
 */
export const chatWithVideo = async (
    apiKey: string,
    videoContext: VideoContext,
    userMessage: string,
    chatHistory: ChatMessage[]
): Promise<string> => {
    if (!apiKey) throw new Error('API Key is missing.');

    const ai = new GoogleGenAI({ apiKey });

    // Build context prompt
    const contextPrompt = `
You are an AI assistant helping users understand video content in Kurdish Sorani.

**Video Information:**
- Filename: ${videoContext.metadata.filename}
- Duration: ${Math.round(videoContext.metadata.duration / 60)} minutes
- Original Language: ${videoContext.language}

**Original Transcript:**
${videoContext.originalTranscript}

**Kurdish Translation:**
${videoContext.kurdishTranslation}

**Instructions:**
- Answer questions about the video content in Kurdish Sorani
- Be helpful, accurate, and conversational
- Reference specific parts of the video when relevant
- If asked in English, you can respond in English, but prefer Kurdish
- Be concise but informative

**Conversation History:**
${chatHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}

**User Question:**
${userMessage}

**Your Response (in Kurdish Sorani):**
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: contextPrompt }] }]
        });

        const output = response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!output) throw new Error('No response from AI');

        return output.trim();
    } catch (error: any) {
        console.error('Video chat error:', error);

        if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
            throw new Error('کۆتایوەی داواکاری! تکایە چەند خولەکێک چاوەڕوان بە.');
        }

        throw new Error('هەڵەیەک ڕوویدا لە وەڵامدانەوە. تکایە دووبارە هەوڵبدەوە.');
    }
};

/**
 * Generate video summary
 */
export const generateVideoSummary = async (
    apiKey: string,
    videoContext: VideoContext
): Promise<string> => {
    if (!apiKey) throw new Error('API Key is missing.');

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
پوختەیەکی کورت و گونجاو بۆ ئەم ڤیدیۆیە دروست بکە بە زمانی کوردی (سۆرانی):

**وەرگێڕانی ڤیدیۆ:**
${videoContext.kurdishTranslation}

**ڕێنماییەکان:**
- پوختەکە دەبێ کورت و ڕوون بێت (2-3 ڕستە)
- باسی خاڵە گرنگەکان بکە
- بە زمانی کوردی سۆرانی بنووسە
- ڕێکوپێک و خوێنەرەوە بێت

**پوختە:**
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }]
        });

        const output = response.candidates?.[0]?.content?.parts?.[0]?.text;
        return output?.trim() || 'پوختە دروستنەکرا';
    } catch (error) {
        console.error('Summary generation error:', error);
        return 'هەڵە لە دروستکردنی پوختە';
    }
};

/**
 * Suggest questions about the video
 */
export const suggestQuestions = (videoContext: VideoContext): string[] => {
    const baseQuestions = [
        'ئەم ڤیدیۆیە باسی چی دەکات؟',
        'پوختەیەکم پێبکە',
        'خاڵە گرنگەکان چین؟',
        'چ فێربووم لەم ڤیدیۆیە؟'
    ];

    // Add contextual questions based on video length
    if (videoContext.metadata.duration > 600) {
        baseQuestions.push('دەتوانی بەشە گرنگەکانم پێبڵێیت؟');
    }

    return baseQuestions;
};

/**
 * Detect key topics from transcript (simple implementation)
 */
export const extractTopics = async (
    apiKey: string,
    transcript: string
): Promise<string[]> => {
    if (!apiKey) return [];

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
Extract 3-5 main topics or keywords from this text. Return ONLY the topics as a comma-separated list in Kurdish Sorani.

Text: ${transcript.substring(0, 1000)}

Topics:
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }]
        });

        const output = response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!output) return [];

        return output.split(',').map(t => t.trim()).filter(t => t.length > 0);
    } catch (error) {
        console.error('Topic extraction error:', error);
        return [];
    }
};
