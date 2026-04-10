import { Bookmark } from '../hooks/useLibrary';
import { Chapter, Word } from '../hooks/useRSVP';
import './BookmarkList.css';

interface BookmarkListProps {
  bookmarks: Bookmark[];
  chapters: Chapter[];
  words: Word[];
  onJumpTo: (wordIndex: number) => void;
  onRemove: (wordIndex: number) => void;
  onClose: () => void;
}

export function BookmarkList({
  bookmarks,
  chapters,
  words,
  onJumpTo,
  onRemove,
  onClose,
}: BookmarkListProps) {
  // Find chapter for a word index
  const getChapterForWord = (wordIndex: number): Chapter | null => {
    let chapter: Chapter | null = null;
    for (const ch of chapters) {
      if (wordIndex >= ch.position) {
        chapter = ch;
      } else {
        break;
      }
    }
    return chapter;
  };

  // Get preview text around the bookmark
  const getPreview = (wordIndex: number): string => {
    const start = Math.max(0, wordIndex - 2);
    const end = Math.min(words.length - 1, wordIndex + 5);
    return words
      .slice(start, end + 1)
      .map((w) => w.word)
      .join(' ');
  };

  // Format progress percentage
  const getProgress = (wordIndex: number): string => {
    if (words.length === 0) return '0%';
    return `${Math.round((wordIndex / words.length) * 100)}%`;
  };

  return (
    <div className="bookmark-overlay" onClick={onClose}>
      <div className="bookmark-panel" onClick={(e) => e.stopPropagation()}>
        <div className="bookmark-header">
          <h3>📚 Bookmarks</h3>
          <button className="bookmark-close" onClick={onClose}>
            ×
          </button>
        </div>

        {bookmarks.length === 0 ? (
          <div className="bookmark-empty">
            <p>No bookmarks yet</p>
            <p className="bookmark-hint">
              Click the 📑 button while reading to save your place
            </p>
          </div>
        ) : (
          <ul className="bookmark-list">
            {bookmarks.map((bookmark) => {
              const chapter = getChapterForWord(bookmark.wordIndex);
              return (
                <li key={bookmark.wordIndex} className="bookmark-item">
                  <button
                    className="bookmark-jump"
                    onClick={() => {
                      onJumpTo(bookmark.wordIndex);
                      onClose();
                    }}
                  >
                    <div className="bookmark-meta">
                      <span className="bookmark-chapter">
                        {chapter?.title || 'Start'}
                      </span>
                      <span className="bookmark-progress">
                        {getProgress(bookmark.wordIndex)}
                      </span>
                    </div>
                    <div className="bookmark-preview">
                      "{getPreview(bookmark.wordIndex)}..."
                    </div>
                  </button>
                  <button
                    className="bookmark-delete"
                    onClick={() => onRemove(bookmark.wordIndex)}
                    title="Remove bookmark"
                  >
                    🗑
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
