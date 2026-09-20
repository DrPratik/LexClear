import React, { useState } from 'react';

const ClauseCard = React.memo(function ClauseCard({ clause }) {
  const { title, clause_number, risk_level, favorability, ambiguity, categories, explanation, financial_impact, recommended_action, evidence } = clause;
  const [proposal, setProposal] = useState(null);
  const [loadingProposal, setLoadingProposal] = useState(false);

  const handleNegotiate = async () => {
    setLoadingProposal(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const originalClause = evidence && evidence.length > 0 ? evidence.join(" ") : title;
      const res = await fetch(`${apiUrl}/api/negotiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalClause, riskReason: explanation })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProposal(data);
    } catch {
      alert("Failed to generate counter-proposal.");
    } finally {
      setLoadingProposal(false);
    }
  };

  return (
    <div className={`card clause-card risk-${risk_level}`}>
      <div className="clause-header">
        <span className="clause-category">{categories.join(', ')}</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className="risk-badge" style={{ backgroundColor: '#7f8c8d' }}>{favorability}</span>
          <span className="risk-badge" style={{ backgroundColor: '#95a5a6' }}>{ambiguity} AMBIGUITY</span>
          <span className="risk-badge">{risk_level} RISK</span>
        </div>
      </div>
      
      <h3 style={{marginBottom: '1rem'}}>
        {clause_number ? `Clause ${clause_number}: ` : ''}{title}
      </h3>
      
      <div className="clause-breakdown">
        <div style={{marginBottom: '1rem'}}>
          <strong>Why:</strong> {explanation}
        </div>
        
        {financial_impact && financial_impact !== "None" && financial_impact !== "N/A" && (
          <div style={{marginBottom: '1rem'}}>
            <strong>Potential Impact:</strong> {financial_impact}
          </div>
        )}
        
        <div style={{marginBottom: '1rem'}}>
          <strong>Recommended Change:</strong> {recommended_action}
        </div>

        {evidence && evidence.length > 0 && (
          <div className="evidence-box">
            <strong style={{fontSize: '0.8rem', color: '#666'}}>Evidence from text:</strong>
            <ul style={{fontSize: '0.85rem', color: '#444', paddingLeft: '1.2rem', fontStyle: 'italic'}}>
              {evidence.map((ev, i) => <li key={i}>"{ev}"</li>)}
            </ul>
          </div>
        )}

        {(risk_level === 'HIGH' || risk_level === 'CRITICAL') && !proposal && (
          <button 
            onClick={handleNegotiate}
            disabled={loadingProposal}
            style={{ marginTop: '1rem', backgroundColor: '#8e44ad' }}
            aria-label="Draft Counter Proposal"
          >
            {loadingProposal ? 'Drafting Proposal...' : '🤝 Draft Counter-Proposal'}
          </button>
        )}

        {proposal && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #8e44ad', borderRadius: '4px', backgroundColor: '#f9f0ff' }}>
            <h4 style={{ color: '#8e44ad', marginBottom: '0.5rem' }}>Negotiation Copilot</h4>
            
            <strong style={{ fontSize: '0.9rem' }}>Email Snippet:</strong>
            <textarea readOnly value={proposal.emailText} rows={4} style={{ width: '100%', fontSize: '0.85rem', marginBottom: '0.5rem', padding: '0.5rem' }} />
            
            <strong style={{ fontSize: '0.9rem' }}>Revised Legal Clause:</strong>
            <textarea readOnly value={proposal.revisedClause} rows={3} style={{ width: '100%', fontSize: '0.85rem', marginBottom: '0.5rem', padding: '0.5rem' }} />
            
            <strong style={{ fontSize: '0.9rem' }}>Why this is fair:</strong>
            <p style={{ fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>{proposal.rationale}</p>
          </div>
        )}
      </div>
    </div>
  );
});

export default ClauseCard;
