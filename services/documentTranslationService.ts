/**
 * Format-Preserving Document Translation Service
 * Supports DOCX, PDF, PPTX with layout preservation
 */

import JSZip from 'jszip';
import { GoogleGenAI } from '@google/genai';

// Language pairs supported
export type SourceLanguage = 'en' | 'ar' | 'tr' | 'fa' | 'auto';
export type TargetLanguage = 'ku';

interface TranslationProgress {
    stage: 'extracting' | 'translating' | 'rebuilding';
    current: number;
    total: number;
    message: string;
}

type ProgressCallback = (progress: TranslationProgress) => void;

/**
 * Batch translate multiple text segments efficiently to save tokens
 * Groups texts into batches to reduce API calls
 */
const batchTranslateTexts = async (
    apiKey: string,
    texts: string[],
    sourceLang: SourceLanguage,
    targetLang: TargetLanguage,
    onProgress?: ProgressCallback
): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey });

    // Filter out empty/whitespace-only texts
    const validTexts = texts.filter(t => t.trim().length > 0);
    if (validTexts.length === 0) return texts;

    // Create a mapping to track original positions
    const textMap = new Map<number, string>();
    const validIndices: number[] = [];
    texts.forEach((t, i) => {
        if (t.trim().length > 0) {
            validIndices.push(i);
        }
    });

    // Batch texts together (max 20 texts or 4000 chars per batch to save tokens)
    const batches: { texts: string[]; indices: number[] }[] = [];
    let currentBatch: string[] = [];
    let currentIndices: number[] = [];
    let currentLength = 0;

    validTexts.forEach((text, i) => {
        if (currentLength + text.length > 4000 || currentBatch.length >= 20) {
            if (currentBatch.length > 0) {
                batches.push({ texts: [...currentBatch], indices: [...currentIndices] });
            }
            currentBatch = [text];
            currentIndices = [validIndices[i]];
            currentLength = text.length;
        } else {
            currentBatch.push(text);
            currentIndices.push(validIndices[i]);
            currentLength += text.length;
        }
    });

    if (currentBatch.length > 0) {
        batches.push({ texts: currentBatch, indices: currentIndices });
    }

    const result = [...texts]; // Copy original array

    // Process batches
    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
        const batch = batches[batchIdx];

        if (onProgress) {
            onProgress({
                stage: 'translating',
                current: batchIdx + 1,
                total: batches.length,
                message: `وەرگێڕانی بەش ${batchIdx + 1} لە ${batches.length}...`
            });
        }

        // Create numbered list for batch translation
        const numberedText = batch.texts.map((t, i) => `[${i + 1}] ${t}`).join('\n');

        const langNames: Record<SourceLanguage, string> = {
            'en': 'English',
            'ar': 'Arabic',
            'tr': 'Turkish',
            'fa': 'Persian/Farsi',
            'auto': 'the source language'
        };

        const prompt = `You are an expert Kurdish Sorani translator. Translate the following numbered texts from ${langNames[sourceLang]} to Kurdish Sorani.

RULES:
1. Keep numbering format [1], [2], etc. at the start of each translation
2. Output the EXACT same number of items
3. Do NOT add any explanations or notes

HANDLING ENGLISH TERMS:
- Technical terms like "PV", "DC", "AC", "Monocrystalline", "Polycrystalline", "Inverter", etc. should be kept in English
- Write English terms EXACTLY as they appear (do not add any special characters around them)
- In Kurdish RTL text, English terms will naturally appear - just write them normally
- Example: "Solar PV panels" → "پانێلەکانی PV ی خۆر" (PV stays as PV in English)
- Example: "DC to AC inverter" → "ئینڤێرتەری DC بۆ AC" (DC and AC stay in English)

${numberedText}

Translations:`;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ parts: [{ text: prompt }] }],
            });

            const output = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

            // Parse numbered output
            const lines = output.split('\n').filter(l => l.trim());
            const translations: string[] = [];

            for (const line of lines) {
                const match = line.match(/^\[(\d+)\]\s*(.*)$/);
                if (match) {
                    const idx = parseInt(match[1]) - 1;
                    if (idx >= 0 && idx < batch.texts.length) {
                        translations[idx] = match[2].trim();
                    }
                }
            }

            // Fill in results - no BIDI markers for document formats (DOCX/PPTX handle RTL via XML)
            batch.indices.forEach((originalIdx, batchPosition) => {
                if (translations[batchPosition]) {
                    result[originalIdx] = translations[batchPosition];
                }
            });

        } catch (error: any) {
            console.error('Batch translation error:', error);
            // Keep original text on error
        }

        // Small delay between batches to avoid rate limiting
        if (batchIdx < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    return result;
};

/**
 * Translate a DOCX file while preserving formatting
 */
export const translateDocx = async (
    file: File,
    apiKey: string,
    sourceLang: SourceLanguage,
    targetLang: TargetLanguage,
    onProgress?: ProgressCallback
): Promise<Blob> => {
    if (onProgress) {
        onProgress({ stage: 'extracting', current: 0, total: 100, message: 'خوێندنەوەی فایلی Word...' });
    }

    // Read DOCX as ZIP
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Get the main document content
    const documentXml = await zip.file('word/document.xml')?.async('string');
    if (!documentXml) {
        throw new Error('فایلی DOCX هەڵەیە یان خراپە');
    }

    if (onProgress) {
        onProgress({ stage: 'extracting', current: 30, total: 100, message: 'دەرهێنانی دەق...' });
    }

    // Extract text from XML - find all <w:t> elements
    const textRegex = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g;
    const texts: string[] = [];
    const matches: { full: string; text: string; index: number }[] = [];

    let match;
    while ((match = textRegex.exec(documentXml)) !== null) {
        matches.push({ full: match[0], text: match[1], index: match.index });
        texts.push(match[1]);
    }

    if (texts.length === 0) {
        throw new Error('هیچ دەقێک نەدۆزرایەوە لە فایلەکە');
    }

    if (onProgress) {
        onProgress({ stage: 'extracting', current: 50, total: 100, message: `${texts.length} بەشی دەق دۆزرایەوە` });
    }

    // Translate texts in batches
    const translatedTexts = await batchTranslateTexts(apiKey, texts, sourceLang, targetLang, onProgress);

    if (onProgress) {
        onProgress({ stage: 'rebuilding', current: 80, total: 100, message: 'دروستکردنەوەی فایل...' });
    }

    // Replace texts in XML - work backwards to preserve indices
    let newDocumentXml = documentXml;

    // First, set document direction to RTL in settings
    // Add bidi to all paragraphs for RTL support
    newDocumentXml = newDocumentXml.replace(/<w:pPr>/g, '<w:pPr><w:bidi/>');

    // If pPr doesn't exist in some paragraphs, we may need to add it
    // This is a simplified approach - replace each <w:p> that doesn't have <w:pPr>
    newDocumentXml = newDocumentXml.replace(/<w:p>(?!<w:pPr>)/g, '<w:p><w:pPr><w:bidi/></w:pPr>');

    // Also add RTL to run properties for proper text direction
    newDocumentXml = newDocumentXml.replace(/<w:rPr>/g, '<w:rPr><w:rtl/>');

    // Now replace the text content
    matches.forEach((m, i) => {
        const translatedText = translatedTexts[i] || m.text;
        // Escape XML special characters
        const escapedText = translatedText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');

        // Preserve the original tag with its attributes, only replace content
        const tagMatch = m.full.match(/<w:t(\s[^>]*)?>/);
        const opening = tagMatch ? `<w:t${tagMatch[1] || ''}>` : '<w:t>';
        const replacement = `${opening}${escapedText}</w:t>`;
        newDocumentXml = newDocumentXml.replace(m.full, replacement);
    });

    // Update the document in ZIP
    zip.file('word/document.xml', newDocumentXml);

    // Also update settings.xml if it exists to set default direction
    const settingsXml = await zip.file('word/settings.xml')?.async('string');
    if (settingsXml) {
        let newSettingsXml = settingsXml;
        // Add bidi setting if not present
        if (!newSettingsXml.includes('w:bidi')) {
            newSettingsXml = newSettingsXml.replace('</w:settings>', '<w:bidi/></w:settings>');
        }
        zip.file('word/settings.xml', newSettingsXml);
    }

    if (onProgress) {
        onProgress({ stage: 'rebuilding', current: 100, total: 100, message: 'تەواو!' });
    }

    // Generate new DOCX
    const blob = await zip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    return blob;
};

/**
 * Translate a PPTX file while preserving formatting
 */
export const translatePptx = async (
    file: File,
    apiKey: string,
    sourceLang: SourceLanguage,
    targetLang: TargetLanguage,
    onProgress?: ProgressCallback
): Promise<Blob> => {
    if (onProgress) {
        onProgress({ stage: 'extracting', current: 0, total: 100, message: 'خوێندنەوەی فایلی PowerPoint...' });
    }

    // Read PPTX as ZIP
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Find all slide files
    const slideFiles: string[] = [];
    zip.forEach((path, file) => {
        if (path.match(/ppt\/slides\/slide\d+\.xml$/)) {
            slideFiles.push(path);
        }
    });

    if (slideFiles.length === 0) {
        throw new Error('هیچ سلایدێک نەدۆزرایەوە');
    }

    // Sort slides by number
    slideFiles.sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0');
        const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0');
        return numA - numB;
    });

    if (onProgress) {
        onProgress({ stage: 'extracting', current: 20, total: 100, message: `${slideFiles.length} سلاید دۆزرایەوە` });
    }

    // Process each slide
    let allTexts: string[] = [];
    const slideData: { path: string; xml: string; matches: { full: string; text: string }[] }[] = [];

    for (const slidePath of slideFiles) {
        const xml = await zip.file(slidePath)?.async('string');
        if (!xml) continue;

        // Extract text from <a:t> elements (PowerPoint text)
        const textRegex = /<a:t>([^<]*)<\/a:t>/g;
        const matches: { full: string; text: string }[] = [];

        let match;
        while ((match = textRegex.exec(xml)) !== null) {
            matches.push({ full: match[0], text: match[1] });
            allTexts.push(match[1]);
        }

        slideData.push({ path: slidePath, xml, matches });
    }

    if (allTexts.length === 0) {
        throw new Error('هیچ دەقێک نەدۆزرایەوە لە سلایدەکان');
    }

    if (onProgress) {
        onProgress({ stage: 'extracting', current: 40, total: 100, message: `${allTexts.length} بەشی دەق دۆزرایەوە` });
    }

    // Translate all texts
    const translatedTexts = await batchTranslateTexts(apiKey, allTexts, sourceLang, targetLang, onProgress);

    if (onProgress) {
        onProgress({ stage: 'rebuilding', current: 80, total: 100, message: 'دروستکردنەوەی سلایدەکان...' });
    }

    // Replace texts in slides
    let textIndex = 0;
    for (const slide of slideData) {
        let newXml = slide.xml;

        // Add RTL direction to paragraph properties in PowerPoint
        // a:pPr with rtl="1" for RTL text
        newXml = newXml.replace(/<a:pPr([^>]*)>/g, (match, attrs) => {
            if (attrs.includes('rtl=')) return match; // Already has RTL
            return `<a:pPr${attrs} rtl="1">`;
        });

        // Add RTL to paragraph properties without attributes
        newXml = newXml.replace(/<a:pPr>/g, '<a:pPr rtl="1">');

        for (const m of slide.matches) {
            const translatedText = translatedTexts[textIndex] || m.text;
            // Escape XML special characters
            const escapedText = translatedText
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            newXml = newXml.replace(m.full, `<a:t>${escapedText}</a:t>`);
            textIndex++;
        }

        zip.file(slide.path, newXml);
    }

    if (onProgress) {
        onProgress({ stage: 'rebuilding', current: 100, total: 100, message: 'تەواو!' });
    }

    // Generate new PPTX
    const blob = await zip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    });

    return blob;
};

/**
 * For PDF: Create an HTML representation, translate, then convert to PDF
 * This preserves basic structure while enabling translation
 */
export const translatePdfToHtml = async (
    extractedText: string,
    apiKey: string,
    sourceLang: SourceLanguage,
    targetLang: TargetLanguage,
    originalFilename: string,
    onProgress?: ProgressCallback
): Promise<{ html: string; translatedText: string }> => {
    if (onProgress) {
        onProgress({ stage: 'translating', current: 0, total: 100, message: 'وەرگێڕانی دەق...' });
    }

    // Split text into paragraphs
    const paragraphs = extractedText.split(/\n\n+/).filter(p => p.trim());

    // Translate paragraphs
    const translatedParagraphs = await batchTranslateTexts(
        apiKey,
        paragraphs,
        sourceLang,
        targetLang,
        onProgress
    );

    if (onProgress) {
        onProgress({ stage: 'rebuilding', current: 80, total: 100, message: 'دروستکردنی HTML...' });
    }

    // Build HTML document with Kurdish/RTL support
    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ku">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${originalFilename} - وەرگێڕدراو</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap');
    
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Noto Sans Arabic', 'Segoe UI', Tahoma, sans-serif;
      direction: rtl;
      text-align: right;
      line-height: 1.8;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #f8f9fa;
      color: #1a1a2e;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px 30px;
      border-radius: 12px;
      margin-bottom: 30px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }
    
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 1.5rem;
    }
    
    .header p {
      margin: 0;
      opacity: 0.9;
      font-size: 0.9rem;
    }
    
    .content {
      background: white;
      padding: 30px 40px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    p {
      margin-bottom: 1.5em;
      text-align: justify;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .header {
        background: #667eea;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📄 ${originalFilename}</h1>
    <p>وەرگێڕدراو بە کوردی سۆرانی</p>
  </div>
  <div class="content">
    ${translatedParagraphs.map(p => `<p>${p}</p>`).join('\n    ')}
  </div>
</body>
</html>`;

    if (onProgress) {
        onProgress({ stage: 'rebuilding', current: 100, total: 100, message: 'تەواو!' });
    }

    return {
        html,
        translatedText: translatedParagraphs.join('\n\n')
    };
};

/**
 * Get file type from filename
 */
export const getDocumentType = (filename: string): 'docx' | 'pptx' | 'pdf' | 'txt' | null => {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
        case 'docx':
        case 'doc':
            return 'docx';
        case 'pptx':
        case 'ppt':
            return 'pptx';
        case 'pdf':
            return 'pdf';
        case 'txt':
            return 'txt';
        default:
            return null;
    }
};

/**
 * Get display name for language
 */
export const getLanguageName = (code: SourceLanguage | TargetLanguage): string => {
    const names: Record<string, string> = {
        'en': 'ئینگلیزی',
        'ar': 'عەرەبی',
        'tr': 'تورکی',
        'fa': 'فارسی',
        'ku': 'کوردی',
        'auto': 'خۆکار'
    };
    return names[code] || code;
};
