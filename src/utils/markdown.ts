// Markdown utility functions

export function getTitle(content: string): string {
  // Extract title from first # heading
  const match = content.match(/^#\s+(.+)$/m);
  if (match) return match[1].trim();

  // Fall back to first non-empty line
  const firstLine = content.split('\n').find(l => l.trim());
  if (firstLine) return firstLine.slice(0, 60).trim();

  return 'Untitled';
}

export function getExcerpt(content: string, maxLength = 120): string {
  // Strip markdown formatting for excerpt
  const plain = content
    .replace(/^#+\s+/gm, '') // headings
    .replace(/\*\*(.+?)\*\*/g, '$1') // bold
    .replace(/\*(.+?)\*/g, '$1') // italic
    .replace(/`(.+?)`/g, '$1') // inline code
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // links
    .replace(/\[\[(.+?)\]\]/g, '$1') // wikilinks
    .replace(/^[-*]\s+/gm, '') // list items
    .replace(/^\d+\.\s+/gm, '') // ordered list items
    .replace(/^>\s+/gm, '') // blockquotes
    .replace(/\n+/g, ' ')
    .trim();

  return plain.length > maxLength ? plain.slice(0, maxLength) + '...' : plain;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getDailyNoteTitle(date?: Date): string {
  const d = date || new Date();
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getDailyNoteId(date?: Date): string {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `daily-${year}-${month}-${day}`;
}

// Word count
export function wordCount(content: string): number {
  return content.split(/\s+/).filter(w => w.length > 0).length;
}

// Reading time estimate (avg 200 wpm)
export function readingTime(content: string): string {
  const words = wordCount(content);
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}
