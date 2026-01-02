
export interface AppStats {
    ttsCount: number;
    sttCount: number;
    ocrCount: number;
    translationCount: number;
    grammarCount: number;
}

const STATS_KEY = 'zheer_saz_stats';

const defaultStats: AppStats = {
    ttsCount: 0,
    sttCount: 0,
    ocrCount: 0,
    translationCount: 0,
    grammarCount: 0,
};

export const getStats = (): AppStats => {
    const stored = localStorage.getItem(STATS_KEY);
    if (!stored) return defaultStats;
    try {
        return { ...defaultStats, ...JSON.parse(stored) };
    } catch {
        return defaultStats;
    }
};

export const incrementStat = (key: keyof AppStats) => {
    const stats = getStats();
    stats[key]++;
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
};

export const resetStats = () => {
    localStorage.setItem(STATS_KEY, JSON.stringify(defaultStats));
};
