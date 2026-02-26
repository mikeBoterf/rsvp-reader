import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { ThemeProvider } from './contexts/ThemeContext';

import { Library } from './components/Library';
import { ReadingMode } from './components/ReadingMode';
import { RSVPDisplay } from './components/RSVPDisplay';
import { Controls } from './components/Controls';
import { ChapterList } from './components/ChapterList';

import { BookmarkList } from './components/BookmarkList';
import { useRSVP, Word, Chapter } from './hooks/useRSVP';
import { useLibrary } from './hooks/useLibrary';
import { useSettings } from './hooks/useSettings';
import './styles/design-tokens.css';

// Supported file formats
const SUPPORTED_FORMATS = ['pdf', 'epub', 'mobi', 'azw', 'azw3', 'txt'];

// Parse result from Rust/Python backend
interface ParseResult {
  title: string;
  author: string;
  format: string;
  chapters: Chapter[];
  words: Word[];
  word_count: number;
  error?: string;
}

interface BookData {
  title: string;
  author: string;
  words: Word[];
  chapters: Chapter[];
  wordCount: number;
  format: string;
  filePath: string;
}

function AppContent() {
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTauri, setIsTauri] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showChapters, setShowChapters] = useState(false);

  const library = useLibrary();
  const settings = useSettings();

  // Check if running in Tauri
  useEffect(() => {
    const hasTauri = typeof window !== 'undefined' &&
      ('__TAURI__' in window || '__TAURI_INTERNALS__' in window);
    setIsTauri(hasTauri);
  }, []);

  const words = bookData?.words || [];
  const chapters = bookData?.chapters || [];

  const rsvp = useRSVP({
    words,
    chapters,
    initialWpm: 300,
    pauseOnPunctuation: settings.pauseOnPunctuation,
    phraseSize: settings.phraseSize,
  });

  // Auto-save progress when pausing or changing chapters
  useEffect(() => {
    if (library.activeBookId && bookData && !rsvp.isPlaying) {
      library.updateBookProgress(
        library.activeBookId,
        rsvp.currentWordIndex,
        rsvp.currentChapterIndex
      );
    }
  }, [rsvp.isPlaying, rsvp.currentWordIndex, rsvp.currentChapterIndex]);

  // Parse file using Python backend
  const parseFile = useCallback(async (filePath: string): Promise<BookData | null> => {
    if (!isTauri) {
      setError('File parsing requires the desktop app.');
      return null;
    }

    try {
      const result = await invoke<ParseResult>('parse_ebook', { filePath });

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.words || result.words.length === 0) {
        throw new Error('No words found in the book.');
      }

      return {
        title: result.title || 'Untitled',
        author: result.author || 'Unknown Author',
        words: result.words,
        chapters: result.chapters || [],
        wordCount: result.word_count || result.words.length,
        format: result.format || '',
        filePath,
      };
    } catch (err) {
      console.error('Parse error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load file');
      return null;
    }
  }, [isTauri]);

  // Handle file selection (new book)
  const handleFileSelect = useCallback(async (filePath: string) => {
    if (!filePath) return;

    setIsLoading(true);
    setError(null);

    const data = await parseFile(filePath);
    if (data) {
      // Add to library
      const newBook = library.addBook({
        title: data.title,
        author: data.author,
        format: data.format,
        filePath: data.filePath,
        wordCount: data.wordCount,
        totalChapters: data.chapters.length,
      });

      library.setActiveBook(newBook.id);
      setBookData(data);
      rsvp.reset();
      setIsReading(true);
    }

    setIsLoading(false);
  }, [parseFile, library, rsvp]);

  // Handle selecting book from library
  const handleSelectBook = useCallback(async (bookId: string) => {
    const book = library.getBook(bookId);
    if (!book) return;

    setIsLoading(true);
    setError(null);

    const data = await parseFile(book.filePath);
    if (data) {
      library.setActiveBook(bookId);
      setBookData(data);
      // Resume from saved position
      rsvp.reset();
      setTimeout(() => {
        rsvp.goToWord(book.currentWordIndex);
      }, 100);
      setIsReading(true);
    }

    setIsLoading(false);
  }, [library, parseFile, rsvp]);

  // Handle add book via dialog
  const handleAddBook = useCallback(async () => {
    if (!isTauri) return;

    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Ebooks',
          extensions: SUPPORTED_FORMATS
        }]
      });

      if (selected && typeof selected === 'string') {
        await handleFileSelect(selected);
      }
    } catch (err) {
      console.error('Failed to open file dialog:', err);
    }
  }, [isTauri, handleFileSelect]);

  // Exit reading mode
  const handleExitReading = useCallback(() => {
    // Save progress before exiting
    if (library.activeBookId) {
      library.updateBookProgress(
        library.activeBookId,
        rsvp.currentWordIndex,
        rsvp.currentChapterIndex
      );
    }
    rsvp.pause();
    setIsReading(false);
    setShowBookmarks(false);
    setShowChapters(false);
  }, [library, rsvp]);

  // Bookmark handlers
  const handleBookmarkToggle = useCallback(() => {
    if (!library.activeBookId) return;

    if (library.isBookmarked(library.activeBookId, rsvp.currentWordIndex)) {
      library.removeBookmark(library.activeBookId, rsvp.currentWordIndex);
    } else {
      library.addBookmark(library.activeBookId, rsvp.currentWordIndex);
    }
  }, [library, rsvp.currentWordIndex]);

  const handleBookmarkJump = useCallback((wordIndex: number) => {
    rsvp.goToWord(wordIndex);
  }, [rsvp]);

  const handleBookmarkRemove = useCallback((wordIndex: number) => {
    if (!library.activeBookId) return;
    library.removeBookmark(library.activeBookId, wordIndex);
  }, [library]);

  // Get current bookmarks
  const currentBookmarks = library.activeBookId
    ? library.getBookmarks(library.activeBookId)
    : [];

  const isCurrentPositionBookmarked = library.activeBookId
    ? library.isBookmarked(library.activeBookId, rsvp.currentWordIndex)
    : false;

  return (
    <>
      {/* Library as main screen when not reading */}
      {!isReading && (
        <>
          {error && (
            <div className="error-toast" style={{
              position: 'fixed',
              top: 'var(--space-lg)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(196, 30, 58, 0.95)',
              color: 'white',
              padding: 'var(--space-md) var(--space-lg)',
              borderRadius: 'var(--radius-md)',
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}>
              {error}
              <button
                onClick={() => setError(null)}
                style={{ marginLeft: 'var(--space-md)', background: 'none', color: 'white', fontSize: '1.2em' }}
              >
                ×
              </button>
            </div>
          )}
          <Library
            books={library.books}
            activeBookId={library.activeBookId}
            getProgress={library.getProgress}
            onSelectBook={handleSelectBook}
            onRemoveBook={library.removeBook}
            onProgressTypeChange={library.setProgressDisplayType}
            onAddBook={handleAddBook}
            isAddingBook={isLoading}
          />
        </>
      )}

      {/* Full-screen reading mode */}
      <ReadingMode
        isActive={isReading}
        onExit={handleExitReading}
        controls={
          <Controls
            isPlaying={rsvp.isPlaying}
            wpm={rsvp.wpm}
            progress={rsvp.progress}
            currentChapter={rsvp.currentChapter}
            currentChapterIndex={rsvp.currentChapterIndex}
            totalChapters={chapters.length}
            wordCount={words.length}
            currentWordIndex={rsvp.currentWordIndex}
            fontSize={settings.fontSize}
            pauseOnPunctuation={settings.pauseOnPunctuation}
            isBookmarked={isCurrentPositionBookmarked}
            phraseSize={settings.phraseSize}
            onToggle={rsvp.toggle}
            onWpmChange={rsvp.setWpm}
            onProgressChange={rsvp.goToWord}
            onNextWord={rsvp.nextWord}
            onPrevWord={rsvp.prevWord}
            onFontSizeChange={settings.setFontSize}
            onPauseToggle={settings.togglePausePunctuation}
            onBookmarkToggle={handleBookmarkToggle}
            onShowBookmarks={() => setShowBookmarks(true)}
            onShowChapters={() => setShowChapters(true)}
            onPhraseSizeCycle={settings.cyclePhraseSize}
          />
        }
      >
        <RSVPDisplay
          phrase={rsvp.currentPhrase}
          isPlaying={rsvp.isPlaying}
          fontSizeRem={settings.fontSizeRem}
          phraseSize={settings.phraseSize}
          onToggle={rsvp.toggle}
        />
      </ReadingMode>

      {/* Bookmark list overlay */}
      {showBookmarks && (
        <BookmarkList
          bookmarks={currentBookmarks}
          chapters={chapters}
          words={words}
          onJumpTo={handleBookmarkJump}
          onRemove={handleBookmarkRemove}
          onClose={() => setShowBookmarks(false)}
        />
      )}

      {/* Chapter list overlay */}
      {showChapters && (
        <ChapterList
          chapters={chapters}
          currentChapterIndex={rsvp.currentChapterIndex}
          words={words}
          onJumpTo={(chapterIndex) => {
            rsvp.goToChapter(chapterIndex);
          }}
          onClose={() => setShowChapters(false)}
        />
      )}
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;

