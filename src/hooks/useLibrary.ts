import { useState, useEffect, useCallback } from 'react';

export interface Bookmark {
  wordIndex: number;
  label?: string;
  createdAt: number;
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  format: string;
  filePath: string;
  browserText?: string;
  coverUrl?: string;
  wordCount: number;
  currentWordIndex: number;
  totalChapters: number;
  currentChapter: number;
  progressDisplayType: 'percent' | 'chapter' | 'pages';
  bookmarks: Bookmark[];
  addedAt: number;
  lastReadAt: number;
}

interface LibraryState {
  books: LibraryBook[];
  activeBookId: string | null;
}

const STORAGE_KEY = 'rsvp-library';

function generateId(): string {
  return `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function loadLibrary(): LibraryState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const state = JSON.parse(saved) as LibraryState;
      // Migrate old books that don't have bookmarks array
      state.books = state.books.map((book) => ({
        ...book,
        bookmarks: book.bookmarks || [],
      }));
      return state;
    }
  } catch (e) {
    console.error('Failed to load library:', e);
  }
  return { books: [], activeBookId: null };
}

function saveLibrary(state: LibraryState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save library:', e);
  }
}

export function useLibrary() {
  const [state, setState] = useState<LibraryState>(loadLibrary);

  // Save to localStorage whenever state changes
  useEffect(() => {
    saveLibrary(state);
  }, [state]);

  const addBook = useCallback(
    (
      book: Omit<
        LibraryBook,
        | 'id'
        | 'currentWordIndex'
        | 'currentChapter'
        | 'progressDisplayType'
        | 'bookmarks'
        | 'addedAt'
        | 'lastReadAt'
      >
    ): LibraryBook => {
      const newBook: LibraryBook = {
        ...book,
        id: generateId(),
        currentWordIndex: 0,
        currentChapter: 0,
        progressDisplayType: 'percent',
        bookmarks: [],
        addedAt: Date.now(),
        lastReadAt: Date.now(),
      };

      setState((prev) => ({
        ...prev,
        books: [...prev.books, newBook],
      }));

      return newBook;
    },
    []
  );

  const removeBook = useCallback((bookId: string) => {
    setState((prev) => ({
      ...prev,
      books: prev.books.filter((b) => b.id !== bookId),
      activeBookId: prev.activeBookId === bookId ? null : prev.activeBookId,
    }));
  }, []);

  const updateBookProgress = useCallback(
    (bookId: string, currentWordIndex: number, currentChapter?: number) => {
      setState((prev) => ({
        ...prev,
        books: prev.books.map((book) =>
          book.id === bookId
            ? {
                ...book,
                currentWordIndex,
                currentChapter: currentChapter ?? book.currentChapter,
                lastReadAt: Date.now(),
              }
            : book
        ),
      }));
    },
    []
  );

  const setProgressDisplayType = useCallback(
    (bookId: string, displayType: LibraryBook['progressDisplayType']) => {
      setState((prev) => ({
        ...prev,
        books: prev.books.map((book) =>
          book.id === bookId
            ? { ...book, progressDisplayType: displayType }
            : book
        ),
      }));
    },
    []
  );

  const setActiveBook = useCallback((bookId: string | null) => {
    setState((prev) => ({ ...prev, activeBookId: bookId }));
  }, []);

  const getBook = useCallback(
    (bookId: string): LibraryBook | undefined => {
      return state.books.find((b) => b.id === bookId);
    },
    [state.books]
  );

  const activeBook = state.activeBookId
    ? getBook(state.activeBookId)
    : undefined;

  const getProgress = useCallback((book: LibraryBook): string => {
    const percent =
      book.wordCount > 0
        ? Math.round((book.currentWordIndex / book.wordCount) * 100)
        : 0;

    switch (book.progressDisplayType) {
      case 'percent':
        return `${percent}%`;
      case 'chapter':
        return `Ch. ${book.currentChapter + 1}/${book.totalChapters}`;
      case 'pages':
        // Estimate ~250 words per page
        const currentPage = Math.floor(book.currentWordIndex / 250) + 1;
        const totalPages = Math.ceil(book.wordCount / 250);
        return `${currentPage}/${totalPages} pages`;
      default:
        return `${percent}%`;
    }
  }, []);

  // Bookmark methods
  const addBookmark = useCallback(
    (bookId: string, wordIndex: number, label?: string) => {
      setState((prev) => ({
        ...prev,
        books: prev.books.map((book) =>
          book.id === bookId
            ? {
                ...book,
                bookmarks: [
                  ...book.bookmarks.filter((b) => b.wordIndex !== wordIndex),
                  { wordIndex, label, createdAt: Date.now() },
                ].sort((a, b) => a.wordIndex - b.wordIndex),
              }
            : book
        ),
      }));
    },
    []
  );

  const removeBookmark = useCallback((bookId: string, wordIndex: number) => {
    setState((prev) => ({
      ...prev,
      books: prev.books.map((book) =>
        book.id === bookId
          ? {
              ...book,
              bookmarks: book.bookmarks.filter(
                (b) => b.wordIndex !== wordIndex
              ),
            }
          : book
      ),
    }));
  }, []);

  const getBookmarks = useCallback(
    (bookId: string): Bookmark[] => {
      const book = state.books.find((b) => b.id === bookId);
      return book?.bookmarks || [];
    },
    [state.books]
  );

  const isBookmarked = useCallback(
    (bookId: string, wordIndex: number): boolean => {
      const bookmarks = getBookmarks(bookId);
      return bookmarks.some((b) => b.wordIndex === wordIndex);
    },
    [getBookmarks]
  );

  return {
    books: state.books,
    activeBook,
    activeBookId: state.activeBookId,
    addBook,
    removeBook,
    updateBookProgress,
    setProgressDisplayType,
    setActiveBook,
    getBook,
    getProgress,
    addBookmark,
    removeBookmark,
    getBookmarks,
    isBookmarked,
  };
}
