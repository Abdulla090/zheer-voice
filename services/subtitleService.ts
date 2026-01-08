export interface TranscriptSegment {
    id: string;
    startTime: number;
    endTime: number;
    originalText: string;
    translatedText: string;
    language: string;
}

/**
 * Generate SRT subtitle file
 */
export const generateSRT = (segments: TranscriptSegment[]): string => {
    let srt = '';

    segments.forEach((segment, index) => {
        srt += `${index + 1}\n`;
        srt += `${formatSRTTime(segment.startTime)} --> ${formatSRTTime(segment.endTime)}\n`;
        srt += `${segment.translatedText}\n\n`;
    });

    return srt.trim();
};

/**
 * Generate VTT subtitle file
 */
export const generateVTT = (segments: TranscriptSegment[]): string => {
    let vtt = 'WEBVTT\n\n';

    segments.forEach((segment) => {
        vtt += `${formatVTTTime(segment.startTime)} --> ${formatVTTTime(segment.endTime)}\n`;
        vtt += `${segment.translatedText}\n\n`;
    });

    return vtt.trim();
};

/**
 * Generate dual-language subtitles (original + translation)
 */
export const generateDualSRT = (segments: TranscriptSegment[]): string => {
    let srt = '';

    segments.forEach((segment, index) => {
        srt += `${index + 1}\n`;
        srt += `${formatSRTTime(segment.startTime)} --> ${formatSRTTime(segment.endTime)}\n`;
        srt += `${segment.translatedText}\n`;
        srt += `${segment.originalText}\n\n`;
    });

    return srt.trim();
};

/**
 * Format time for SRT (HH:MM:SS,mmm)
 */
const formatSRTTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);

    return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(milliseconds, 3)}`;
};

/**
 * Format time for VTT (HH:MM:SS.mmm)
 */
const formatVTTTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);

    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}.${pad(milliseconds, 3)}`;
};

/**
 * Pad number with zeros
 */
const pad = (num: number, size: number = 2): string => {
    return num.toString().padStart(size, '0');
};

/**
 * Download subtitle file
 */
export const downloadSubtitle = (content: string, filename: string, format: 'srt' | 'vtt') => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Create segments from full transcript
 * This is a simple implementation that splits by sentences
 * In production, you'd want proper timestamp alignment
 */
export const createSegmentsFromTranscript = (
    originalText: string,
    translatedText: string,
    duration: number,
    language: string
): TranscriptSegment[] => {
    // Split by sentences (simple regex)
    const originalSentences = originalText.match(/[^.!?]+[.!?]+/g) || [originalText];
    const translatedSentences = translatedText.match(/[^.!?؟]+[.!?؟]+/g) || [translatedText];

    const segments: TranscriptSegment[] = [];
    const maxSegments = Math.max(originalSentences.length, translatedSentences.length);
    const segmentDuration = duration / maxSegments;

    for (let i = 0; i < maxSegments; i++) {
        segments.push({
            id: `seg-${i}`,
            startTime: i * segmentDuration,
            endTime: (i + 1) * segmentDuration,
            originalText: (originalSentences[i] || '').trim(),
            translatedText: (translatedSentences[i] || '').trim(),
            language
        });
    }

    return segments;
};

/**
 * Parse SRT file back to segments (for importing existing subtitles)
 */
export const parseSRT = (srtContent: string): TranscriptSegment[] => {
    const segments: TranscriptSegment[] = [];
    const blocks = srtContent.trim().split('\n\n');

    blocks.forEach((block, index) => {
        const lines = block.split('\n');
        if (lines.length >= 3) {
            const timeLine = lines[1];
            const times = timeLine.split(' --> ');
            const text = lines.slice(2).join(' ');

            segments.push({
                id: `seg-${index}`,
                startTime: parseSRTTime(times[0]),
                endTime: parseSRTTime(times[1]),
                originalText: text,
                translatedText: text,
                language: 'unknown'
            });
        }
    });

    return segments;
};

/**
 * Parse SRT timestamp to seconds
 */
const parseSRTTime = (timeString: string): number => {
    const [time, ms] = timeString.split(',');
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds + Number(ms) / 1000;
};
