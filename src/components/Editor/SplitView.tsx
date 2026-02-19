import NoteEditor from './NoteEditor';
import MarkdownPreview from './MarkdownPreview';
import { useUIStore } from '../../stores/uiStore';
import { useNoteStore } from '../../stores/noteStore';
import { wordCount, readingTime } from '../../utils/markdown';

export default function SplitView() {
  const editorMode = useUIStore(s => s.editorMode);
  const setEditorMode = useUIStore(s => s.setEditorMode);
  const activeNoteId = useNoteStore(s => s.activeNoteId);
  const notes = useNoteStore(s => s.notes);
  const activeNote = notes.find(n => n.id === activeNoteId);

  return (
    <div className="split-view-container">
      <div className="editor-toolbar">
        <div className="editor-toolbar-left">
          {activeNote && (
            <span className="note-title-display">{activeNote.title}</span>
          )}
        </div>
        <div className="editor-toolbar-center">
          <button
            className={`mode-btn ${editorMode === 'edit' ? 'active' : ''}`}
            onClick={() => setEditorMode('edit')}
            title="Edit mode"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            className={`mode-btn ${editorMode === 'split' ? 'active' : ''}`}
            onClick={() => setEditorMode('split')}
            title="Split mode"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="12" y1="3" x2="12" y2="21" />
            </svg>
          </button>
          <button
            className={`mode-btn ${editorMode === 'preview' ? 'active' : ''}`}
            onClick={() => setEditorMode('preview')}
            title="Preview mode"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
        <div className="editor-toolbar-right">
          {activeNote && (
            <span className="word-count">
              {wordCount(activeNote.content)} words &middot; {readingTime(activeNote.content)}
            </span>
          )}
        </div>
      </div>
      <div className={`split-view ${editorMode}`}>
        {(editorMode === 'edit' || editorMode === 'split') && (
          <div className="split-pane editor-pane">
            <NoteEditor />
          </div>
        )}
        {(editorMode === 'preview' || editorMode === 'split') && (
          <div className="split-pane preview-pane">
            <MarkdownPreview />
          </div>
        )}
      </div>
    </div>
  );
}
