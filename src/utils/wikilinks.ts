// Parse [[wikilinks]] from note content
const WIKILINK_REGEX = /\[\[([^\]]+)\]\]/g;

export function extractWikilinks(content: string): string[] {
  const links: string[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(WIKILINK_REGEX.source, 'g');
  while ((match = regex.exec(content)) !== null) {
    links.push(match[1].trim());
  }
  return [...new Set(links)];
}

export function extractTags(content: string): string[] {
  // Match #tag but not inside code blocks or URLs
  const TAG_REGEX = /(?:^|\s)#([a-zA-Z][a-zA-Z0-9_-]*)/g;
  const tags: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = TAG_REGEX.exec(content)) !== null) {
    tags.push(match[1].toLowerCase());
  }
  return [...new Set(tags)];
}

export interface BacklinkMap {
  [noteTitle: string]: string[]; // noteTitle -> array of note IDs that link to it
}

export function buildBacklinkMap(
  notes: { id: string; title: string; content: string }[]
): BacklinkMap {
  const map: BacklinkMap = {};

  for (const note of notes) {
    const links = extractWikilinks(note.content);
    for (const linkedTitle of links) {
      const key = linkedTitle.toLowerCase();
      if (!map[key]) {
        map[key] = [];
      }
      if (!map[key].includes(note.id)) {
        map[key].push(note.id);
      }
    }
  }

  return map;
}

// Build a graph structure for D3 visualization
export interface GraphNode {
  id: string;
  title: string;
  group: number;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export function buildGraphData(
  notes: { id: string; title: string; content: string }[]
): GraphData {
  const titleToId = new Map<string, string>();
  for (const note of notes) {
    titleToId.set(note.title.toLowerCase(), note.id);
  }

  const nodes: GraphNode[] = notes.map((n, i) => ({
    id: n.id,
    title: n.title,
    group: i % 6,
  }));

  const links: GraphLink[] = [];
  const linkSet = new Set<string>();

  for (const note of notes) {
    const wikilinks = extractWikilinks(note.content);
    for (const link of wikilinks) {
      const targetId = titleToId.get(link.toLowerCase());
      if (targetId && targetId !== note.id) {
        const key = [note.id, targetId].sort().join('->');
        if (!linkSet.has(key)) {
          linkSet.add(key);
          links.push({ source: note.id, target: targetId });
        }
      }
    }
  }

  return { nodes, links };
}
