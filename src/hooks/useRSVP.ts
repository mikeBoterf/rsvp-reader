import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

export interface Word {
  word: string;
  orp_index: number;
  pause_after: number;
}

export interface Chapter {
  title: string;
  position: number;
}

export interface UseRSVPOptions {
  words: Word[];
  chapters: Chapter[];
  initialWpm?: number;
  pauseOnPunctuation?: boolean;
  phraseSize?: number; // 1 = single word, 2 = 2-word, 3 = 3-word
}

export interface UseRSVPReturn {
  // Current state
  currentWordIndex: number;
  currentWord: Word | null;
  currentPhrase: Word[];
  isPlaying: boolean;
  wpm: number;
  progress: number;
  currentChapter: Chapter | null;
  currentChapterIndex: number;

  // Controls
  play: () => void;
  pause: () => void;
  toggle: () => void;
  setWpm: (wpm: number) => void;
  goToWord: (index: number) => void;
  goToChapter: (chapterIndex: number) => void;
  nextChapter: () => void;
  prevChapter: () => void;
  nextWord: () => void;
  prevWord: () => void;
  reset: () => void;
}

// Set of common function words that should attach forward to the next
// content word rather than dangling at the end of a phrase group.
const FUNCTION_WORDS = new Set([
  'the',
  'a',
  'an',
  'in',
  'on',
  'at',
  'to',
  'of',
  'for',
  'and',
  'but',
  'or',
  'nor',
  'so',
  'yet',
  'is',
  'am',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'not',
  'no',
  'it',
  'its',
  'he',
  'she',
  'we',
  'they',
  'my',
  'his',
  'her',
  'our',
  'your',
  'their',
  'this',
  'that',
  'these',
  'those',
  'with',
  'from',
  'by',
  'as',
  'if',
]);

/**
 * Given a starting word index and a target group size, determine how many
 * words should actually be in this phrase group, respecting natural
 * language boundaries.
 */
function getPhraseBounds(
  words: Word[],
  startIndex: number,
  targetSize: number
): number {
  if (targetSize <= 1) return 1;

  const remaining = words.length - startIndex;
  if (remaining <= 1) return 1;

  const maxSize = Math.min(targetSize, remaining);

  // Check each word in the potential group for sentence/clause breaks
  for (let i = 0; i < maxSize - 1; i++) {
    const w = words[startIndex + i];
    if (!w) break;
    const text = w.word;

    // If this word ends a sentence, end the group here (include this word)
    if (/[.!?]["'\u201D\u2019)]*$/.test(text)) {
      return i + 1;
    }

    // If this word ends a clause, end the group here
    if (/[,;:\u2014\u2013]["'\u201D\u2019)]*$/.test(text)) {
      return i + 1;
    }
  }

  // Check if the last word in the group is a function word — if so, shrink by 1
  if (maxSize > 1) {
    const lastWord = words[startIndex + maxSize - 1];
    if (lastWord) {
      const clean = lastWord.word.toLowerCase().replace(/[^a-z']/g, '');
      if (FUNCTION_WORDS.has(clean)) {
        return maxSize - 1;
      }
    }
  }

  return maxSize;
}

/**
 * Pre-compute all phrase start indices for the entire word list.
 * This guarantees phrases never overlap and words never repeat.
 */
function buildPhraseStarts(words: Word[], phraseSize: number): number[] {
  if (words.length === 0) return [];
  if (phraseSize <= 1) {
    // Single-word mode: every word is a phrase start
    return words.map((_, i) => i);
  }

  const starts: number[] = [];
  let i = 0;
  while (i < words.length) {
    starts.push(i);
    const groupSize = getPhraseBounds(words, i, phraseSize);
    i += groupSize;
  }
  return starts;
}

export function useRSVP({
  words,
  chapters,
  initialWpm = 300,
  pauseOnPunctuation = true,
  phraseSize = 1,
}: UseRSVPOptions): UseRSVPReturn {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpmState] = useState(initialWpm);

  const timerRef = useRef<number | null>(null);

  // Pre-compute phrase start indices — this is the single source of truth
  // for where each phrase begins. No dynamic computation during playback.
  const phraseStarts = useMemo(
    () => buildPhraseStarts(words, phraseSize),
    [words, phraseSize]
  );

  // Find which phrase slot the current word index belongs to
  const currentPhraseSlot = useMemo(() => {
    if (phraseStarts.length === 0) return 0;
    // Find the largest start that is <= currentWordIndex
    let slot = 0;
    for (let i = 0; i < phraseStarts.length; i++) {
      if (phraseStarts[i] <= currentWordIndex) {
        slot = i;
      } else {
        break;
      }
    }
    return slot;
  }, [phraseStarts, currentWordIndex]);

  // Snap currentWordIndex to phrase start if it's not aligned
  const phraseStartIndex = phraseStarts[currentPhraseSlot] ?? 0;

  // Calculate phrase end
  const nextPhraseStart = phraseStarts[currentPhraseSlot + 1] ?? words.length;
  const currentPhrase = useMemo(
    () => words.slice(phraseStartIndex, nextPhraseStart),
    [words, phraseStartIndex, nextPhraseStart]
  );

  // Calculate base delay from WPM
  const getDelay = useCallback(
    (phraseWords: Word[]) => {
      const baseDelay = 60000 / wpm;
      const wordCount = phraseWords.length;
      const maxPause = pauseOnPunctuation
        ? Math.max(...phraseWords.map((w) => w.pause_after))
        : 1;
      return baseDelay * wordCount * maxPause;
    },
    [wpm, pauseOnPunctuation]
  );

  // Get current word (first word in phrase, for backward compat)
  const currentWord = words[phraseStartIndex] || null;

  // Calculate progress (0-100)
  const progress =
    words.length > 0 ? (phraseStartIndex / words.length) * 100 : 0;

  // Find current chapter
  const currentChapterIndex = chapters.reduce((acc, chapter, idx) => {
    if (phraseStartIndex >= chapter.position) {
      return idx;
    }
    return acc;
  }, 0);

  const currentChapter = chapters[currentChapterIndex] || null;

  // Advance to next phrase group (by moving to next phrase slot)
  const advancePhrase = useCallback(() => {
    setCurrentWordIndex((prev) => {
      if (words.length === 0) return prev;

      // Find current slot
      let slot = 0;
      for (let i = 0; i < phraseStarts.length; i++) {
        if (phraseStarts[i] <= prev) slot = i;
        else break;
      }

      const nextSlot = slot + 1;
      if (nextSlot >= phraseStarts.length) {
        setIsPlaying(false);
        return prev;
      }
      return phraseStarts[nextSlot];
    });
  }, [words.length, phraseStarts]);

  // Play/pause controls
  const play = useCallback(() => {
    if (phraseStartIndex >= words.length - 1) {
      setCurrentWordIndex(0);
    }
    setIsPlaying(true);
  }, [phraseStartIndex, words.length]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  // Set WPM
  const setWpm = useCallback((newWpm: number) => {
    setWpmState(Math.max(50, Math.min(1500, newWpm)));
  }, []);

  // Navigation
  const goToWord = useCallback(
    (index: number) => {
      setCurrentWordIndex(Math.max(0, Math.min(words.length - 1, index)));
    },
    [words.length]
  );

  const goToChapter = useCallback(
    (chapterIndex: number) => {
      const chapter = chapters[chapterIndex];
      if (chapter) {
        setCurrentWordIndex(chapter.position);
      }
    },
    [chapters]
  );

  const nextChapter = useCallback(() => {
    if (currentChapterIndex < chapters.length - 1) {
      goToChapter(currentChapterIndex + 1);
    }
  }, [currentChapterIndex, chapters.length, goToChapter]);

  const prevChapter = useCallback(() => {
    if (currentChapterIndex > 0) {
      goToChapter(currentChapterIndex - 1);
    }
  }, [currentChapterIndex, goToChapter]);

  // Word-level skip: jump to next/prev phrase start
  const nextWord = useCallback(() => {
    const nextSlot = currentPhraseSlot + 1;
    if (nextSlot < phraseStarts.length) {
      setCurrentWordIndex(phraseStarts[nextSlot]);
    }
  }, [currentPhraseSlot, phraseStarts]);

  const prevWord = useCallback(() => {
    const prevSlot = currentPhraseSlot - 1;
    if (prevSlot >= 0) {
      setCurrentWordIndex(phraseStarts[prevSlot]);
    }
  }, [currentPhraseSlot, phraseStarts]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentWordIndex(0);
  }, []);

  // Timer effect — uses phrase-aware delay.
  // Uses phraseStartIndex (snapped) as the key dependency to avoid double-fires.
  useEffect(() => {
    if (isPlaying && currentPhrase.length > 0) {
      const delay = getDelay(currentPhrase);
      timerRef.current = window.setTimeout(advancePhrase, delay);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, phraseStartIndex, currentPhrase, getDelay, advancePhrase]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          toggle();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setWpm(wpm + 25);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setWpm(wpm - 25);
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextWord();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevWord();
          break;
        case 'KeyR':
          e.preventDefault();
          reset();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle, setWpm, wpm, nextWord, prevWord, reset]);

  return {
    currentWordIndex: phraseStartIndex,
    currentWord,
    currentPhrase,
    isPlaying,
    wpm,
    progress,
    currentChapter,
    currentChapterIndex,
    play,
    pause,
    toggle,
    setWpm,
    goToWord,
    goToChapter,
    nextChapter,
    prevChapter,
    nextWord,
    prevWord,
    reset,
  };
}
