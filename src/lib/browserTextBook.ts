import { buildBrowserParseResult } from './rsvpTokenizer';

export async function parseBrowserTextBook(file: File) {
  const text = await file.text();
  if (!text.trim()) {
    throw new Error('The selected text file is empty.');
  }

  return buildBrowserParseResult({
    title: stripExtension(file.name),
    author: 'Local File',
    format: getExtension(file.name),
    text,
  });
}

function getExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? 'txt';
}

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '') || fileName;
}
