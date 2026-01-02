
import React from 'react';

interface FormattedTextProps {
    text: string;
    className?: string;
}

/**
 * Simple markdown-like text formatter
 * Supports: **bold**, *italic*, `code`, and line breaks
 */
const FormattedText: React.FC<FormattedTextProps> = ({ text, className = '' }) => {
    const formatText = (input: string): React.ReactNode[] => {
        const parts: React.ReactNode[] = [];
        let remaining = input;
        let key = 0;

        // Process line by line for better paragraph handling
        const lines = remaining.split('\n');

        lines.forEach((line, lineIndex) => {
            if (lineIndex > 0) {
                parts.push(<br key={`br-${key++}`} />);
            }

            // Process inline formatting within each line
            let lineRemaining = line;

            while (lineRemaining.length > 0) {
                // Bold: **text**
                const boldMatch = lineRemaining.match(/\*\*(.+?)\*\*/);
                // Italic: *text* (but not **)
                const italicMatch = lineRemaining.match(/(?<!\*)\*([^*]+?)\*(?!\*)/);
                // Code: `text`
                const codeMatch = lineRemaining.match(/`([^`]+?)`/);

                // Find the earliest match
                const matches = [
                    boldMatch ? { type: 'bold', match: boldMatch, index: boldMatch.index! } : null,
                    italicMatch ? { type: 'italic', match: italicMatch, index: italicMatch.index! } : null,
                    codeMatch ? { type: 'code', match: codeMatch, index: codeMatch.index! } : null,
                ].filter(Boolean).sort((a, b) => a!.index - b!.index);

                if (matches.length === 0) {
                    // No more formatting, add remaining text
                    if (lineRemaining) {
                        parts.push(<span key={`text-${key++}`}>{lineRemaining}</span>);
                    }
                    break;
                }

                const firstMatch = matches[0]!;

                // Add text before the match
                if (firstMatch.index > 0) {
                    parts.push(<span key={`text-${key++}`}>{lineRemaining.slice(0, firstMatch.index)}</span>);
                }

                // Add formatted text
                const content = firstMatch.match![1];
                switch (firstMatch.type) {
                    case 'bold':
                        parts.push(<strong key={`bold-${key++}`} className="font-bold text-white">{content}</strong>);
                        break;
                    case 'italic':
                        parts.push(<em key={`italic-${key++}`} className="italic text-slate-300">{content}</em>);
                        break;
                    case 'code':
                        parts.push(
                            <code key={`code-${key++}`} className="px-1.5 py-0.5 bg-slate-700/50 rounded text-emerald-400 font-mono text-xs">
                                {content}
                            </code>
                        );
                        break;
                }

                // Continue with remaining text
                lineRemaining = lineRemaining.slice(firstMatch.index + firstMatch.match![0].length);
            }
        });

        return parts;
    };

    return (
        <div className={`whitespace-pre-wrap leading-relaxed ${className}`}>
            {formatText(text)}
        </div>
    );
};

export default FormattedText;
