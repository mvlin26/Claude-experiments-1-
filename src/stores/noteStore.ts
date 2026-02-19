import { create } from 'zustand';
import { db, type Note, type Folder, type Template, type ClippedBookmark } from '../db/database';
import { v4 as uuid } from 'uuid';
import { extractTags } from '../utils/wikilinks';
import { getDailyNoteId, getDailyNoteTitle } from '../utils/markdown';

interface NoteStore {
  notes: Note[];
  folders: Folder[];
  templates: Template[];
  bookmarks: ClippedBookmark[];
  activeNoteId: string | null;
  isLoading: boolean;

  // Actions
  loadAll: () => Promise<void>;
  setActiveNote: (id: string | null) => void;
  createNote: (title: string, folderId: string, content?: string) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'folder' | 'isPinned'>>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  createFolder: (name: string, parentId: string | null) => Promise<Folder>;
  deleteFolder: (id: string) => Promise<void>;
  renameFolder: (id: string, name: string) => Promise<void>;
  getOrCreateDailyNote: (date?: Date) => Promise<Note>;

  // Templates
  createTemplate: (name: string, content: string) => Promise<Template>;
  deleteTemplate: (id: string) => Promise<void>;

  // Bookmarks
  addBookmark: (bookmark: Omit<ClippedBookmark, 'id'>) => Promise<ClippedBookmark>;
  updateBookmark: (id: string, updates: Partial<ClippedBookmark>) => Promise<void>;
  deleteBookmark: (id: string) => Promise<void>;
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  folders: [],
  templates: [],
  bookmarks: [],
  activeNoteId: null,
  isLoading: true,

  loadAll: async () => {
    const [notes, folders, templates, bookmarks] = await Promise.all([
      db.notes.orderBy('updatedAt').reverse().toArray(),
      db.folders.toArray(),
      db.templates.toArray(),
      db.bookmarks.orderBy('clippedAt').reverse().toArray(),
    ]);
    set({ notes, folders, templates, bookmarks, isLoading: false });
  },

  setActiveNote: (id) => set({ activeNoteId: id }),

  createNote: async (title, folderId, content = '') => {
    const note: Note = {
      id: uuid(),
      title,
      content,
      folder: folderId,
      tags: extractTags(content),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDaily: false,
      isPinned: false,
    };
    await db.notes.add(note);
    set(s => ({ notes: [note, ...s.notes], activeNoteId: note.id }));
    return note;
  },

  updateNote: async (id, updates) => {
    const finalUpdates: Partial<Note> = { ...updates, updatedAt: Date.now() };
    if (updates.content !== undefined) {
      finalUpdates.tags = extractTags(updates.content);
    }
    await db.notes.update(id, finalUpdates);
    set(s => ({
      notes: s.notes.map(n =>
        n.id === id ? { ...n, ...finalUpdates } : n
      ),
    }));
  },

  deleteNote: async (id) => {
    await db.notes.delete(id);
    set(s => ({
      notes: s.notes.filter(n => n.id !== id),
      activeNoteId: s.activeNoteId === id ? null : s.activeNoteId,
    }));
  },

  createFolder: async (name, parentId) => {
    const folder: Folder = {
      id: uuid(),
      name,
      parentId,
      createdAt: Date.now(),
    };
    await db.folders.add(folder);
    set(s => ({ folders: [...s.folders, folder] }));
    return folder;
  },

  deleteFolder: async (id) => {
    // Move notes in this folder to root
    const notesInFolder = get().notes.filter(n => n.folder === id);
    for (const note of notesInFolder) {
      await db.notes.update(note.id, { folder: 'root' });
    }
    // Delete child folders recursively
    const childFolders = get().folders.filter(f => f.parentId === id);
    for (const child of childFolders) {
      await get().deleteFolder(child.id);
    }
    await db.folders.delete(id);
    set(s => ({
      folders: s.folders.filter(f => f.id !== id),
      notes: s.notes.map(n => n.folder === id ? { ...n, folder: 'root' } : n),
    }));
  },

  renameFolder: async (id, name) => {
    await db.folders.update(id, { name });
    set(s => ({
      folders: s.folders.map(f => f.id === id ? { ...f, name } : f),
    }));
  },

  getOrCreateDailyNote: async (date?: Date) => {
    const dailyId = getDailyNoteId(date);
    const existing = get().notes.find(n => n.id === dailyId);
    if (existing) {
      set({ activeNoteId: existing.id });
      return existing;
    }

    const title = getDailyNoteTitle(date);
    const d = date || new Date();
    const content = `# ${title}

## Journal


## Tasks
- [ ]

## Notes

`;
    const note: Note = {
      id: dailyId,
      title,
      content,
      folder: 'root',
      tags: ['daily'],
      createdAt: d.getTime(),
      updatedAt: d.getTime(),
      isDaily: true,
      isPinned: false,
    };
    await db.notes.add(note);
    set(s => ({ notes: [note, ...s.notes], activeNoteId: note.id }));
    return note;
  },

  createTemplate: async (name, content) => {
    const template: Template = {
      id: uuid(),
      name,
      content,
      createdAt: Date.now(),
    };
    await db.templates.add(template);
    set(s => ({ templates: [...s.templates, template] }));
    return template;
  },

  deleteTemplate: async (id) => {
    await db.templates.delete(id);
    set(s => ({ templates: s.templates.filter(t => t.id !== id) }));
  },

  addBookmark: async (bookmark) => {
    const full: ClippedBookmark = { ...bookmark, id: uuid() };
    await db.bookmarks.add(full);
    set(s => ({ bookmarks: [full, ...s.bookmarks] }));
    return full;
  },

  updateBookmark: async (id, updates) => {
    await db.bookmarks.update(id, updates);
    set(s => ({
      bookmarks: s.bookmarks.map(b => b.id === id ? { ...b, ...updates } : b),
    }));
  },

  deleteBookmark: async (id) => {
    await db.bookmarks.delete(id);
    set(s => ({ bookmarks: s.bookmarks.filter(b => b.id !== id) }));
  },
}));
