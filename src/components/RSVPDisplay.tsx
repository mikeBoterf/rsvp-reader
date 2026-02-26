import { Word } from '../hooks/useRSVP';
import './RSVPDisplay.css';

interface RSVPDisplayProps {
    phrase: Word[];
    isPlaying: boolean;
    fontSizeRem?: string;
    phraseSize?: number;
    onToggle: () => void;
}

export function RSVPDisplay({ phrase, isPlaying, fontSizeRem = '4rem', phraseSize = 1, onToggle }: RSVPDisplayProps) {
    if (!phrase || phrase.length === 0) {
        return (
            <div className="rsvp-display rsvp-empty" onClick={onToggle}>
                <div className="rsvp-placeholder">
                    Open an ebook to start reading
                </div>
            </div>
        );
    }

    // For single word mode, use the original ORP-centered layout
    if (phrase.length === 1) {
        const { word: text, orp_index } = phrase[0];
        const beforeORP = text.slice(0, orp_index);
        const orpChar = text[orp_index] || '';
        const afterORP = text.slice(orp_index + 1);

        return (
            <div className="rsvp-display" onClick={onToggle}>
                <div className="rsvp-word-container" style={{ fontSize: fontSizeRem }}>
                    <span className="rsvp-before">{beforeORP}</span>
                    <span className="rsvp-orp">{orpChar}</span>
                    <span className="rsvp-after">{afterORP}</span>
                </div>
                {!isPlaying && (
                    <div className="rsvp-paused-indicator">
                        Press Space to play
                    </div>
                )}
            </div>
        );
    }

    // For phrase mode, pick the "focus word" (middle word for 3-word, first content word for 2-word)
    // and highlight its ORP character
    const focusWordIdx = phrase.length === 2 ? 0 : Math.floor(phrase.length / 2);

    // Build the full phrase text parts: everything before ORP char, the ORP char, everything after
    const beforeParts: string[] = [];
    const afterParts: string[] = [];
    let orpChar = '';

    phrase.forEach((w, i) => {
        if (i < focusWordIdx) {
            beforeParts.push(w.word);
        } else if (i === focusWordIdx) {
            // Split focus word at ORP
            const text = w.word;
            const orpIdx = w.orp_index;
            const before = text.slice(0, orpIdx);
            orpChar = text[orpIdx] || '';
            const after = text.slice(orpIdx + 1);

            if (beforeParts.length > 0) {
                beforeParts.push(before);
            } else {
                beforeParts.push(before);
            }
            afterParts.push(after);
        } else {
            afterParts.push(w.word);
        }
    });

    const beforeText = beforeParts.join('\u00a0');
    const afterText = afterParts.join('\u00a0');

    return (
        <div className="rsvp-display" onClick={onToggle}>
            <div className="rsvp-word-container rsvp-phrase-mode" style={{ fontSize: fontSizeRem }}>
                <span className="rsvp-before">{beforeText}</span>
                <span className="rsvp-orp">{orpChar}</span>
                <span className="rsvp-after">{afterText}</span>
            </div>
            {phraseSize > 1 && !isPlaying && (
                <div className="rsvp-phrase-indicator">
                    {phraseSize}W mode
                </div>
            )}
            {!isPlaying && (
                <div className="rsvp-paused-indicator">
                    Press Space to play
                </div>
            )}
        </div>
    );
}
