import { useState } from 'react';

export default function LawyerExport({ analysis }) {
  const [copied, setCopied] = useState(false);

  const generateReport = () => {
    const { overall_risk, financial_summary, clauses } = analysis;
    
    let report = `# Legal Brief: Document Risk Analysis\n\n`;

    report += `## 1. Overall Risk Profile: ${overall_risk.level}\n`;
    report += `${overall_risk.summary}\n\n`;

    report += `## 2. Financial Breakdown\n`;
    if (financial_summary.financial_terms && financial_summary.financial_terms.length > 0) {
      financial_summary.financial_terms.forEach(term => {
        report += `* ${term.item}: ${term.amount_or_details}\n`;
      });
    } else {
      report += `* No financial terms identified.\n`;
    }
    
    if (financial_summary.early_exit_exposure) {
      report += `* **Potential Early-Exit Exposure**: ${financial_summary.early_exit_exposure.potential_exposure}\n`;
      report += `  *Basis: ${financial_summary.early_exit_exposure.basis}*\n\n`;
    } else {
      report += `\n`;
    }

    const redFlags = clauses.filter(c => c.risk_level === 'CRITICAL' || c.risk_level === 'HIGH' || c.ambiguity === 'HIGH' || c.ambiguity === 'MEDIUM');
    if (redFlags.length > 0) {
      report += `## Priority Actions / Areas for Clarification\n\n`;
      redFlags.forEach(c => {
        report += `### Clause ${c.clause_number}: ${c.title.toUpperCase()} — ${c.risk_level} RISK / ${c.ambiguity} AMBIGUITY / ${c.favorability}\n\n`;
        report += `${c.explanation}\n\n`;
        if (c.recommended_action) {
          report += `**Recommended clarification:** ${c.recommended_action}\n\n`;
        }
      });
    }

    return report;
  };

  const handleCopy = () => {
    const text = generateReport();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card" style={{ backgroundColor: '#fdfdfd', border: '1px solid #ddd' }}>
      <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>Prepare for Lawyer</h3>
      <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#555' }}>
        Generate a structured summary of risks and exposure to share with your legal counsel, saving billable hours.
      </p>
      <button 
        onClick={handleCopy}
        style={{
          width: '100%',
          padding: '0.75rem',
          backgroundColor: copied ? '#27ae60' : '#2c3e50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
          transition: 'background-color 0.2s'
        }}
      >
        {copied ? 'Copied to Clipboard!' : 'Copy Brief to Clipboard'}
      </button>
    </div>
  );
}
