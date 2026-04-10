import { initKf8File, initMobiFile } from '@lingo-reader/mobi-parser';
import { Chapter } from '../hooks/useRSVP';
import { countWords, htmlToText } from './ebookDom';
import { buildBrowserParseResult } from './rsvpTokenizer';

export async function parseBrowserMobi(file: File) {
  const parser = file.name.toLowerCase().endsWith('.azw3')
    ? initKf8File
    : initMobiFile;
  const book = await parser(file);
  const metadata = book.getMetadata?.() ?? {};
  const spine = book.getSpine();
  const chapters: Chapter[] = [];
  const parts: string[] = [];
  let position = 0;

  for (const [index, item] of spine.entries()) {
    const chapter = book.loadChapter(item.id);
    const fallbackHtml = 'text' in item ? item.text : '';
    const text = htmlToText(chapter?.html ?? fallbackHtml);
    if (!text) continue;
    chapters.push({ title: `Chapter ${index + 1}`, position });
    parts.push(text);
    position += countWords(text);
  }

  book.destroy?.();
  return buildBrowserParseResult({
    title: metadata.title || stripExtension(file.name),
    author: metadata.author?.join?.(', ') || 'Unknown Author',
    format: getExtension(file.name),
    text: parts.join('\n\n'),
    chapters,
  });
}

function getExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? 'mobi';
}

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '') || fileName;
}
