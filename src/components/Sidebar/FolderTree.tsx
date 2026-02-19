import { useState } from 'react';
import { useNoteStore } from '../../stores/noteStore';
import type { Folder, Note } from '../../db/database';
import { getExcerpt, formatDate } from '../../utils/markdown';

interface FolderTreeProps {
  folderId: string;
  depth?: number;
}

export default function FolderTree({ folderId, depth = 0 }: FolderTreeProps) {
  const [expanded, setExpanded] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [renamingValue, setRenamingValue] = useState('');

  const folders = useNoteStore(s => s.folders);
  const notes = useNoteStore(s => s.notes);
  const activeNoteId = useNoteStore(s => s.activeNoteId);
  const setActiveNote = useNoteStore(s => s.setActiveNote);
  const deleteNote = useNoteStore(s => s.deleteNote);
  const deleteFolder = useNoteStore(s => s.deleteFolder);
  const renameFolder = useNoteStore(s => s.renameFolder);
  const updateNote = useNoteStore(s => s.updateNote);

  const folder = folders.find(f => f.id === folderId);
  const childFolders = folders.filter(f => f.parentId === folderId);
  const childNotes = notes
    .filter(n => n.folder === folderId)
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt - a.updatedAt;
    });

  if (!folder) return null;

  const handleRename = () => {
    if (renamingValue.trim() && folder.id !== 'root') {
      renameFolder(folder.id, renamingValue.trim());
    }
    setRenaming(false);
  };

  return (
    <div className="folder-tree" style={{ paddingLeft: depth > 0 ? 12 : 0 }}>
      <div
        className="folder-header"
        onClick={() => setExpanded(!expanded)}
      >
        <svg
          className={`folder-chevron ${expanded ? 'expanded' : ''}`}
          width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
        >
          <polyline points="9,18 15,12 9,6" />
        </svg>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {expanded ? (
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          ) : (
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          )}
        </svg>
        {renaming ? (
          <input
            className="rename-input"
            value={renamingValue}
            onChange={e => setRenamingValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={e => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') setRenaming(false);
            }}
            autoFocus
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="folder-name">{folder.name}</span>
        )}
        {folder.id !== 'root' && (
          <div className="folder-actions" onClick={e => e.stopPropagation()}>
            <button
              className="icon-btn-tiny"
              onClick={() => {
                setRenamingValue(folder.name);
                setRenaming(true);
              }}
              title="Rename"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              className="icon-btn-tiny danger"
              onClick={() => {
                if (confirm('Delete this folder? Notes will be moved to root.')) {
                  deleteFolder(folder.id);
                }
              }}
              title="Delete"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3,6 5,6 21,6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="folder-children">
          {childFolders.map(cf => (
            <FolderTree key={cf.id} folderId={cf.id} depth={depth + 1} />
          ))}
          {childNotes.map(note => (
            <div
              key={note.id}
              className={`note-item ${note.id === activeNoteId ? 'active' : ''}`}
              onClick={() => setActiveNote(note.id)}
            >
              <div className="note-item-header">
                {note.isPinned && (
                  <svg className="pin-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
                  </svg>
                )}
                <span className="note-item-title">{note.title}</span>
                <div className="note-item-actions" onClick={e => e.stopPropagation()}>
                  <button
                    className="icon-btn-tiny"
                    onClick={() => updateNote(note.id, { isPinned: !note.isPinned })}
                    title={note.isPinned ? 'Unpin' : 'Pin'}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill={note.isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
                    </svg>
                  </button>
                  <button
                    className="icon-btn-tiny danger"
                    onClick={() => {
                      if (confirm('Delete this note?')) deleteNote(note.id);
                    }}
                    title="Delete"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="note-item-excerpt">{getExcerpt(note.content, 80)}</div>
              <div className="note-item-meta">{formatDate(note.updatedAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
