export function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc
    .querySelectorAll('script,style,noscript')
    .forEach((node) => node.remove());
  return (doc.body?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
