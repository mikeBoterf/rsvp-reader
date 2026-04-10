import { LibraryBook } from '../hooks/useLibrary';
import { BookCard } from './BookCard';
import { ThemeToggle } from './ThemeToggle';
import './Library.css';

interface LibraryProps {
  books: LibraryBook[];
  activeBookId: string | null;
  getProgress: (book: LibraryBook) => string;
  onSelectBook: (bookId: string) => void;
  onRemoveBook: (bookId: string) => void;
  onProgressTypeChange: (
    bookId: string,
    type: LibraryBook['progressDisplayType']
  ) => void;
  onAddBook: () => void;
  addBookFormats?: string;
  emptyHint?: string;
  isAddingBook?: boolean;
}

export function Library({
  books,
  activeBookId,
  getProgress,
  onSelectBook,
  onRemoveBook,
  onProgressTypeChange,
  onAddBook,
  addBookFormats = 'PDF • EPUB • MOBI • TXT',
  emptyHint = '👆 Click "Add Book" to start reading',
  isAddingBook = false,
}: LibraryProps) {
  // Sort books: recently read first
  const sortedBooks = [...books].sort((a, b) => b.lastReadAt - a.lastReadAt);

  return (
    <div className="library-screen">
      {/* Header */}
      <header className="library-header">
        <div className="library-header-left">
          <h1 className="library-logo">📖 RSVP Reader</h1>
        </div>
        <div className="library-header-right">
          <span className="library-count">
            {books.length} {books.length === 1 ? 'book' : 'books'}
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* Main content - Book grid */}
      <main className="library-main">
        <div className="library-grid">
          {/* Add Book Card - always first */}
          <button
            className="add-book-card"
            onClick={onAddBook}
            disabled={isAddingBook}
          >
            <div className="add-book-icon">
              {isAddingBook ? (
                <span className="loading-spinner">⏳</span>
              ) : (
                <span>+</span>
              )}
            </div>
            <span className="add-book-text">
              {isAddingBook ? 'Loading...' : 'Add Book'}
            </span>
            <span className="add-book-formats">{addBookFormats}</span>
          </button>

          {/* Book cards */}
          {sortedBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              progress={getProgress(book)}
              isActive={book.id === activeBookId}
              onSelect={() => onSelectBook(book.id)}
              onRemove={() => onRemoveBook(book.id)}
              onProgressTypeChange={(type) =>
                onProgressTypeChange(book.id, type)
              }
            />
          ))}
        </div>

        {/* Empty state message */}
        {books.length === 0 && (
          <div className="library-empty-hint">
            <p>{emptyHint}</p>
          </div>
        )}
      </main>
    </div>
  );
}
