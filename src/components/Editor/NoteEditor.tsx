import { useEffect, useRef, useCallback } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, placeholder, lineNumbers, highlightActiveLine, drawSelection } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { oneDark } from '@codemirror/theme-one-dark';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, completionKeymap, type CompletionContext } from '@codemirror/autocomplete';
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
  indentOnInput,
  foldGutter,
  foldKeymap,
} from '@codemirror/language';
import { useNoteStore } from '../../stores/noteStore';
import { useUIStore } from '../../stores/uiStore';
import { db, type Attachment } from '../../db/database';
import { v4 as uuid } from 'uuid';
import FormatToolbar from './FormatToolbar';

// Light theme
const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    height: '100%',
  },
  '.cm-content': {
    fontFamily: 'var(--font-mono)',
    fontSize: '14px',
    lineHeight: '1.7',
    padding: '16px 0',
    caretColor: 'var(--accent)',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-muted)',
    border: 'none',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--bg-hover)',
  },
  '.cm-selectionMatch': {
    backgroundColor: 'var(--accent-dim)',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: 'var(--accent)',
  },
  '&.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: 'var(--accent-dim)',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
});

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function storeAttachment(file: File, noteId: string): Promise<Attachment> {
  const dataUrl = await fileToDataURL(file);
  const attachment: Attachment = {
    id: uuid(),
    noteId,
    name: file.name || 'image.png',
    mimeType: file.type,
    data: dataUrl,
    createdAt: Date.now(),
  };
  await db.attachments.add(attachment);
  return attachment;
}

function insertAttachmentMarkdown(view: EditorView, attachment: Attachment) {
  const isImage = attachment.mimeType.startsWith('image/');
  const md = isImage
    ? `![${attachment.name}](attachment:${attachment.id})`
    : `[${attachment.name}](attachment:${attachment.id})`;

  const { from, to } = view.state.selection.main;
  view.dispatch({
    changes: { from, to, insert: md + '\n' },
    selection: { anchor: from + md.length + 1 },
  });
  view.focus();
}

export default function NoteEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const activeNoteId = useNoteStore(s => s.activeNoteId);
  const notes = useNoteStore(s => s.notes);
  const updateNote = useNoteStore(s => s.updateNote);
  const theme = useUIStore(s => s.theme);

  const activeNote = notes.find(n => n.id === activeNoteId);

  // Handle files (from paste, drop, or upload button)
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    if (!viewRef.current || !activeNote) return;
    for (const file of Array.from(files)) {
      const attachment = await storeAttachment(file, activeNote.id);
      insertAttachmentMarkdown(viewRef.current, attachment);
    }
  }, [activeNote]);

  // Listen for file upload events from the toolbar attach button
  useEffect(() => {
    const handler = (e: Event) => {
      const files = (e as CustomEvent).detail as FileList;
      if (files) handleFiles(files);
    };
    window.addEventListener('notegraph-file-upload', handler);
    return () => window.removeEventListener('notegraph-file-upload', handler);
  }, [handleFiles]);

  // Wikilink autocomplete
  const wikilinkCompletion = useCallback((context: CompletionContext) => {
    const before = context.matchBefore(/\[\[[^\]]*$/);
    if (!before) return null;

    const query = before.text.slice(2).toLowerCase();
    const options = notes
      .filter(n => n.title.toLowerCase().includes(query) && n.id !== activeNoteId)
      .slice(0, 10)
      .map(n => ({
        label: n.title,
        apply: `${n.title}]]`,
        type: 'text' as const,
      }));

    return {
      from: before.from + 2,
      options,
    };
  }, [notes, activeNoteId]);

  useEffect(() => {
    if (!editorRef.current || !activeNote) return;

    // Clean up previous
    if (viewRef.current) {
      viewRef.current.destroy();
      viewRef.current = null;
    }

    const updateHandler = EditorView.updateListener.of((update) => {
      if (update.docChanged && activeNote) {
        const content = update.state.doc.toString();
        updateNote(activeNote.id, { content });
      }
    });

    // Handle paste with images
    const pasteHandler = EditorView.domEventHandlers({
      paste(event) {
        const items = event.clipboardData?.items;
        if (!items) return false;

        const files: File[] = [];
        for (const item of Array.from(items)) {
          if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file) files.push(file);
          }
        }

        if (files.length > 0) {
          event.preventDefault();
          handleFiles(files);
          return true;
        }
        return false;
      },
      drop(event) {
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
          event.preventDefault();
          handleFiles(files);
          return true;
        }
        return false;
      },
    });

    const extensions = [
      lineNumbers(),
      highlightActiveLine(),
      drawSelection(),
      indentOnInput(),
      bracketMatching(),
      foldGutter(),
      history(),
      highlightSelectionMatches(),
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      autocompletion({ override: [wikilinkCompletion] }),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
        ...completionKeymap,
        ...foldKeymap,
      ]),
      updateHandler,
      pasteHandler,
      placeholder('Start writing...'),
      EditorView.lineWrapping,
    ];

    if (theme === 'dark') {
      extensions.push(oneDark);
    } else {
      extensions.push(lightTheme);
      extensions.push(syntaxHighlighting(defaultHighlightStyle));
    }

    const state = EditorState.create({
      doc: activeNote.content,
      extensions,
    });

    viewRef.current = new EditorView({
      state,
      parent: editorRef.current,
    });

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, [activeNoteId, theme]); // Only re-create on note change or theme change

  if (!activeNote) {
    return (
      <div className="editor-empty">
        <div className="editor-empty-content">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10,9 9,9 8,9" />
          </svg>
          <p>Select a note or create a new one</p>
          <span className="shortcut-hint">Ctrl+N to create, Ctrl+P for command palette</span>
        </div>
      </div>
    );
  }

  return (
    <div className="note-editor-wrapper">
      <FormatToolbar
        view={viewRef.current}
        onInsertAttachment={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.multiple = true;
          input.onchange = () => {
            if (input.files) handleFiles(input.files);
          };
          input.click();
        }}
      />
      <div ref={editorRef} className="note-editor" />
    </div>
  );
}
