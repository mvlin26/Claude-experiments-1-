import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNoteStore } from '../../stores/noteStore';
import { db } from '../../db/database';

// Transform wikilinks to clickable links
function processWikilinks(content: string): string {
  return content.replace(/\[\[([^\]]+)\]\]/g, (_, title) => {
    return `[${title}](#wikilink:${encodeURIComponent(title)})`;
  });
}

// Component that resolves attachment: URLs to data URLs
function AttachmentImage({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (src?.startsWith('attachment:')) {
      const id = src.replace('attachment:', '');
      db.attachments.get(id).then(att => {
        if (att) setResolvedSrc(att.data);
      });
    } else {
      setResolvedSrc(src);
    }
  }, [src]);

  if (!resolvedSrc) {
    return <span className="attachment-loading">Loading image...</span>;
  }

  return <img src={resolvedSrc} alt={alt} {...props} />;
}

// Component that resolves attachment: links for files
function AttachmentLink({
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const [resolvedHref, setResolvedHref] = useState<string | undefined>(undefined);
  const [fileName, setFileName] = useState<string>('');

  useEffect(() => {
    if (href?.startsWith('attachment:')) {
      const id = href.replace('attachment:', '');
      db.attachments.get(id).then(att => {
        if (att) {
          setResolvedHref(att.data);
          setFileName(att.name);
        }
      });
    }
  }, [href]);

  if (href?.startsWith('attachment:')) {
    if (!resolvedHref) return <span>Loading...</span>;
    return (
      <a href={resolvedHref} download={fileName} {...props}>
        {children}
      </a>
    );
  }

  return <a href={href} {...props}>{children}</a>;
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
            if (href?.startsWith('attachment:')) {
              return <AttachmentLink href={href} {...props}>{children}</AttachmentLink>;
            }
            return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
          },
          img: ({ src, alt, ...props }) => {
            return <AttachmentImage src={src} alt={alt} {...props} />;
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
