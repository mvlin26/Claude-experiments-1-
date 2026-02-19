import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { db, type Note, type Folder, type Template } from '../db/database';
import { v4 as uuid } from 'uuid';

export interface VaultExport {
  version: 1;
  exportedAt: number;
  notes: Note[];
  folders: Folder[];
  templates: Template[];
}

// Export entire vault as JSON
export async function exportAsJSON() {
  const [notes, folders, templates] = await Promise.all([
    db.notes.toArray(),
    db.folders.toArray(),
    db.templates.toArray(),
  ]);

  const data: VaultExport = {
    version: 1,
    exportedAt: Date.now(),
    notes,
    folders,
    templates,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  saveAs(blob, `notegraph-export-${new Date().toISOString().slice(0, 10)}.json`);
}

// Export as Markdown zip
export async function exportAsMarkdownZip() {
  const [notes, folders] = await Promise.all([
    db.notes.toArray(),
    db.folders.toArray(),
  ]);

  const folderMap = new Map<string, string>();
  for (const f of folders) {
    folderMap.set(f.id, f.name);
  }

  const zip = new JSZip();

  for (const note of notes) {
    const folderName = folderMap.get(note.folder) || 'Notes';
    const safeName = note.title.replace(/[/\\?%*:|"<>]/g, '-');
    zip.file(`${folderName}/${safeName}.md`, note.content);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `notegraph-markdown-${new Date().toISOString().slice(0, 10)}.zip`);
}

// Import from JSON
export async function importFromJSON(file: File): Promise<number> {
  const text = await file.text();
  const data: VaultExport = JSON.parse(text);

  if (data.version !== 1) throw new Error('Unsupported export version');

  let imported = 0;

  // Import folders first
  for (const folder of data.folders) {
    const existing = await db.folders.get(folder.id);
    if (!existing) {
      await db.folders.add(folder);
    }
  }

  // Import notes
  for (const note of data.notes) {
    const existing = await db.notes.get(note.id);
    if (!existing) {
      await db.notes.add(note);
      imported++;
    } else if (note.updatedAt > existing.updatedAt) {
      await db.notes.put(note);
      imported++;
    }
  }

  // Import templates
  for (const template of data.templates) {
    const existing = await db.templates.get(template.id);
    if (!existing) {
      await db.templates.add(template);
    }
  }

  return imported;
}

// Import markdown files from zip
export async function importFromMarkdownZip(file: File): Promise<number> {
  const zip = await JSZip.loadAsync(file);
  let imported = 0;
  const now = Date.now();

  // Ensure root folder exists
  const rootFolder = await db.folders.get('root');
  if (!rootFolder) {
    await db.folders.add({
      id: 'root',
      name: 'Notes',
      parentId: null,
      createdAt: now,
    });
  }

  const files = Object.keys(zip.files).filter(name => name.endsWith('.md'));

  for (const filePath of files) {
    const content = await zip.files[filePath].async('text');
    const fileName = filePath.split('/').pop()?.replace('.md', '') || 'Untitled';

    // Check if note with same title already exists
    const existing = await db.notes.where('title').equals(fileName).first();
    if (!existing) {
      await db.notes.add({
        id: uuid(),
        title: fileName,
        content,
        folder: 'root',
        tags: [],
        createdAt: now,
        updatedAt: now,
        isDaily: false,
        isPinned: false,
      });
      imported++;
    }
  }

  return imported;
}
