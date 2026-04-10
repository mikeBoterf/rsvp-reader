import { LibraryBook } from '../hooks/useLibrary';
import './BookCard.css';

interface BookCardProps {
  book: LibraryBook;
  progress: string;
  isActive: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onProgressTypeChange: (type: LibraryBook['progressDisplayType']) => void;
}

export function BookCard({
  book,
  progress,
  isActive,
  onSelect,
  onRemove,
  onProgressTypeChange,
}: BookCardProps) {
  const progressTypes: LibraryBook['progressDisplayType'][] = [
    'percent',
    'chapter',
    'pages',
  ];

  const cycleProgressType = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIndex = progressTypes.indexOf(book.progressDisplayType);
    const nextIndex = (currentIndex + 1) % progressTypes.length;
    onProgressTypeChange(progressTypes[nextIndex]);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Remove "${book.title}" from library?`)) {
      onRemove();
    }
  };

  // Calculate progress percentage for the bar
  const progressPercent =
    book.wordCount > 0 ? (book.currentWordIndex / book.wordCount) * 100 : 0;

  return (
    <div
      className={`book-card ${isActive ? 'active' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
    >
      {/* Book Cover */}
      <div className="book-cover">
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} />
        ) : (
          <div className="book-cover-placeholder">
            <span className="book-format">{book.format.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Book Info */}
      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">by {book.author}</p>

        {/* Progress Bar */}
        <div className="book-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <button
            className="progress-text"
            onClick={cycleProgressType}
            title="Click to change display format"
          >
            {progress}
          </button>
        </div>
      </div>

      {/* Actions */}
      <button
        className="book-remove"
        onClick={handleRemove}
        aria-label="Remove from library"
        title="Remove from library"
      >
        ×
      </button>
    </div>
  );
}
