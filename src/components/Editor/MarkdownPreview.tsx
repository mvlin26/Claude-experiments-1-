import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNoteStore } from '../../stores/noteStore';

// Transform wikilinks to clickable links
function processWikilinks(content: string): string {
  return content.replace(/\[\[([^\]]+)\]\]/g, (_, title) => {
    return `[${title}](#wikilink:${encodeURIComponent(title)})`;
  });
}

export default function MarkdownPreview() {
  const activeNoteId = useNoteStore(s => s.activeNoteId);
  const notes = useNoteStore(s => s.notes);
  const setActiveNote = useNoteStore(s => s.setActiveNote);

  const activeNote = notes.find(n => n.id === activeNoteId);

  if (!activeNote) {
    return (
      <div className="editor-empty">
        <div className="editor-empty-content">
          <p>Select a note to preview</p>
        </div>
      </div>
    );
  }

  const handleNavigate = (title: string) => {
    const target = notes.find(n => n.title.toLowerCase() === title.toLowerCase());
    if (target) {
      setActiveNote(target.id);
    }
  };

  const processed = processWikilinks(activeNote.content);

  return (
    <div className="markdown-preview">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children, ...props }) => {
            if (href?.startsWith('#wikilink:')) {
              const title = decodeURIComponent(href.replace('#wikilink:', ''));
              return (
                <a
                  className="wikilink"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate(title);
                  }}
                  href="#"
                  {...props}
                >
                  {children}
                </a>
              );
            }
            return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
          },
          input: ({ type, checked, ...props }) => {
            if (type === 'checkbox') {
              return <input type="checkbox" checked={checked} readOnly {...props} />;
            }
            return <input type={type} {...props} />;
          },
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}
