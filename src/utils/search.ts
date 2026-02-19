import type { Note } from '../db/database';

export interface SearchResult {
  note: Note;
  matches: SearchMatch[];
  score: number;
}

export interface SearchMatch {
  line: number;
  text: string;
  start: number;
  end: number;
}

export function searchNotes(notes: Note[], query: string): SearchResult[] {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  const terms = lowerQuery.split(/\s+/).filter(Boolean);

  const results: SearchResult[] = [];

  for (const note of notes) {
    const lowerTitle = note.title.toLowerCase();
    const lowerContent = note.content.toLowerCase();
    const matches: SearchMatch[] = [];
    let score = 0;

    // Title match (highest weight)
    for (const term of terms) {
      if (lowerTitle.includes(term)) {
        score += 10;
        if (lowerTitle === lowerQuery) score += 20;
      }
    }

    // Content matches
    const lines = note.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const lowerLine = lines[i].toLowerCase();
      for (const term of terms) {
        const idx = lowerLine.indexOf(term);
        if (idx !== -1) {
          score += 1;
          matches.push({
            line: i + 1,
            text: lines[i],
            start: idx,
            end: idx + term.length,
          });
        }
      }
    }

    // Tag match
    for (const term of terms) {
      if (note.tags.some(t => t.toLowerCase().includes(term))) {
        score += 5;
      }
    }

    if (score > 0) {
      results.push({ note, matches: matches.slice(0, 5), score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}
