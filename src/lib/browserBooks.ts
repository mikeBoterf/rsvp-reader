import { parseBrowserEpub } from './browserEpub';
import { parseBrowserMobi } from './browserMobi';
import { parseBrowserTextBook } from './browserTextBook';

const WEB_EXTENSIONS = new Set(['txt', 'text', 'epub', 'mobi', 'azw', 'azw3']);

export async function parseBrowserFile(file: File) {
  const extension = getExtension(file.name);
  if (!WEB_EXTENSIONS.has(extension)) {
    throw new Error(
      'Web mode supports TXT, EPUB, MOBI, AZW, and AZW3. Use desktop mode for PDF.'
    );
  }

  if (extension === 'epub') return parseBrowserEpub(file);
  if (['mobi', 'azw', 'azw3'].includes(extension))
    return parseBrowserMobi(file);
  return parseBrowserTextBook(file);
}

function getExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}
