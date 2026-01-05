import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { downloadSubtitle, generateSRT, generateVTT } from '../../../services/subtitleUtils';
import { useToast } from '../Toast/ToastProvider';

interface TranscriptionActionsProps {
    transcription: string;
    audioDuration: number;
    className?: string;
    buttonClassName?: string;
}

export const TranscriptionActions: React.FC<TranscriptionActionsProps> = ({
    transcription,
    audioDuration,
    className = '',
    buttonClassName = "text-[10px] text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded border border-white/5 transition-colors"
}) => {
    const { showToast } = useToast();
    const [copySuccess, setCopySuccess] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(transcription);
            setCopySuccess(true);
            showToast("دەق کۆپی کرا", "success");
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            showToast("کێشەیەک لە کۆپیکردن ڕوویدا", "error");
        }
    };

    const handleDownload = (format: 'srt' | 'vtt') => {
        if (audioDuration === 0) return;
        try {
            const content = format === 'srt'
                ? generateSRT(transcription, audioDuration)
                : generateVTT(transcription, audioDuration);
            downloadSubtitle(content, 'transcription', format);
            showToast(`پەڕگەی ${format.toUpperCase()} دابەزێندرا`, "success");
        } catch (error) {
            console.error(`Failed to generate/download ${format}:`, error);
            showToast("کێشەیەک لە دابەزاندن ڕوویدا", "error");
        }
    };

    const disabled = audioDuration === 0;

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <button
                onClick={() => handleDownload('srt')}
                disabled={disabled}
                className={`${buttonClassName} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                SRT
            </button>
            <button
                onClick={() => handleDownload('vtt')}
                disabled={disabled}
                className={`${buttonClassName} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                VTT
            </button>
            <button
                onClick={handleCopy}
                className={`${buttonClassName} flex items-center gap-1`}
            >
                {copySuccess ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copySuccess ? "Copied" : "Copy"}
            </button>
        </div>
    );
};
