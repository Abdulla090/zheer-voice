import { GoogleGenAI, Modality } from "@google/genai";
import { decodeBase64, decodeAudioData, getAudioContext } from "./audioUtils";

export const generateSpeech = async (
  apiKey: string,
  modelId: string,
  text: string,
  voiceName: string,
  toneInstruction: string,
  speedInstruction: string,
  language: 'ku' | 'en' = 'ku'
): Promise<AudioBuffer> => {

  if (!apiKey) {
    throw new Error("API Key is missing. Please add your Gemini API Key in the settings.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  // Construct prompt based on language
  let finalPrompt = "";

  if (language === 'en') {
    finalPrompt = `
      Input Text: "${text}"
      
      System Instructions:
      1. Language: **English**.
      2. Pronunciation: Natural, clear, and native-sounding English.
      3. Strict Output Rules:
         - Do NOT translate the text. Read it exactly as written.
         - Do NOT add introductory or concluding remarks.
      4. Tone/Style: ${toneInstruction}
      5. Speed: Read this text ${speedInstruction}.
      6. Output: Provide ONLY the audio generation.
    `;
  } else {
    // DEFAULT: KURDISH SORANI
    finalPrompt = `
      Input Text: "${text}"
      
      System Instructions:
      1. Language: **Kurdish Sorani** (Central Kurdish, ISO 639-3: ckb).
      2. Pronunciation & Phonology: 
         - You MUST speak with an authentic, native Kurdish Sorani accent.
         - Pay strict attention to these specific Kurdish letters:
           - 'ڕ' (rolled R / Trill): Must be pronounced strongly, distinct from normal 'ر'.
           - 'ڵ' (Velarized L / Dark L): Must be deep and back, distinct from normal 'ل'.
           - 'ێ' (Yê / Ê): A mid-front unrounded vowel (like 'e' in 'café').
           - 'ۆ' (O): A mid-back rounded vowel.
           - 'ژ' (Zh): Voiced postalveolar fricative (like 's' in 'measure').
           - 'ڤ' (V): Voiced labiodental fricative.
           - 'گ' (G): Voiced velar stop (hard G).
         - Ensure the prosody and intonation match native Kurdish speech patterns (not Arabic or Persian).
      3. Strict Output Rules:
         - Do NOT translate the text. Read it exactly as written.
         - Do NOT add introductory or concluding remarks (e.g., "Here is the audio").
      4. Tone/Style: ${toneInstruction}
      5. Speed: Read this text ${speedInstruction}.
      6. Output: Provide ONLY the audio generation.
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [{ parts: [{ text: finalPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No audio data returned from Gemini.");
    }

    const audioContext = getAudioContext();
    const audioBytes = decodeBase64(base64Audio);
    const audioBuffer = await decodeAudioData(audioBytes, audioContext);

    return audioBuffer;

  } catch (error: any) {
    console.error("Gemini TTS Error:", error);
    // Enhance error message for quota issues
    if (error.message?.includes('429') || error.status === 429) {
      throw new Error("Quota exceeded (429). You have reached your API limit for now. Please wait or check your plan.");
    }
    throw error;
  }


};

/**
 * Text improvement service using Gemini (Text Generation)
 */
export const improveText = async (
  apiKey: string,
  modelId: string, // We can use the same model ID, usually Flash is good for text too
  text: string,
  task: 'fix_grammar' | 'translate_to_kurdish' | 'translate_from_kurdish',
  language: 'ku' | 'en' = 'ku'
): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing.");

  const ai = new GoogleGenAI({ apiKey });

  let prompt = "";
  if (task === 'fix_grammar') {
    if (language === 'en') {
      prompt = `
          Act as a professional English editor. 
          Correct the grammar, spelling, and punctuation of the following English text. 
          Ensure natural, native phrasing.
          Input: "${text}"
          Output: Provide ONLY the corrected text, nothing else.
        `;
    } else {
      prompt = `
          Act as a professional Kurdish Sorani editor. 
          Correct the grammar, spelling, and punctuation of the following Kurdish text. 
          Ensure native, natural phrasing.
          Input: "${text}"
          Output: Provide ONLY the corrected text, nothing else.
        `;
    }
  } else if (task === 'translate_to_kurdish') {
    prompt = `
      Act as a professional translator. 
      Translate the following text (which could be English, Arabic, or Persian) into natural, authentic Kurdish Sorani.
      Input: "${text}"
      Output: Provide ONLY the Kurdish Sorani translation, nothing else.
    `;
  } else if (task === 'translate_from_kurdish') {
    prompt = `
      Act as a professional translator. 
      Translate the following Kurdish Sorani text into clear, natural English.
      Input: "${text}"
      Output: Provide ONLY the English translation, nothing else.
    `;
  }

  try {
    // Use gemini-2.5-flash for text tasks (better free tier limits)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
    });

    // Extract text
    const output = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!output) {
      throw new Error("No text returned from Gemini.");
    }
    return output.trim();

  } catch (error: any) {
    console.error("Text Improvement Error:", error);

    // Check for rate limit error
    if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED') || error?.message?.includes('quota')) {
      throw new Error("کۆتایوەی داواکاری! تکایە چەند خولەکێک چاوەڕوان بە و دووبارە هەوڵبدەوە. (Rate limit exceeded)");
    }
    if (error?.message?.includes('503') || error?.message?.includes('overloaded') || error?.message?.includes('UNAVAILABLE')) {
      throw new Error("سێرڤەر پڕە! تکایە دووبارە هەوڵبدەوە. (Server overloaded)");
    }

    throw error;
  }
};

/**
 * Speech to Text (Transcriber) using Gemini Multimodal
 */
export const transcribeAudio = async (
  apiKey: string,
  base64Audio: string, // raw base64 string
  mimeType: string = 'audio/wav',
  targetLanguage: 'ku' | 'en' | 'auto' = 'ku'
): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing.");

  const ai = new GoogleGenAI({ apiKey });

  let prompt = "";
  if (targetLanguage === 'en') {
    prompt = `
        Listen to the attached audio carefully. 
        Transcribe the speech exactly as spoken into **English**.
        If the audio is in another language, translate it to English.
        Output: Provide ONLY the transcription/translation text.
      `;
  } else if (targetLanguage === 'auto') {
    prompt = `
        Listen to the attached audio carefully. 
        Transcribe the speech exactly as spoken in its **Original Language**.
        Do NOT translate.
        Output: Provide ONLY the transcription text.
      `;
  } else {
    // Default: Kurdish
    prompt = `
        Listen to the attached audio carefully. 
        Transcribe the speech exactly as spoken into **Kurdish Sorani**.
        If the audio is in another language, translate it to Kurdish Sorani.
        Output: Provide ONLY the transcription/translation text.
      `;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Audio
              }
            }
          ]
        }
      ]
    });

    const output = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!output) throw new Error("No transcription returned.");
    return output.trim();

  } catch (error: any) {
    console.error("STT Error:", error);
    if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED') || error?.message?.includes('quota')) {
      throw new Error("کۆتایوەی داواکاری! تکایە چەند خولەکێک چاوەڕوان بە. (Rate limit exceeded)");
    }
    if (error?.message?.includes('503') || error?.message?.includes('overloaded') || error?.message?.includes('UNAVAILABLE')) {
      throw new Error("سێرڤەر پڕە! تکایە دووبارە هەوڵبدەوە. (Server overloaded)");
    }
    throw error;
  }
};

/**
 * OCR (Image to Text) using Gemini Vision
 */
export const extractTextFromImage = async (
  apiKey: string,
  base64Image: string,
  mimeType: string = 'image/png',
  fixKurdishLetters: boolean = true
): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing.");

  const ai = new GoogleGenAI({ apiKey });

  // When fixing is OFF, include Kurdish letter guidance in the main prompt for better accuracy
  const prompt = fixKurdishLetters
    ? `
      OCR Task: Extract ALL text from this image completely and accurately.
      
      Rules:
      - Extract EVERY word, letter, and character visible in the image.
      - Do NOT skip or omit any text.
      - Do NOT translate anything.
      - Do NOT add commentary, notes, or explanations.
      - Include ALL text blocks, labels, captions, and readable content.
      - Output ONLY the extracted text, nothing else.
    `
    : `
      OCR Task: Extract ALL text from this image with high accuracy.
      
      Rules:
      - Extract EVERY word, letter, and character visible in the image.
      - Do NOT skip or omit any text.
      - Do NOT translate anything.
      - Do NOT add commentary, notes, or explanations.
      - Include ALL text blocks, labels, captions, and readable content.
      
      For Kurdish Sorani text, use CORRECT letters:
      - Use 'ک' (not Arabic 'ك')
      - Use 'ی' (not Arabic 'ي')
      - Use 'ڕ' for rolled R, 'ڵ' for velarized L
      - Use 'ێ', 'ۆ', 'ژ', 'ڤ', 'گ' correctly
      
      Output ONLY the extracted text, nothing else.
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image
              }
            }
          ]
        }
      ]
    });

    const extractedText = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!extractedText) throw new Error("No text extracted.");

    // If fixing is OFF, return directly (faster)
    if (!fixKurdishLetters) {
      return extractedText.trim();
    }

    // Step 2: Fix Kurdish letters and spelling (only if enabled)
    const fixPrompt = `
      Fix ONLY wrong Kurdish letters and obvious spelling mistakes in this text.
      
      Kurdish letter fixes:
      - Replace Arabic 'ك' → Kurdish 'ک'
      - Replace Arabic 'ي' → Kurdish 'ی'
      - Use 'ڕ' for rolled R, 'ڵ' for velarized L where needed
      - Use 'ێ', 'ۆ', 'ژ', 'ڤ', 'گ' correctly
      
      Rules:
      - Do NOT change English or other languages.
      - Do NOT translate.
      - Do NOT add or remove words.
      - Do NOT add any commentary.
      - If text is already correct, return it exactly as is.
      
      Text: ${extractedText}
      
      Output: Corrected text only.
    `;

    const fixResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: fixPrompt }] }]
    });

    const fixedText = fixResponse.candidates?.[0]?.content?.parts?.[0]?.text;
    return (fixedText || extractedText).trim();

  } catch (error: any) {
    console.error("OCR Error:", error);
    if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED') || error?.message?.includes('quota')) {
      throw new Error("کۆتایوەی داواکاری! تکایە چەند خولەکێک چاوەڕوان بە. (Rate limit exceeded)");
    }
    if (error?.message?.includes('503') || error?.message?.includes('overloaded') || error?.message?.includes('UNAVAILABLE')) {
      throw new Error("سێرڤەر پڕە! تکایە دووبارە هەوڵبدەوە. (Server overloaded)");
    }
    throw error;
  }
};

/**
 * Transcribe video audio with language detection
 * Returns original transcript for translation pipeline
 */
export const transcribeVideoAudio = async (
  apiKey: string,
  base64Audio: string,
  mimeType: string = 'audio/wav'
): Promise<{ text: string; language: string }> => {
  if (!apiKey) throw new Error('API Key is missing.');

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
Listen to the attached audio carefully.

Tasks:
1. Transcribe the speech EXACTLY as spoken in its ORIGINAL language
2. Detect the language of the speech

Output format (JSON):
{
  "text": "exact transcription",
  "language": "language code (en, ar, es, ko, fa, tr, fr, etc.)"
}

Provide ONLY the JSON output, no additional text.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Audio
              }
            }
          ]
        }
      ]
    });

    const output = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!output) throw new Error('No transcription returned.');

    // Parse JSON response
    try {
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          text: result.text || output,
          language: result.language || 'unknown'
        };
      }
    } catch (parseError) {
      // Fallback if JSON parsing fails
      return {
        text: output.trim(),
        language: 'unknown'
      };
    }

    return {
      text: output.trim(),
      language: 'unknown'
    };

  } catch (error: any) {
    console.error('Video transcription error:', error);
    if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('کۆتایوەی داواکاری! تکایە چەند خولەکێک چاوەڕوان بە.');
    }
    throw error;
  }
};