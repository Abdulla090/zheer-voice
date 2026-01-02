/**
 * Subtitle Utilities for SRT/VTT generation
 */

export interface TimedWord {
    word: string;
    startTime: number; // in seconds
    endTime: number;   // in seconds
}

export interface SubtitleSegment {
    index: number;
    startTime: number;
    endTime: number;
    text: string;
}

/**
 * Format time for SRT (HH:MM:SS,mmm)
 */
const formatSRTTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
};

/**
 * Format time for VTT (HH:MM:SS.mmm)
 */
const formatVTTTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};

/**
 * Generate word timings from text and audio duration
 */
export const generateWordTimings = (text: string, audioDuration: number): TimedWord[] => {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return [];

    const timePerWord = audioDuration / words.length;

    return words.map((word, index) => ({
        word,
        startTime: index * timePerWord,
        endTime: (index + 1) * timePerWord
    }));
};

/**
 * Group words into subtitle segments (max ~10 words or 5 seconds per segment)
 */
export const createSubtitleSegments = (timedWords: TimedWord[], maxWordsPerSegment: number = 8, maxDuration: number = 5): SubtitleSegment[] => {
    if (timedWords.length === 0) return [];

    const segments: SubtitleSegment[] = [];
    let currentSegment: TimedWord[] = [];
    let segmentStartTime = timedWords[0].startTime;

    timedWords.forEach((timedWord, index) => {
        currentSegment.push(timedWord);

        const segmentDuration = timedWord.endTime - segmentStartTime;
        const isLastWord = index === timedWords.length - 1;

        // Create segment if max words reached, max duration reached, or last word
        if (currentSegment.length >= maxWordsPerSegment || segmentDuration >= maxDuration || isLastWord) {
            segments.push({
                index: segments.length + 1,
                startTime: segmentStartTime,
                endTime: timedWord.endTime,
                text: currentSegment.map(w => w.word).join(' ')
            });

            currentSegment = [];
            if (!isLastWord && index + 1 < timedWords.length) {
                segmentStartTime = timedWords[index + 1].startTime;
            }
        }
    });

    return segments;
};

/**
 * Generate SRT subtitle format
 */
export const generateSRT = (text: string, audioDuration: number): string => {
    const timedWords = generateWordTimings(text, audioDuration);
    const segments = createSubtitleSegments(timedWords);

    return segments.map(segment =>
        `${segment.index}\n${formatSRTTime(segment.startTime)} --> ${formatSRTTime(segment.endTime)}\n${segment.text}\n`
    ).join('\n');
};

/**
 * Generate WebVTT subtitle format
 */
export const generateVTT = (text: string, audioDuration: number): string => {
    const timedWords = generateWordTimings(text, audioDuration);
    const segments = createSubtitleSegments(timedWords);

    const header = 'WEBVTT\n\n';
    const content = segments.map(segment =>
        `${segment.index}\n${formatVTTTime(segment.startTime)} --> ${formatVTTTime(segment.endTime)}\n${segment.text}\n`
    ).join('\n');

    return header + content;
};

/**
 * Download subtitle file
 */
export const downloadSubtitle = (content: string, filename: string, format: 'srt' | 'vtt'): void => {
    const mimeType = format === 'srt' ? 'text/plain' : 'text/vtt';
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
