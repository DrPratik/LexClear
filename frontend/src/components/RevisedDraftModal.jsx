import React from 'react';
import ReactMarkdown from 'react-markdown';

const RevisedDraftModal = ({ isOpen, onClose, revisedText, originalText, onCompare }) => {
  if (!isOpen) return null;

  const handleCompareClick = () => {
    onClose(); // Close modal first
    onCompare(originalText, revisedText); // Trigger existing compare logic
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(revisedText);
    alert('Revised draft copied to clipboard!');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content revised-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>LexClear Revised Draft</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <p className="modal-description" style={{ marginBottom: '1rem', fontStyle: 'italic', color: '#666' }}>
            This document has been fully revised by LexClear AI to balance unfair clauses while preserving core business terms. Please review carefully.
          </p>
          <div className="revised-text-container" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'left' }}>
            <ReactMarkdown>{revisedText}</ReactMarkdown>
          </div>
        </div>
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ background: '#f1f5f9', color: '#1f2937' }}>Close</button>
          <button className="btn btn-primary" onClick={handleCompareClick} style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>Compare with Original</button>
          <button className="btn btn-primary" onClick={handleCopy}>Copy to Clipboard</button>
        </div>
      </div>
    </div>
  );
};

export default RevisedDraftModal;
