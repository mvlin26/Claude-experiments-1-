import type { EditorView } from '@codemirror/view';

interface FormatToolbarProps {
  view: EditorView | null;
  onInsertAttachment: () => void;
}

function wrapSelection(view: EditorView, prefix: string, suffix: string) {
  const { from, to } = view.state.selection.main;
  const selected = view.state.sliceDoc(from, to);
  const wrapped = `${prefix}${selected || 'text'}${suffix}`;
  view.dispatch({
    changes: { from, to, insert: wrapped },
    selection: { anchor: from + prefix.length, head: from + wrapped.length - suffix.length },
  });
  view.focus();
}

function insertAtLineStart(view: EditorView, prefix: string) {
  const { from } = view.state.selection.main;
  const line = view.state.doc.lineAt(from);
  const content = line.text;

  // If line already starts with prefix, remove it (toggle)
  if (content.startsWith(prefix)) {
    view.dispatch({
      changes: { from: line.from, to: line.from + prefix.length, insert: '' },
    });
  } else {
    view.dispatch({
      changes: { from: line.from, insert: prefix },
    });
  }
  view.focus();
}

function insertText(view: EditorView, text: string) {
  const { from, to } = view.state.selection.main;
  view.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length },
  });
  view.focus();
}

export default function FormatToolbar({ view, onInsertAttachment }: FormatToolbarProps) {
  if (!view) return null;

  const buttons: { label: string; title: string; action: () => void; icon: string }[] = [
    {
      label: 'B',
      title: 'Bold (Ctrl+B)',
      action: () => wrapSelection(view, '**', '**'),
      icon: 'bold',
    },
    {
      label: 'I',
      title: 'Italic (Ctrl+I)',
      action: () => wrapSelection(view, '_', '_'),
      icon: 'italic',
    },
    {
      label: 'S',
      title: 'Strikethrough',
      action: () => wrapSelection(view, '~~', '~~'),
      icon: 'strikethrough',
    },
    {
      label: 'H',
      title: 'Heading',
      action: () => insertAtLineStart(view, '## '),
      icon: 'heading',
    },
    {
      label: '•',
      title: 'Bullet list',
      action: () => insertAtLineStart(view, '- '),
      icon: 'list-ul',
    },
    {
      label: '1.',
      title: 'Numbered list',
      action: () => insertAtLineStart(view, '1. '),
      icon: 'list-ol',
    },
    {
      label: '☐',
      title: 'Checkbox / To-do',
      action: () => insertAtLineStart(view, '- [ ] '),
      icon: 'checkbox',
    },
    {
      label: '<>',
      title: 'Inline code',
      action: () => wrapSelection(view, '`', '`'),
      icon: 'code',
    },
    {
      label: '>',
      title: 'Block quote',
      action: () => insertAtLineStart(view, '> '),
      icon: 'quote',
    },
    {
      label: '—',
      title: 'Horizontal rule',
      action: () => insertText(view, '\n---\n'),
      icon: 'hr',
    },
    {
      label: '🔗',
      title: 'Link',
      action: () => wrapSelection(view, '[', '](url)'),
      icon: 'link',
    },
  ];

  return (
    <div className="format-toolbar">
      {buttons.map((btn) => (
        <button
          key={btn.icon}
          className="format-btn"
          onClick={btn.action}
          title={btn.title}
        >
          {btn.icon === 'bold' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
            </svg>
          )}
          {btn.icon === 'italic' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" />
            </svg>
          )}
          {btn.icon === 'strikethrough' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.3 4.9c-2.3-.6-4.4-.2-6 1.1C10.2 6.8 9.6 8 9.6 9.3c0 .6.1 1.1.3 1.6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <path d="M14.7 14.1c.2.5.3 1 .3 1.6 0 1.3-.6 2.5-1.7 3.3-1.6 1.3-3.7 1.7-6 1.1" />
            </svg>
          )}
          {btn.icon === 'heading' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 4v16" /><path d="M18 4v16" /><path d="M6 12h12" />
            </svg>
          )}
          {btn.icon === 'list-ul' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" />
              <circle cx="5" cy="6" r="1" fill="currentColor" /><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="5" cy="18" r="1" fill="currentColor" />
            </svg>
          )}
          {btn.icon === 'list-ol' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="10" y1="6" x2="20" y2="6" /><line x1="10" y1="12" x2="20" y2="12" /><line x1="10" y1="18" x2="20" y2="18" />
              <text x="3" y="8" fontSize="8" fill="currentColor" fontWeight="600" stroke="none">1</text>
              <text x="3" y="14" fontSize="8" fill="currentColor" fontWeight="600" stroke="none">2</text>
              <text x="3" y="20" fontSize="8" fill="currentColor" fontWeight="600" stroke="none">3</text>
            </svg>
          )}
          {btn.icon === 'checkbox' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="5" width="14" height="14" rx="2" /><path d="M9 12l2 2 4-4" />
            </svg>
          )}
          {btn.icon === 'code' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16,18 22,12 16,6" /><polyline points="8,6 2,12 8,18" />
            </svg>
          )}
          {btn.icon === 'quote' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" />
              <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
            </svg>
          )}
          {btn.icon === 'hr' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="2" y1="12" x2="22" y2="12" />
            </svg>
          )}
          {btn.icon === 'link' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          )}
        </button>
      ))}

      <div className="format-separator" />

      <button
        className="format-btn"
        onClick={onInsertAttachment}
        title="Upload image or file"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21,15 16,10 5,21" />
        </svg>
      </button>

      <button
        className="format-btn"
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '*/*';
          input.onchange = () => {
            // Handled by the same attachment flow
            const event = new CustomEvent('notegraph-file-upload', { detail: input.files });
            window.dispatchEvent(event);
          };
          input.click();
        }}
        title="Attach file"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
      </button>
    </div>
  );
}
