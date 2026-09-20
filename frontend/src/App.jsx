import { useState } from 'react';
import './index.css';
import UploadForm from './components/UploadForm';
import ClauseCard from './components/ClauseCard';
import ChatPanel from './components/ChatPanel';
import PriorityActions from './components/PriorityActions';
import LawyerExport from './components/LawyerExport';
import CompareDashboard from './components/CompareDashboard';

function App() {
  const [analysis, setAnalysis] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [leaseText, setLeaseText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async (text) => {
    setAnalyzing(true);
    setLeaseText(text); // Save raw text for stateless Q&A
    try {
      const response = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await response.json();
      if (data.error) {
        alert("Analysis Error: " + data.error);
        return;
      }
      setAnalysis(data);
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Failed to analyze document.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCompare = async (original, revised) => {
    setAnalyzing(true);
    try {
      const response = await fetch('http://localhost:3001/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ original, revised })
      });
      const data = await response.json();
      if (data.error) {
        alert("Comparison Error: " + data.error);
        return;
      }
      setComparison(data);
    } catch (error) {
      console.error("Comparison failed:", error);
      alert("Failed to compare documents.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <>
      <div className="disclaimer-banner">
        LexClear provides general information, not legal advice. Consult a licensed attorney for guidance specific to your situation.
      </div>
      
      <div className="container">
        <header>
          <h1>LexClear AI</h1>
          <p>Deep Semantic Document Risk Analysis</p>
        </header>

        {comparison ? (
          <CompareDashboard comparison={comparison} onReset={() => setComparison(null)} />
        ) : !analysis ? (
          <UploadForm onAnalyze={handleAnalyze} onCompare={handleCompare} isLoading={analyzing} />
        ) : (
          <div>
            <div className={`card risk-${analysis.overall_risk.level} dashboard-summary`}>
              <h2>Overall Risk Profile: <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{analysis.overall_risk.level}</span></h2>
              <p style={{ fontSize: '1.1rem', marginTop: '1rem' }}>{analysis.overall_risk.summary}</p>
            </div>

            <div className="card financial-summary">
              <h2>Financial Breakdown</h2>
              <div className="grid">
                {analysis.financial_summary.financial_terms && analysis.financial_summary.financial_terms.map((term, i) => (
                  <div key={i}><strong>{term.item}:</strong> {term.amount_or_details}</div>
                ))}
                {analysis.financial_summary.early_exit_exposure && (
                   <div style={{ gridColumn: '1 / -1', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                     <strong>Potential Early-Exit Exposure:</strong> {analysis.financial_summary.early_exit_exposure.potential_exposure}
                     <div style={{fontSize: '0.9rem', color: '#666', marginTop: '0.2rem'}}>(Basis: {analysis.financial_summary.early_exit_exposure.basis})</div>
                   </div>
                )}
              </div>
            </div>

            <div className="layout-grid">
              <div className="main-panel">
                <h2>Detailed Clause Analysis</h2>
                {analysis.clauses.map((clause, idx) => (
                  <ClauseCard key={idx} clause={clause} />
                ))}
              </div>
              <div className="side-panel">
                <LawyerExport analysis={analysis} leaseText={leaseText} />
                <PriorityActions actions={analysis.priority_actions} />
                <div style={{marginTop: '2rem'}}>
                  <ChatPanel leaseText={leaseText} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
