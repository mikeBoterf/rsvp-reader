import ePub from 'epubjs';
import { Chapter } from '../hooks/useRSVP';
import { countWords, htmlToText } from './ebookDom';
import { buildBrowserParseResult } from './rsvpTokenizer';

export async function parseBrowserEpub(file: File) {
  const book = ePub(await file.arrayBuffer());
  await book.ready;

  const metadata = await book.loaded.metadata.catch(
    () => ({}) as Record<string, string>
  );
  const items = (
    book.spine as unknown as {
      spineItems: Array<{
        idref?: string;
        render: (load: unknown) => Promise<string>;
        unload: () => void;
      }>;
    }
  ).spineItems;
  const chapters: Chapter[] = [];
  const parts: string[] = [];
  let position = 0;

  for (const [index, item] of items.entries()) {
    const html = await item.render(book.load.bind(book));
    const text = htmlToText(html);
    item.unload();
    if (!text) continue;
    chapters.push({ title: item.idref || `Chapter ${index + 1}`, position });
    parts.push(text);
    position += countWords(text);
  }

  book.destroy();
  return buildBrowserParseResult({
    title: metadata.title || stripExtension(file.name),
    author: metadata.creator || 'Unknown Author',
    format: 'epub',
    text: parts.join('\n\n'),
    chapters,
  });
}

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '') || fileName;
}
