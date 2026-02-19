import { useState, useCallback } from 'react';
import { useNoteStore } from '../../stores/noteStore';

type SummaryMode = 'summary' | 'bullets' | 'questions' | 'eli5' | 'actions';

const MODE_LABELS: Record<SummaryMode, string> = {
  summary: 'Summary',
  bullets: 'Key Points',
  questions: 'Questions',
  eli5: 'Explain Simply',
  actions: 'Action Items',
};

const MODE_PROMPTS: Record<SummaryMode, string> = {
  summary: 'Provide a concise summary of the following text:',
  bullets: 'Extract the key points from the following text as bullet points:',
  questions: 'Generate insightful questions based on the following text:',
  eli5: 'Explain the following text in simple terms that anyone could understand:',
  actions: 'Extract all action items, tasks, and next steps from the following text:',
};

// Built-in extractive summarizer (no API required)
function extractiveSummary(text: string, mode: SummaryMode): string {
  const sentences = text
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/\[\[(.+?)\]\]/g, '$1')
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 15);

  if (sentences.length === 0) return 'Not enough content to summarize.';

  // Score sentences by word frequency (simple TF approach)
  const wordFreq = new Map<string, number>();
  const allWords = text.toLowerCase().split(/\s+/);
  for (const word of allWords) {
    if (word.length > 3) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }
  }

  const scored = sentences.map(sentence => {
    const words = sentence.toLowerCase().split(/\s+/);
    const score = words.reduce((sum, w) => sum + (wordFreq.get(w) || 0), 0) / words.length;
    return { sentence, score };
  });

  scored.sort((a, b) => b.score - a.score);

  switch (mode) {
    case 'summary': {
      const topSentences = scored.slice(0, Math.min(4, scored.length));
      return topSentences.map(s => s.sentence).join('. ') + '.';
    }
    case 'bullets': {
      const topPoints = scored.slice(0, Math.min(6, scored.length));
      return topPoints.map(s => `- ${s.sentence}`).join('\n');
    }
    case 'questions': {
      const topSentences = scored.slice(0, Math.min(4, scored.length));
      return topSentences.map(s => {
        const words = s.sentence.split(' ');
        if (words.length < 3) return `What about ${s.sentence}?`;
        return `What is the significance of: "${s.sentence}"?`;
      }).join('\n\n');
    }
    case 'eli5': {
      const topSentences = scored.slice(0, Math.min(3, scored.length));
      return 'In simple terms:\n\n' + topSentences.map(s => `- ${s.sentence}`).join('\n');
    }
    case 'actions': {
      // Extract lines that look like action items
      const lines = text.split('\n');
      const actionItems = lines.filter(line => {
        const lower = line.toLowerCase().trim();
        return lower.startsWith('- [ ]') ||
          lower.startsWith('- todo') ||
          lower.includes('should') ||
          lower.includes('need to') ||
          lower.includes('must') ||
          lower.includes('action:') ||
          lower.includes('next step');
      });
      if (actionItems.length > 0) {
        return actionItems.map(a => a.trim()).join('\n');
      }
      return 'No explicit action items found. Top priorities based on content:\n\n' +
        scored.slice(0, 3).map((s, i) => `${i + 1}. ${s.sentence}`).join('\n');
    }
    default:
      return scored.slice(0, 3).map(s => s.sentence).join('. ') + '.';
  }
}

export default function Summarizer() {
  const [mode, setMode] = useState<SummaryMode>('summary');
  const [result, setResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [useApi, setUseApi] = useState(false);

  const activeNoteId = useNoteStore(s => s.activeNoteId);
  const notes = useNoteStore(s => s.notes);
  const updateNote = useNoteStore(s => s.updateNote);
  const activeNote = notes.find(n => n.id === activeNoteId);

  const handleSummarize = useCallback(async () => {
    if (!activeNote) return;

    setIsProcessing(true);
    setResult('');

    try {
      if (useApi && apiKey.trim()) {
        // Use external AI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: 'You are a helpful assistant that summarizes text.' },
              { role: 'user', content: `${MODE_PROMPTS[mode]}\n\n${activeNote.content}` },
            ],
            max_tokens: 500,
          }),
        });

        const data = await response.json();
        if (data.choices?.[0]?.message?.content) {
          setResult(data.choices[0].message.content);
        } else {
          setResult('API error: ' + JSON.stringify(data.error || 'Unknown error'));
        }
      } else {
        // Use built-in extractive summarizer
        // Small delay to show processing state
        await new Promise(resolve => setTimeout(resolve, 300));
        const summary = extractiveSummary(activeNote.content, mode);
        setResult(summary);
      }
    } catch (err) {
      setResult(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  }, [activeNote, mode, useApi, apiKey]);

  const insertIntoNote = () => {
    if (!activeNote || !result) return;
    const separator = '\n\n---\n\n';
    const header = `## AI ${MODE_LABELS[mode]}\n\n`;
    const newContent = activeNote.content + separator + header + result + '\n';
    updateNote(activeNote.id, { content: newContent });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
  };

  if (!activeNote) {
    return (
      <div className="ai-panel">
        <div className="ai-panel-header">
          <span>AI Assistant</span>
        </div>
        <div className="ai-panel-empty">
          Select a note to use the AI summarizer
        </div>
      </div>
    );
  }

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <span>AI Assistant</span>
      </div>

      <div className="ai-panel-content">
        <div className="ai-modes">
          {(Object.keys(MODE_LABELS) as SummaryMode[]).map(m => (
            <button
              key={m}
              className={`ai-mode-btn ${mode === m ? 'active' : ''}`}
              onClick={() => setMode(m)}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        <div className="ai-api-toggle">
          <label className="form-checkbox small">
            <input
              type="checkbox"
              checked={useApi}
              onChange={e => setUseApi(e.target.checked)}
            />
            <span>Use OpenAI API</span>
          </label>
          {useApi && (
            <input
              className="form-input small"
              type="password"
              placeholder="OpenAI API Key"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
          )}
        </div>

        <button
          className="btn btn-primary full-width"
          onClick={handleSummarize}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : `Generate ${MODE_LABELS[mode]}`}
        </button>

        {result && (
          <div className="ai-result">
            <div className="ai-result-header">
              <span>Result</span>
              <div className="ai-result-actions">
                <button className="icon-btn" onClick={copyToClipboard} title="Copy">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
                <button className="icon-btn" onClick={insertIntoNote} title="Insert into note">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="ai-result-body">
              {result}
            </div>
          </div>
        )}

        {!useApi && (
          <div className="ai-info">
            Using built-in extractive summarizer. Enable OpenAI API for more advanced results.
          </div>
        )}
      </div>
    </div>
  );
}
