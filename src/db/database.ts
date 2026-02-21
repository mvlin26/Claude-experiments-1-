import Dexie, { type Table } from 'dexie';

export interface Note {
  id: string;
  title: string;
  content: string;
  folder: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  isDaily: boolean;
  isPinned: boolean;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
}

export interface Template {
  id: string;
  name: string;
  content: string;
  createdAt: number;
}

export interface ClippedBookmark {
  id: string;
  url: string;
  author: string;
  content: string;
  clippedAt: number;
  noteId: string | null;
  summary: string | null;
}

export interface Attachment {
  id: string;
  noteId: string;
  name: string;
  mimeType: string;
  data: string; // base64 data URL
  createdAt: number;
}

class NoteGraphDB extends Dexie {
  notes!: Table<Note>;
  folders!: Table<Folder>;
  templates!: Table<Template>;
  bookmarks!: Table<ClippedBookmark>;
  attachments!: Table<Attachment>;

  constructor() {
    super('NoteGraphDB');
    this.version(1).stores({
      notes: 'id, title, folder, *tags, createdAt, updatedAt, isDaily',
      folders: 'id, name, parentId',
      templates: 'id, name',
      bookmarks: 'id, url, clippedAt, noteId',
    });
    this.version(2).stores({
      notes: 'id, title, folder, *tags, createdAt, updatedAt, isDaily',
      folders: 'id, name, parentId',
      templates: 'id, name',
      bookmarks: 'id, url, clippedAt, noteId',
      attachments: 'id, noteId, createdAt',
    });
  }
}

export const db = new NoteGraphDB();

// Seed default data on first load
export async function seedDefaults() {
  const noteCount = await db.notes.count();
  if (noteCount === 0) {
    const now = Date.now();
    await db.folders.add({
      id: 'root',
      name: 'Notes',
      parentId: null,
      createdAt: now,
    });

    await db.notes.add({
      id: 'welcome',
      title: 'Welcome to NoteGraph',
      content: `# Welcome to NoteGraph 🎉

This is your personal knowledge base. Here's what you can do:

## Core Features
- **Write in Markdown** with live preview
- **Link notes** using [[wikilinks]] — try linking to [[Getting Started]]
- **View your knowledge graph** to see how notes connect
- **Search everything** with full-text search (Ctrl+K)
- **Command palette** for quick actions (Ctrl+P)

## Extra Features
- **Daily Notes** — auto-generated journal entries
- **Tags** — organize with #tags
- **Templates** — reusable note scaffolds
- **X.com Clipper** — save tweets as notes
- **AI Summarizer** — get AI-powered summaries
- **Import/Export** — backup and restore your vault

## Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| Ctrl+P | Command Palette |
| Ctrl+K | Search Notes |
| Ctrl+N | New Note |
| Ctrl+D | Today's Daily Note |
| Ctrl+E | Toggle Edit/Preview |
| Ctrl+\\ | Toggle Sidebar |

Happy note-taking!
`,
      folder: 'root',
      tags: ['welcome', 'guide'],
      createdAt: now,
      updatedAt: now,
      isDaily: false,
      isPinned: true,
    });

    await db.notes.add({
      id: 'getting-started',
      title: 'Getting Started',
      content: `# Getting Started

## Creating Notes
Click the **+** button in the sidebar or press **Ctrl+N** to create a new note.

## Linking Notes
Use [[wikilinks]] to link between notes. Type \`[[\` and start typing to autocomplete.

This note is linked from [[Welcome to NoteGraph]].

## Organizing
- Create **folders** to organize your notes
- Use **#tags** like #tutorial #basics to categorize
- **Pin** important notes for quick access

## Tips
- Use the **graph view** to discover connections
- The **daily note** is great for journaling
- Try the **AI summarizer** on long notes
`,
      folder: 'root',
      tags: ['tutorial', 'basics'],
      createdAt: now - 1000,
      updatedAt: now - 1000,
      isDaily: false,
      isPinned: false,
    });

    await db.templates.bulkAdd([
      {
        id: 'meeting-notes',
        name: 'Meeting Notes',
        content: `# Meeting Notes — {{date}}

## Attendees
-

## Agenda
1.

## Discussion


## Action Items
- [ ]

## Next Meeting

`,
        createdAt: now,
      },
      {
        id: 'project-plan',
        name: 'Project Plan',
        content: `# Project: {{title}}

## Overview


## Goals
-

## Timeline
| Phase | Target Date | Status |
|-------|------------|--------|
| Planning | | |
| Development | | |
| Testing | | |
| Launch | | |

## Resources


## Notes

`,
        createdAt: now,
      },
      {
        id: 'book-notes',
        name: 'Book Notes',
        content: `# Book: {{title}}

**Author:**
**Rating:** ⭐⭐⭐⭐⭐

## Summary


## Key Takeaways
1.

## Favorite Quotes
>

## How It Applies


#books #reading
`,
        createdAt: now,
      },
    ]);
  }
}
