import { useState } from 'react';
import { useNoteStore } from '../../stores/noteStore';
import { useUIStore } from '../../stores/uiStore';

export default function TemplateModal() {
  const [newName, setNewName] = useState('');
  const [newContent, setNewContent] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const templates = useNoteStore(s => s.templates);
  const createNote = useNoteStore(s => s.createNote);
  const createTemplate = useNoteStore(s => s.createTemplate);
  const deleteTemplate = useNoteStore(s => s.deleteTemplate);
  const setTemplateModalOpen = useUIStore(s => s.setTemplateModalOpen);

  const handleUseTemplate = (templateContent: string) => {
    const now = new Date();
    const content = templateContent
      .replace(/\{\{date\}\}/g, now.toLocaleDateString())
      .replace(/\{\{time\}\}/g, now.toLocaleTimeString())
      .replace(/\{\{title\}\}/g, 'Untitled');

    // Extract title from first heading
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : 'From Template';

    createNote(title, 'root', content);
    setTemplateModalOpen(false);
  };

  const handleCreateTemplate = () => {
    if (newName.trim() && newContent.trim()) {
      createTemplate(newName.trim(), newContent.trim());
      setNewName('');
      setNewContent('');
      setShowCreate(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setTemplateModalOpen(false)}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Note Templates</h2>
          <button className="icon-btn" onClick={() => setTemplateModalOpen(false)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <div className="template-grid">
            {templates.map(t => (
              <div key={t.id} className="template-card">
                <div className="template-card-header">
                  <span className="template-name">{t.name}</span>
                  <button
                    className="icon-btn-tiny danger"
                    onClick={() => deleteTemplate(t.id)}
                    title="Delete template"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className="template-preview">
                  {t.content.slice(0, 100)}...
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleUseTemplate(t.content)}
                >
                  Use Template
                </button>
              </div>
            ))}
          </div>

          {!showCreate ? (
            <button
              className="btn btn-secondary full-width"
              onClick={() => setShowCreate(true)}
            >
              + Create New Template
            </button>
          ) : (
            <div className="template-create">
              <input
                className="form-input"
                placeholder="Template name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
              <textarea
                className="form-textarea"
                placeholder="Template content (use {{date}}, {{time}}, {{title}} as placeholders)"
                rows={8}
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
              />
              <div className="template-create-actions">
                <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreateTemplate}>Save Template</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
