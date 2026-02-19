import { useState } from 'react';
import { useNoteStore } from '../../stores/noteStore';
import { useUIStore } from '../../stores/uiStore';

// Parse X.com/Twitter URL to extract tweet info
function parseTweetUrl(url: string): { valid: boolean; username?: string; tweetId?: string } {
  try {
    const u = new URL(url);
    // Support twitter.com and x.com
    if (u.hostname !== 'twitter.com' && u.hostname !== 'x.com' &&
        u.hostname !== 'www.twitter.com' && u.hostname !== 'www.x.com') {
      return { valid: false };
    }
    // Pattern: /username/status/tweetId
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length >= 3 && parts[1] === 'status') {
      return { valid: true, username: parts[0], tweetId: parts[2] };
    }
    // Just a profile URL - still valid but different handling
    if (parts.length >= 1) {
      return { valid: true, username: parts[0] };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

export default function XClipper() {
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveAsNote, setSaveAsNote] = useState(true);

  const addBookmark = useNoteStore(s => s.addBookmark);
  const createNote = useNoteStore(s => s.createNote);
  const setClipperOpen = useUIStore(s => s.setClipperOpen);

  const handleUrlPaste = (value: string) => {
    setUrl(value);
    const parsed = parseTweetUrl(value);
    if (parsed.valid && parsed.username) {
      setAuthor(parsed.username);
    }
  };

  const handleClip = async () => {
    if (!content.trim()) return;

    setIsProcessing(true);
    try {
      const bookmark = await addBookmark({
        url: url.trim(),
        author: author.trim() || 'unknown',
        content: content.trim(),
        clippedAt: Date.now(),
        noteId: null,
        summary: null,
      });

      if (saveAsNote) {
        const noteContent = `# Tweet by @${bookmark.author}

> ${bookmark.content.split('\n').join('\n> ')}

---
**Source:** ${bookmark.url || 'N/A'}
**Clipped:** ${new Date().toLocaleString()}

#tweet #clipper
`;
        const note = await createNote(
          `Tweet - @${bookmark.author} - ${new Date().toLocaleDateString()}`,
          'root',
          noteContent
        );
        await useNoteStore.getState().updateBookmark(bookmark.id, { noteId: note.id });
      }

      setUrl('');
      setContent('');
      setAuthor('');
      setClipperOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setClipperOpen(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>X.com Bookmark Clipper</h2>
          <button className="icon-btn" onClick={() => setClipperOpen(false)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <p className="clipper-info">
            Paste a tweet URL and its content to clip it as a bookmark. Optionally save it as a note.
          </p>

          <label className="form-label">Tweet URL (optional)</label>
          <input
            className="form-input"
            placeholder="https://x.com/username/status/..."
            value={url}
            onChange={e => handleUrlPaste(e.target.value)}
          />

          <label className="form-label">Author</label>
          <input
            className="form-input"
            placeholder="@username"
            value={author}
            onChange={e => setAuthor(e.target.value)}
          />

          <label className="form-label">Tweet Content *</label>
          <textarea
            className="form-textarea"
            placeholder="Paste the tweet content here..."
            rows={6}
            value={content}
            onChange={e => setContent(e.target.value)}
          />

          <label className="form-checkbox">
            <input
              type="checkbox"
              checked={saveAsNote}
              onChange={e => setSaveAsNote(e.target.checked)}
            />
            <span>Also save as a note</span>
          </label>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setClipperOpen(false)}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleClip}
            disabled={!content.trim() || isProcessing}
          >
            {isProcessing ? 'Saving...' : 'Clip Bookmark'}
          </button>
        </div>
      </div>
    </div>
  );
}
