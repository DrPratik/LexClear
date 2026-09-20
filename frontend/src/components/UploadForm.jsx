import { useState } from 'react';

export default function UploadForm({ onAnalyze, onCompare, isLoading }) {
  const [text, setText] = useState('');
  const [revisedText, setRevisedText] = useState('');
  const [compareMode, setCompareMode] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (compareMode) {
      if (!text || !revisedText) return alert("Please provide both versions.");
      onCompare(text, revisedText);
    } else {
      if (text.trim().length < 50) return alert("Please paste a longer lease text (at least 50 characters).");
      onAnalyze(text);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        {compareMode ? 'Compare Lease Versions' : 'Analyze a Document'}
      </h2>
      
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <label style={{ cursor: 'pointer', fontSize: '0.9rem', color: '#555' }}>
          <input 
            type="checkbox" 
            checked={compareMode} 
            onChange={(e) => setCompareMode(e.target.checked)} 
            style={{ marginRight: '0.5rem' }}
          />
          Compare Two Documents (e.g. Original vs. Revised)
        </label>
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={compareMode ? "Paste the ORIGINAL document text here..." : "Paste your legal document text here..."}
          aria-label={compareMode ? "Original document text" : "Legal document text"}
          rows="10"
          style={{ width: '100%', padding: '1rem', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '1rem', resize: 'vertical' }}
        />

        {compareMode && (
          <textarea
            value={revisedText}
            onChange={(e) => setRevisedText(e.target.value)}
            placeholder="Paste the REVISED document text here..."
            aria-label="Revised document text"
            rows="10"
            style={{ width: '100%', padding: '1rem', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '1rem', resize: 'vertical' }}
          />
        )}
        
        <button 
          type="submit" 
          disabled={isLoading}
          aria-label={compareMode ? "Compare Versions" : "Analyze Lease"}
          style={{ 
            width: '100%', 
            padding: '1rem', 
            backgroundColor: 'var(--primary-color)', 
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1.1rem',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? (compareMode ? 'Comparing...' : 'Analyzing deeply...') : (compareMode ? 'Compare Versions' : 'Analyze Lease')}
        </button>
      </form>
    </div>
  );
}
