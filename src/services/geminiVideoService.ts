import { GoogleGenerativeAI } from '@google/generative-ai';

export async function processYouTubeVideo(apiKey: string, youtubeUrl: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    // Get transcription from video
    const result = await model.generateContent([
        {
            fileData: {
                mimeType: 'video/*',
                fileUri: youtubeUrl
            }
        },
        'Please transcribe all the speech in this video. Only provide the transcription text, nothing else.'
    ]);

    const transcription = result.response.text();
    return transcription;
}

export async function translateToKurdish(apiKey: string, text: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent(
        `Translate the following text to Kurdish (Sorani dialect):\n\n${text}`
    );

    return result.response.text();
}
