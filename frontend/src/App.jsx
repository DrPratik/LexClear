import { useState } from 'react';
import './index.css';
import UploadForm from './components/UploadForm';
import ClauseCard from './components/ClauseCard';
import ChatPanel from './components/ChatPanel';
import PriorityActions from './components/PriorityActions';
import LawyerExport from './components/LawyerExport';
import CompareDashboard from './components/CompareDashboard';
import RevisedDraftModal from './components/RevisedDraftModal';

function App() {
  const [analysis, setAnalysis] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [leaseText, setLeaseText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [revisedDraft, setRevisedDraft] = useState(null);
  const [revising, setRevising] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAnalyze = async (text) => {
    setAnalyzing(true);
    setLeaseText(text); // Save raw text for stateless Q&A
    try {
      const apiUrl = import.meta.env.PROD ? '' : 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/analyze`, {
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

  const handleReviseDraft = async () => {
    setRevising(true);
    try {
      const apiUrl = import.meta.env.PROD ? '' : 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/revise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: leaseText })
      });
      const data = await response.json();
      if (data.error) {
        alert("Revision Error: " + data.error);
        return;
      }
      setRevisedDraft(data.revisedText);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Revision failed:", error);
      alert("Failed to generate revised document.");
    } finally {
      setRevising(false);
    }
  };

  const handleCompare = async (original, revised) => {
    setAnalyzing(true);
    try {
      const apiUrl = import.meta.env.PROD ? '' : 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/compare`, {
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
        <header style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '3rem' }}>
          <img src="/logo.jpg" alt="LexClear AI Logo" style={{ width: '80px', height: '80px', borderRadius: '20px', marginBottom: '1rem', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
          <h1>LexClear AI</h1>
          <p>Deep Semantic Document Risk Analysis</p>
        </header>

        {analyzing ? (
          <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
            <div className="scanner-container">
              <div className="document-icon">
                <div className="scanner-beam"></div>
                <div className="document-line"></div>
                <div className="document-line"></div>
                <div className="document-line"></div>
                <div className="document-line"></div>
                <div className="document-line"></div>
              </div>
              <div className="loading-text">
                Processing document...
              </div>
              <div className="loading-subtext">
                Extracting clauses, identifying risks, and generating insights with Gemini...
              </div>
            </div>
          </div>
        ) : comparison ? (
          <CompareDashboard comparison={comparison} onReset={() => setComparison(null)} />
        ) : !analysis ? (
          <UploadForm onAnalyze={handleAnalyze} onCompare={handleCompare} isLoading={false} />
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
                <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleReviseDraft} 
                    disabled={revising}
                    style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', fontWeight: 'bold' }}
                  >
                    {revising ? "Compiling Draft..." : "Compile Suggested Draft"}
                  </button>
                  <LawyerExport analysis={analysis} leaseText={leaseText} />
                </div>
                <PriorityActions actions={analysis.priority_actions} />
                <div style={{marginTop: '2rem'}}>
                  <ChatPanel leaseText={leaseText} />
                </div>
              </div>
            </div>
            
            <RevisedDraftModal 
              isOpen={isModalOpen} 
              onClose={() => setIsModalOpen(false)} 
              revisedText={revisedDraft} 
              originalText={leaseText}
              onCompare={handleCompare}
            />
          </div>
        )}
      </div>
    </>
  );
}

export default App;
