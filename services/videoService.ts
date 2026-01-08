import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoaded = false;

export interface VideoMetadata {
    filename: string;
    duration: number;
    size: number;
    format: string;
    uploadedAt: number;
}

export interface AudioData {
    base64: string;
    mimeType: string;
    duration: number;
}

/**
 * Initialize FFmpeg (lazy load)
 */
export const initFFmpeg = async (): Promise<FFmpeg> => {
    if (ffmpegInstance && ffmpegLoaded) {
        console.log('FFmpeg already loaded, reusing instance');
        return ffmpegInstance;
    }

    console.log('Initializing FFmpeg...');
    ffmpegInstance = new FFmpeg();

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

    try {
        console.log('Loading FFmpeg core from CDN...');

        // Add timeout to prevent hanging
        const loadPromise = ffmpegInstance.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('FFmpeg loading timeout after 30 seconds')), 30000)
        );

        await Promise.race([loadPromise, timeoutPromise]);

        ffmpegLoaded = true;
        console.log('FFmpeg loaded successfully!');
        return ffmpegInstance;
    } catch (error) {
        console.error('FFmpeg initialization failed:', error);
        throw new Error('Failed to initialize FFmpeg. This feature requires a modern browser with SharedArrayBuffer support.');
    }
};

/**
 * Extract audio from video file
 */
export const extractAudioFromVideo = async (
    videoFile: File,
    onProgress?: (progress: number) => void
): Promise<AudioData> => {
    try {
        const ffmpeg = await initFFmpeg();

        // Set up progress listener
        if (onProgress) {
            ffmpeg.on('progress', ({ progress }) => {
                onProgress(Math.round(progress * 100));
            });
        }

        // Write video file to FFmpeg virtual file system
        await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));

        // Extract audio as WAV
        await ffmpeg.exec([
            '-i', 'input.mp4',
            '-vn', // No video
            '-acodec', 'pcm_s16le', // PCM 16-bit little-endian
            '-ar', '16000', // 16kHz sample rate (good for speech recognition)
            '-ac', '1', // Mono
            'output.wav'
        ]);

        // Read the output audio file
        const audioData = await ffmpeg.readFile('output.wav');

        // Convert to Blob (create new Uint8Array to avoid SharedArrayBuffer issues)
        const uint8Array = new Uint8Array(audioData as Uint8Array);
        const blob = new Blob([uint8Array], { type: 'audio/wav' });
        const base64 = await blobToBase64(blob);


        // Get duration from video
        const duration = await getVideoDuration(videoFile);

        // Cleanup
        await ffmpeg.deleteFile('input.mp4');
        await ffmpeg.deleteFile('output.wav');

        return {
            base64: base64.split(',')[1], // Remove data:audio/wav;base64, prefix
            mimeType: 'audio/wav',
            duration
        };
    } catch (error) {
        console.error('Audio extraction error:', error);
        throw new Error('Failed to extract audio from video. Please try a different format.');
    }
};

/**
 * Get video metadata
 */
export const getVideoMetadata = async (videoFile: File): Promise<VideoMetadata> => {
    const duration = await getVideoDuration(videoFile);

    return {
        filename: videoFile.name,
        duration,
        size: videoFile.size,
        format: videoFile.type,
        uploadedAt: Date.now()
    };
};

/**
 * Get video duration using HTML5 video element
 */
const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src);
            resolve(video.duration);
        };

        video.onerror = () => {
            reject(new Error('Failed to load video metadata'));
        };

        video.src = URL.createObjectURL(file);
    });
};

/**
 * Convert Blob to base64
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

/**
 * Process video in chunks for long videos (optional enhancement)
 */
export const shouldProcessInChunks = (duration: number): boolean => {
    // Process in chunks if video is longer than 10 minutes
    return duration > 600;
};

/**
 * Validate video file
 */
export const validateVideoFile = (file: File, maxSize: number, maxDuration?: number): { valid: boolean; error?: string } => {
    // Check file type
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
    if (!validTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'فۆرماتی ڤیدیۆ پشتگیری نەکراوە. تکایە MP4, WebM, MOV, یان AVI بەکاربهێنە.'
        };
    }

    // Check file size
    if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        return {
            valid: false,
            error: `قەبارەی ڤیدیۆ زۆر گەورەیە. تکایە ڤیدیۆیەکی کەمتر لە ${maxSizeMB}MB بەکاربهێنە.`
        };
    }

    return { valid: true };
};
