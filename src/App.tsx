import { useEffect } from 'react';
import Layout from './components/Layout';
import { useNoteStore } from './stores/noteStore';
import { useUIStore } from './stores/uiStore';
import { seedDefaults } from './db/database';
import './styles/globals.css';

export default function App() {
  const loadAll = useNoteStore(s => s.loadAll);
  const isLoading = useNoteStore(s => s.isLoading);
  const setActiveNote = useNoteStore(s => s.setActiveNote);
  const notes = useNoteStore(s => s.notes);
  const theme = useUIStore(s => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    async function init() {
      await seedDefaults();
      await loadAll();
    }
    init();
  }, []);

  // Auto-select welcome note on first load
  useEffect(() => {
    if (!isLoading && notes.length > 0 && !useNoteStore.getState().activeNoteId) {
      const welcome = notes.find(n => n.id === 'welcome');
      if (welcome) {
        setActiveNote(welcome.id);
      } else {
        setActiveNote(notes[0].id);
      }
    }
  }, [isLoading, notes]);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <div className="loading-text">Loading NoteGraph...</div>
      </div>
    );
  }

  return <Layout />;
}
