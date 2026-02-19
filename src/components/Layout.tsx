import { useEffect, useCallback } from 'react';
import Sidebar from './Sidebar/Sidebar';
import SplitView from './Editor/SplitView';
import GraphView from './GraphView/GraphView';
import Summarizer from './AISummarizer/Summarizer';
import CommandPalette from './CommandPalette/CommandPalette';
import TemplateModal from './Templates/TemplateModal';
import ImportExport from './ImportExport/ImportExport';
import XClipper from './Clipper/XClipper';
import DailyNoteButton from './DailyNote/DailyNote';
import { useNoteStore } from '../stores/noteStore';
import { useUIStore } from '../stores/uiStore';
import { buildBacklinkMap } from '../utils/wikilinks';

export default function Layout() {
  const sidebarOpen = useUIStore(s => s.sidebarOpen);
  const rightPanel = useUIStore(s => s.rightPanel);
  const commandPaletteOpen = useUIStore(s => s.commandPaletteOpen);
  const templateModalOpen = useUIStore(s => s.templateModalOpen);
  const importExportOpen = useUIStore(s => s.importExportOpen);
  const clipperOpen = useUIStore(s => s.clipperOpen);
  const theme = useUIStore(s => s.theme);
  const toggleTheme = useUIStore(s => s.toggleTheme);
  const toggleSidebar = useUIStore(s => s.toggleSidebar);
  const toggleCommandPalette = useUIStore(s => s.toggleCommandPalette);
  const setRightPanel = useUIStore(s => s.setRightPanel);
  const setEditorMode = useUIStore(s => s.setEditorMode);
  const setClipperOpen = useUIStore(s => s.setClipperOpen);
  const setSidebarTab = useUIStore(s => s.setSidebarTab);

  const notes = useNoteStore(s => s.notes);
  const activeNoteId = useNoteStore(s => s.activeNoteId);
  const setActiveNote = useNoteStore(s => s.setActiveNote);
  const createNote = useNoteStore(s => s.createNote);
  const getOrCreateDailyNote = useNoteStore(s => s.getOrCreateDailyNote);

  const activeNote = notes.find(n => n.id === activeNoteId);

  // Build backlinks for active note
  const backlinkMap = buildBacklinkMap(notes);
  const backlinks = activeNote
    ? (backlinkMap[activeNote.title.toLowerCase()] || [])
        .map(id => notes.find(n => n.id === id))
        .filter(Boolean)
    : [];

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isCtrl = e.ctrlKey || e.metaKey;

    if (isCtrl && e.key === 'p') {
      e.preventDefault();
      toggleCommandPalette();
    } else if (isCtrl && e.key === 'k') {
      e.preventDefault();
      setSidebarTab('search');
    } else if (isCtrl && e.key === 'n') {
      e.preventDefault();
      createNote('Untitled', 'root', '# Untitled\n\n');
    } else if (isCtrl && e.key === 'd') {
      e.preventDefault();
      getOrCreateDailyNote();
    } else if (isCtrl && e.key === 'e') {
      e.preventDefault();
      setEditorMode(useUIStore.getState().editorMode === 'edit' ? 'preview' : 'edit');
    } else if (isCtrl && e.key === '\\') {
      e.preventDefault();
      toggleSidebar();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Set theme on html element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="app-layout">
      {/* Title bar */}
      <header className="titlebar">
        <div className="titlebar-left">
          <button className="icon-btn" onClick={toggleSidebar} title="Toggle Sidebar (Ctrl+\\)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="app-name">NoteGraph</span>
        </div>
        <div className="titlebar-center">
          <button className="search-trigger" onClick={() => { setSidebarTab('search'); }} title="Search (Ctrl+K)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>Search notes...</span>
            <kbd>Ctrl+K</kbd>
          </button>
        </div>
        <div className="titlebar-right">
          <button
            className="icon-btn"
            onClick={() => setClipperOpen(true)}
            title="X.com Clipper"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4l11.733 16h4.267l-11.733-16zM4 20l6.768-6.768M20 4l-6.768 6.768" />
            </svg>
          </button>
          <button
            className={`icon-btn ${rightPanel === 'graph' ? 'active' : ''}`}
            onClick={() => setRightPanel('graph')}
            title="Graph View"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="6" cy="6" r="3" />
              <circle cx="18" cy="18" r="3" />
              <circle cx="18" cy="6" r="3" />
              <line x1="8.5" y1="7.5" x2="15.5" y2="16.5" />
              <line x1="15.5" y1="7.5" x2="8.5" y2="7.5" />
            </svg>
          </button>
          <button
            className={`icon-btn ${rightPanel === 'backlinks' ? 'active' : ''}`}
            onClick={() => setRightPanel('backlinks')}
            title="Backlinks"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </button>
          <button
            className={`icon-btn ${rightPanel === 'ai' ? 'active' : ''}`}
            onClick={() => setRightPanel('ai')}
            title="AI Assistant"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.57-3.25 3.92L12 22" />
              <path d="M12 2a4 4 0 0 0-4 4c0 1.95 1.4 3.57 3.25 3.92" />
              <line x1="4.5" y1="9" x2="19.5" y2="9" />
            </svg>
          </button>
          <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="main-area">
        <aside className={`sidebar-container ${sidebarOpen ? '' : 'collapsed'}`}>
          <Sidebar />
          <div className="sidebar-footer">
            <DailyNoteButton />
          </div>
        </aside>

        <main className="editor-area">
          <SplitView />
        </main>

        {rightPanel !== 'none' && (
          <aside className="right-panel">
            {rightPanel === 'graph' && <GraphView />}
            {rightPanel === 'backlinks' && (
              <div className="backlinks-panel">
                <div className="backlinks-header">
                  <span>Backlinks</span>
                  <span className="backlinks-count">{backlinks.length}</span>
                </div>
                {backlinks.length === 0 ? (
                  <div className="backlinks-empty">
                    No other notes link to this note yet.
                    <br />
                    Use [[{activeNote?.title}]] in another note.
                  </div>
                ) : (
                  <div className="backlinks-list">
                    {backlinks.map(note => note && (
                      <div
                        key={note.id}
                        className="backlink-item"
                        onClick={() => setActiveNote(note.id)}
                      >
                        <span className="backlink-title">{note.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {rightPanel === 'ai' && <Summarizer />}
          </aside>
        )}
      </div>

      {/* Modals */}
      {commandPaletteOpen && <CommandPalette />}
      {templateModalOpen && <TemplateModal />}
      {importExportOpen && <ImportExport />}
      {clipperOpen && <XClipper />}
    </div>
  );
}
