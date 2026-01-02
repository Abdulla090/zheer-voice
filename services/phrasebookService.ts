/**
 * Phrasebook Service - Save and manage favorite translations
 */

export interface SavedPhrase {
    id: string;
    originalText: string;
    translatedText: string;
    fromLang: string;
    toLang: string;
    timestamp: Date;
    tags?: string[];
}

const PHRASEBOOK_KEY = 'zheer_phrasebook';

/**
 * Get all saved phrases
 */
export const getPhrases = (): SavedPhrase[] => {
    try {
        const data = localStorage.getItem(PHRASEBOOK_KEY);
        if (!data) return [];
        const phrases = JSON.parse(data);
        return phrases.map((p: any) => ({
            ...p,
            timestamp: new Date(p.timestamp)
        }));
    } catch {
        return [];
    }
};

/**
 * Save a new phrase
 */
export const savePhrase = (phrase: Omit<SavedPhrase, 'id' | 'timestamp'>): SavedPhrase => {
    const phrases = getPhrases();

    // Check for duplicates
    const exists = phrases.some(p =>
        p.originalText === phrase.originalText &&
        p.translatedText === phrase.translatedText
    );

    if (exists) {
        throw new Error('This phrase is already saved');
    }

    const newPhrase: SavedPhrase = {
        ...phrase,
        id: Date.now().toString(),
        timestamp: new Date()
    };

    phrases.unshift(newPhrase);
    localStorage.setItem(PHRASEBOOK_KEY, JSON.stringify(phrases));

    return newPhrase;
};

/**
 * Delete a phrase by ID
 */
export const deletePhrase = (id: string): void => {
    const phrases = getPhrases().filter(p => p.id !== id);
    localStorage.setItem(PHRASEBOOK_KEY, JSON.stringify(phrases));
};

/**
 * Search phrases
 */
export const searchPhrases = (query: string): SavedPhrase[] => {
    const phrases = getPhrases();
    const lowerQuery = query.toLowerCase();

    return phrases.filter(p =>
        p.originalText.toLowerCase().includes(lowerQuery) ||
        p.translatedText.toLowerCase().includes(lowerQuery) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(lowerQuery)))
    );
};

/**
 * Update phrase tags
 */
export const updatePhraseTags = (id: string, tags: string[]): void => {
    const phrases = getPhrases();
    const index = phrases.findIndex(p => p.id === id);

    if (index !== -1) {
        phrases[index].tags = tags;
        localStorage.setItem(PHRASEBOOK_KEY, JSON.stringify(phrases));
    }
};

/**
 * Export phrasebook as JSON
 */
export const exportPhrasebook = (): string => {
    const phrases = getPhrases();
    return JSON.stringify(phrases, null, 2);
};

/**
 * Import phrasebook from JSON
 */
export const importPhrasebook = (jsonData: string): number => {
    try {
        const imported = JSON.parse(jsonData) as SavedPhrase[];
        const existing = getPhrases();

        let addedCount = 0;
        imported.forEach(phrase => {
            const exists = existing.some(p =>
                p.originalText === phrase.originalText &&
                p.translatedText === phrase.translatedText
            );

            if (!exists) {
                existing.push({
                    ...phrase,
                    id: Date.now().toString() + addedCount,
                    timestamp: new Date(phrase.timestamp)
                });
                addedCount++;
            }
        });

        localStorage.setItem(PHRASEBOOK_KEY, JSON.stringify(existing));
        return addedCount;
    } catch {
        throw new Error('Invalid phrasebook data');
    }
};
