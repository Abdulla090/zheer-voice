
/**
 * Advanced Text Utilities for Kurdish Sorani
 * Handles number conversion and text normalization.
 */

const ONES = ["", "یەک", "دوو", "سێ", "چوار", "پێنج", "شەش", "حەوت", "هەشت", "نۆ"];
const TEENS = ["دە", "یازدە", "دوازدە", "سێزدە", "چواردە", "پانزدە", "شازدە", "حەڤدە", "هەژدە", "نۆزدە"];
const TENS = ["", "", "بیست", "سی", "چل", "پەنجا", "شەست", "حەفتا", "هەشتا", "نەوەد"];
const HUNDREDS = ["", "سەد", "دووسەد", "سێسەد", "چوارسەد", "پێنجسەد", "شەشسەد", "حەوتسەد", "هەشتسەد", "نۆسەد"];

export function numberToKurdishText(num: number): string {
    if (num === 0) return "سفر";

    if (num < 0) return "ناقیس " + numberToKurdishText(Math.abs(num));

    let words = "";

    // Billions
    if (Math.floor(num / 1000000000) > 0) {
        words += numberToKurdishText(Math.floor(num / 1000000000)) + " ملیار";
        num %= 1000000000;
        if (num > 0) words += " و ";
    }

    // Millions
    if (Math.floor(num / 1000000) > 0) {
        words += numberToKurdishText(Math.floor(num / 1000000)) + " ملیۆن";
        num %= 1000000;
        if (num > 0) words += " و ";
    }

    // Thousands
    if (Math.floor(num / 1000) > 0) {
        if (Math.floor(num / 1000) === 1) {
            words += "هەزار"; // Just "Hezar" not "Yek Hezar" usually
        } else {
            words += numberToKurdishText(Math.floor(num / 1000)) + " هەزار";
        }
        num %= 1000;
        if (num > 0) words += " و ";
    }

    // Hundreds
    if (Math.floor(num / 100) > 0) {
        words += HUNDREDS[Math.floor(num / 100)];
        num %= 100;
        if (num > 0) words += " و ";
    }

    // Tens and Ones
    if (num > 0) {
        if (num < 10) {
            words += ONES[num];
        } else if (num < 20) {
            words += TEENS[num - 10];
        } else {
            words += TENS[Math.floor(num / 10)];
            if (num % 10 > 0) {
                words += " و " + ONES[num % 10];
            }
        }
    }

    return words;
}

/**
 * Normalize Kurdish text - fix characters and convert numbers
 */
export function normalizeKurdishText(text: string): string {
    // 1. Replace English/Arabic numbers with Kurdish text
    let processedText = text.replace(/\d+/g, (match) => {
        return numberToKurdishText(parseInt(match, 10));
    });

    // 2. Standardize some characters (optional but good for consistency)
    // Replace Arabic Kaf/Yeh with Kurdish Ke/Ye if mixed
    processedText = processedText
        .replace(/ك/g, 'ک')
        .replace(/ي/g, 'ی') // Arabic Yeh to Kurdish Ye
        .replace(/ى/g, 'ی') // Alef Maksura to Kurdish Ye (common typo)
        .replace(/ة/g, 'ە') // Teh Marbuta to Kurdish Ae
        .replace(/ه$/g, 'ە'); // Heh at end to Ae (context dependent, strictly heuristic)

    // 3. Fix spacing around punctuation
    processedText = processedText
        .replace(/\s+([،؛.؟!])/g, '$1') // Remove space before punctuation
        .replace(/([،؛.؟!])(?!\s)/g, '$1 '); // Add space after punctuation if missing

    return processedText;
}

/**
 * Add phonetic hints to help TTS pronounce Kurdish letters correctly.
 * This replaces special letters with phonetic annotations.
 * Use this when the TTS model struggles with certain sounds.
 */
export function addPhoneticHints(text: string): string {
    // Add subtle hints without breaking the text
    // The model should read these as pronunciation guides
    let hinted = text;

    // Mark rolled R distinctly - add a small phonetic marker
    // Using parenthetical hints that the model can interpret
    hinted = hinted.replace(/ڕ/g, 'ڕ[RR]');

    // Mark dark L distinctly
    hinted = hinted.replace(/ڵ/g, 'ڵ[LL]');

    return hinted;
}

/**
 * Alternative: Create a phonetic transcription guide
 * Returns the text with IPA-style pronunciation guide
 */
export function createPronunciationGuide(text: string): string {
    const phoneticMap: Record<string, string> = {
        'ڕ': 'ṛ', // Rolled R marker
        'ڵ': 'ḷ', // Dark L marker  
        'ێ': 'ē', // Long e/ay
        'ۆ': 'ō', // Long o
        'گ': 'g', // Hard g
        'ژ': 'zh',
        'ڤ': 'v',
        'چ': 'ch',
        'ش': 'sh',
    };

    let guide = text;
    for (const [kurdish, phonetic] of Object.entries(phoneticMap)) {
        guide = guide.replace(new RegExp(kurdish, 'g'), phonetic);
    }

    return guide;
}

