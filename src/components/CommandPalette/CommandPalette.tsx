import { useState, useEffect, useRef, useMemo } from 'react';
import { useNoteStore } from '../../stores/noteStore';
import { useUIStore } from '../../stores/uiStore';

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  category: string;
  action: () => void;
}

export default function CommandPalette() {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const notes = useNoteStore(s => s.notes);
  const setActiveNote = useNoteStore(s => s.setActiveNote);
  const createNote = useNoteStore(s => s.createNote);
  const getOrCreateDailyNote = useNoteStore(s => s.getOrCreateDailyNote);

  const toggleTheme = useUIStore(s => s.toggleTheme);
  const setEditorMode = useUIStore(s => s.setEditorMode);
  const setRightPanel = useUIStore(s => s.setRightPanel);
  const toggleSidebar = useUIStore(s => s.toggleSidebar);
  const toggleCommandPalette = useUIStore(s => s.toggleCommandPalette);
  const setTemplateModalOpen = useUIStore(s => s.setTemplateModalOpen);
  const setImportExportOpen = useUIStore(s => s.setImportExportOpen);
  const setClipperOpen = useUIStore(s => s.setClipperOpen);
  const setSidebarTab = useUIStore(s => s.setSidebarTab);

  const commands: Command[] = useMemo(() => {
    const cmds: Command[] = [
      { id: 'new-note', label: 'New Note', shortcut: 'Ctrl+N', category: 'Notes', action: () => { createNote('Untitled', 'root', '# Untitled\n\n'); } },
      { id: 'daily-note', label: "Today's Daily Note", shortcut: 'Ctrl+D', category: 'Notes', action: () => { getOrCreateDailyNote(); } },
      { id: 'template', label: 'New from Template', category: 'Notes', action: () => { setTemplateModalOpen(true); } },
      { id: 'toggle-theme', label: 'Toggle Dark/Light Theme', category: 'Appearance', action: toggleTheme },
      { id: 'toggle-sidebar', label: 'Toggle Sidebar', shortcut: 'Ctrl+\\', category: 'Appearance', action: toggleSidebar },
      { id: 'edit-mode', label: 'Switch to Edit Mode', category: 'Editor', action: () => setEditorMode('edit') },
      { id: 'preview-mode', label: 'Switch to Preview Mode', category: 'Editor', action: () => setEditorMode('preview') },
      { id: 'split-mode', label: 'Switch to Split Mode', category: 'Editor', action: () => setEditorMode('split') },
      { id: 'graph-view', label: 'Toggle Graph View', category: 'View', action: () => setRightPanel('graph') },
      { id: 'backlinks', label: 'Toggle Backlinks Panel', category: 'View', action: () => setRightPanel('backlinks') },
      { id: 'ai-panel', label: 'Toggle AI Assistant', category: 'View', action: () => setRightPanel('ai') },
      { id: 'search', label: 'Search Notes', shortcut: 'Ctrl+K', category: 'Navigate', action: () => setSidebarTab('search') },
      { id: 'tags', label: 'View Tags', category: 'Navigate', action: () => setSidebarTab('tags') },
      { id: 'clipper', label: 'X.com Bookmark Clipper', category: 'Tools', action: () => setClipperOpen(true) },
      { id: 'import-export', label: 'Import / Export', category: 'Tools', action: () => setImportExportOpen(true) },
    ];

    // Add note switching commands
    for (const note of notes.slice(0, 50)) {
      cmds.push({
        id: `goto-${note.id}`,
        label: note.title,
        category: 'Go to Note',
        action: () => setActiveNote(note.id),
      });
    }

    return cmds;
  }, [notes]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const lower = query.toLowerCase();
    return commands.filter(c =>
      c.label.toLowerCase().includes(lower) ||
      c.category.toLowerCase().includes(lower)
    );
  }, [commands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const executeCommand = (cmd: Command) => {
    toggleCommandPalette();
    setQuery('');
    cmd.action();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        executeCommand(filtered[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      toggleCommandPalette();
    }
  };

  return (
    <div className="command-palette-overlay" onClick={() => toggleCommandPalette()}>
      <div className="command-palette" onClick={e => e.stopPropagation()}>
        <div className="command-palette-input-wrapper">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            className="command-palette-input"
            placeholder="Type a command or note name..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="command-palette-list">
          {filtered.length === 0 && (
            <div className="command-palette-empty">No matching commands</div>
          )}
          {filtered.slice(0, 20).map((cmd, i) => (
            <div
              key={cmd.id}
              className={`command-palette-item ${i === selectedIndex ? 'selected' : ''}`}
              onClick={() => executeCommand(cmd)}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span className="command-category">{cmd.category}</span>
              <span className="command-label">{cmd.label}</span>
              {cmd.shortcut && (
                <span className="command-shortcut">{cmd.shortcut}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
