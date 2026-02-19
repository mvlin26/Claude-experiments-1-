import { useState, useRef } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useNoteStore } from '../../stores/noteStore';
import {
  exportAsJSON,
  exportAsMarkdownZip,
  importFromJSON,
  importFromMarkdownZip,
} from '../../utils/exportImport';

export default function ImportExport() {
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState<'json' | 'zip'>('json');

  const setImportExportOpen = useUIStore(s => s.setImportExportOpen);
  const loadAll = useNoteStore(s => s.loadAll);

  const handleExportJSON = async () => {
    setIsProcessing(true);
    try {
      await exportAsJSON();
      setStatus('Exported vault as JSON successfully!');
    } catch (err) {
      setStatus(`Export error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportZip = async () => {
    setIsProcessing(true);
    try {
      await exportAsMarkdownZip();
      setStatus('Exported as Markdown zip successfully!');
    } catch (err) {
      setStatus(`Export error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      let count: number;
      if (importType === 'json') {
        count = await importFromJSON(file);
      } else {
        count = await importFromMarkdownZip(file);
      }
      await loadAll();
      setStatus(`Imported ${count} notes successfully!`);
    } catch (err) {
      setStatus(`Import error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setImportExportOpen(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Import / Export</h2>
          <button className="icon-btn" onClick={() => setImportExportOpen(false)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <h3 className="section-title">Export</h3>
          <div className="export-buttons">
            <button
              className="btn btn-primary"
              onClick={handleExportJSON}
              disabled={isProcessing}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export as JSON
            </button>
            <button
              className="btn btn-primary"
              onClick={handleExportZip}
              disabled={isProcessing}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export as Markdown ZIP
            </button>
          </div>

          <h3 className="section-title">Import</h3>
          <div className="import-section">
            <div className="import-type-selector">
              <button
                className={`btn btn-sm ${importType === 'json' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setImportType('json')}
              >
                JSON
              </button>
              <button
                className={`btn btn-sm ${importType === 'zip' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setImportType('zip')}
              >
                Markdown ZIP
              </button>
            </div>
            <button
              className="btn btn-secondary full-width"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17,8 12,3 7,8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Choose {importType === 'json' ? 'JSON' : 'ZIP'} File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={importType === 'json' ? '.json' : '.zip'}
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </div>

          {status && (
            <div className={`status-message ${status.includes('error') ? 'error' : 'success'}`}>
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
