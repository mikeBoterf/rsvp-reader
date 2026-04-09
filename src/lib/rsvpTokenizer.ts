import { Chapter, Word } from '../hooks/useRSVP';

export interface BrowserParseResult {
  title: string;
  author: string;
  format: string;
  chapters: Chapter[];
  words: Word[];
  wordCount: number;
  browserText?: string;
}

interface BuildResultInput {
  title: string;
  author: string;
  format: string;
  text: string;
  chapters?: Chapter[];
}

export function tokenizeForRsvp(text: string): Word[] {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => ({
      word,
      orp_index: getOrpIndex(word),
      pause_after: getPauseAfter(word),
    }));
}

export function buildBrowserParseResult({
  title,
  author,
  format,
  text,
  chapters,
}: BuildResultInput): BrowserParseResult {
  const words = tokenizeForRsvp(text);
  return {
    title,
    author,
    format,
    chapters: chapters?.length ? chapters : [{ title: 'Start', position: 0 }],
    words,
    wordCount: words.length,
    browserText: text,
  };
}

function getOrpIndex(word: string): number {
  const clean = word.replace(/[^\w]/g, '');
  const len = clean.length;
  if (len <= 1) return 0;
  if (len <= 5) return 1;
  if (len <= 9) return 2;
  if (len <= 13) return 3;
  return 4;
}

function getPauseAfter(word: string): number {
  if (/[.!?]["'”)’]*$/.test(word)) return 2;
  if (/[,;:—–]["'”)’]*$/.test(word)) return 1.5;
  if (/[-—]["'”)’]*$/.test(word)) return 1.3;
  return 1;
}
