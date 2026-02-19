import { useNoteStore } from '../../stores/noteStore';
import { formatDate } from '../../utils/markdown';

export default function DailyNoteButton() {
  const getOrCreateDailyNote = useNoteStore(s => s.getOrCreateDailyNote);
  const notes = useNoteStore(s => s.notes);
  const setActiveNote = useNoteStore(s => s.setActiveNote);

  // Get recent daily notes
  const dailyNotes = notes
    .filter(n => n.isDaily)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 7);

  return (
    <div className="daily-notes-section">
      <button
        className="btn btn-primary full-width"
        onClick={() => getOrCreateDailyNote()}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        Today's Daily Note
      </button>
      {dailyNotes.length > 0 && (
        <div className="daily-notes-list">
          {dailyNotes.map(note => (
            <button
              key={note.id}
              className="daily-note-item"
              onClick={() => setActiveNote(note.id)}
            >
              {formatDate(note.createdAt)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
