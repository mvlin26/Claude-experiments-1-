import { type JSX, useState } from 'react';
import { useNoteStore } from '../../stores/noteStore';
import { useUIStore, type SidebarTab } from '../../stores/uiStore';
import FolderTree from './FolderTree';
import { searchNotes } from '../../utils/search';

export default function Sidebar() {
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [showNewNote, setShowNewNote] = useState(false);

  const notes = useNoteStore(s => s.notes);
  const createNote = useNoteStore(s => s.createNote);
  const createFolder = useNoteStore(s => s.createFolder);
  const setActiveNote = useNoteStore(s => s.setActiveNote);
  const bookmarks = useNoteStore(s => s.bookmarks);

  const sidebarTab = useUIStore(s => s.sidebarTab);
  const setSidebarTab = useUIStore(s => s.setSidebarTab);
  const searchQuery = useUIStore(s => s.searchQuery);
  const setSearchQuery = useUIStore(s => s.setSearchQuery);

  const searchResults = searchQuery.trim() ? searchNotes(notes, searchQuery) : [];

  // Collect all tags
  const allTags = new Map<string, number>();
  for (const note of notes) {
    for (const tag of note.tags) {
      allTags.set(tag, (allTags.get(tag) || 0) + 1);
    }
  }
  const sortedTags = [...allTags.entries()].sort((a, b) => b[1] - a[1]);

  const handleCreateNote = () => {
    if (newNoteTitle.trim()) {
      createNote(newNoteTitle.trim(), 'root', `# ${newNoteTitle.trim()}\n\n`);
      setNewNoteTitle('');
      setShowNewNote(false);
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim(), 'root');
      setNewFolderName('');
      setShowNewFolder(false);
    }
  };

  const tabs: { id: SidebarTab; label: string; icon: JSX.Element }[] = [
    {
      id: 'files',
      label: 'Files',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      id: 'search',
      label: 'Search',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
    },
    {
      id: 'tags',
      label: 'Tags',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      ),
    },
    {
      id: 'bookmarks',
      label: 'Clips',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`sidebar-tab ${sidebarTab === tab.id ? 'active' : ''}`}
            onClick={() => setSidebarTab(tab.id)}
            title={tab.label}
          >
            {tab.icon}
          </button>
        ))}
      </div>

      <div className="sidebar-content">
        {sidebarTab === 'files' && (
          <>
            <div className="sidebar-header">
              <span className="sidebar-title">Explorer</span>
              <div className="sidebar-actions">
                <button
                  className="icon-btn"
                  onClick={() => setShowNewNote(!showNewNote)}
                  title="New Note"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                </button>
                <button
                  className="icon-btn"
                  onClick={() => setShowNewFolder(!showNewFolder)}
                  title="New Folder"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    <line x1="12" y1="11" x2="12" y2="17" />
                    <line x1="9" y1="14" x2="15" y2="14" />
                  </svg>
                </button>
              </div>
            </div>

            {showNewNote && (
              <div className="inline-form">
                <input
                  className="inline-input"
                  placeholder="Note title..."
                  value={newNoteTitle}
                  onChange={e => setNewNoteTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateNote();
                    if (e.key === 'Escape') setShowNewNote(false);
                  }}
                  autoFocus
                />
                <button className="inline-btn" onClick={handleCreateNote}>+</button>
              </div>
            )}

            {showNewFolder && (
              <div className="inline-form">
                <input
                  className="inline-input"
                  placeholder="Folder name..."
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateFolder();
                    if (e.key === 'Escape') setShowNewFolder(false);
                  }}
                  autoFocus
                />
                <button className="inline-btn" onClick={handleCreateFolder}>+</button>
              </div>
            )}

            <div className="folder-tree-root">
              <FolderTree folderId="root" />
            </div>
          </>
        )}

        {sidebarTab === 'search' && (
          <>
            <div className="sidebar-header">
              <span className="sidebar-title">Search</span>
            </div>
            <div className="search-container">
              <input
                className="search-input"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className="search-results">
              {searchResults.length === 0 && searchQuery.trim() && (
                <div className="search-empty">No results found</div>
              )}
              {searchResults.map(r => (
                <div
                  key={r.note.id}
                  className="search-result-item"
                  onClick={() => setActiveNote(r.note.id)}
                >
                  <div className="search-result-title">{r.note.title}</div>
                  {r.matches.slice(0, 2).map((m, i) => (
                    <div key={i} className="search-result-match">
                      <span className="match-line">L{m.line}</span>
                      <span className="match-text">{m.text.slice(0, 100)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}

        {sidebarTab === 'tags' && (
          <>
            <div className="sidebar-header">
              <span className="sidebar-title">Tags</span>
            </div>
            <div className="tag-cloud">
              {sortedTags.length === 0 && (
                <div className="search-empty">No tags yet. Use #tag in your notes.</div>
              )}
              {sortedTags.map(([tag, count]) => (
                <button
                  key={tag}
                  className="tag-chip"
                  onClick={() => {
                    setSearchQuery(`#${tag}`);
                    setSidebarTab('search');
                  }}
                >
                  #{tag} <span className="tag-count">{count}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {sidebarTab === 'bookmarks' && (
          <>
            <div className="sidebar-header">
              <span className="sidebar-title">Clipped Bookmarks</span>
            </div>
            <div className="bookmarks-list">
              {bookmarks.length === 0 && (
                <div className="search-empty">No clipped bookmarks yet. Use the clipper to save tweets.</div>
              )}
              {bookmarks.map(bm => (
                <div key={bm.id} className="bookmark-item">
                  <div className="bookmark-author">@{bm.author}</div>
                  <div className="bookmark-content">{bm.content.slice(0, 140)}</div>
                  {bm.summary && (
                    <div className="bookmark-summary">AI: {bm.summary.slice(0, 100)}</div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
