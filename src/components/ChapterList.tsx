import { Chapter, Word } from '../hooks/useRSVP';
import './ChapterList.css';

interface ChapterListProps {
    chapters: Chapter[];
    currentChapterIndex: number;
    words: Word[];
    onJumpTo: (chapterIndex: number) => void;
    onClose: () => void;
}

export function ChapterList({
    chapters,
    currentChapterIndex,
    words,
    onJumpTo,
    onClose,
}: ChapterListProps) {
    // Calculate progress percentage for a chapter's starting position
    const getProgress = (position: number): string => {
        if (words.length === 0) return '0%';
        return `${Math.round((position / words.length) * 100)}%`;
    };

    // Get word count for a chapter (from its start to the next chapter's start)
    const getChapterWordCount = (chapterIndex: number): string => {
        const start = chapters[chapterIndex].position;
        const end = chapterIndex < chapters.length - 1
            ? chapters[chapterIndex + 1].position
            : words.length;
        const count = end - start;
        return `${count.toLocaleString()} words`;
    };

    return (
        <div className="chapter-overlay" onClick={onClose}>
            <div className="chapter-panel" onClick={e => e.stopPropagation()}>
                <div className="chapter-header">
                    <h3>📖 Chapters</h3>
                    <button className="chapter-close" onClick={onClose}>×</button>
                </div>

                {chapters.length === 0 ? (
                    <div className="chapter-empty">
                        <p>No chapters found</p>
                        <p className="chapter-hint">This book doesn't have chapter markers</p>
                    </div>
                ) : (
                    <ul className="chapter-list">
                        {chapters.map((chapter, index) => {
                            const isActive = index === currentChapterIndex;
                            return (
                                <li
                                    key={index}
                                    className={`chapter-item ${isActive ? 'active' : ''}`}
                                >
                                    <button
                                        className="chapter-jump"
                                        onClick={() => {
                                            onJumpTo(index);
                                            onClose();
                                        }}
                                    >
                                        <div className="chapter-row-main">
                                            <span className="chapter-number">
                                                {index + 1}
                                            </span>
                                            <span className="chapter-title">
                                                {chapter.title || `Chapter ${index + 1}`}
                                            </span>
                                        </div>
                                        <div className="chapter-row-meta">
                                            <span className="chapter-words">
                                                {getChapterWordCount(index)}
                                            </span>
                                            <span className="chapter-progress">
                                                {getProgress(chapter.position)}
                                            </span>
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
