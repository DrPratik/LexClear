export default function CompareDashboard({ comparison, onReset }) {
  const { overall_risk_shift, summary, changes } = comparison;

  const riskShiftColor = 
    overall_risk_shift === 'BETTER' ? 'var(--risk-low)' :
    overall_risk_shift === 'WORSE' ? 'var(--risk-critical)' : 'var(--risk-medium)';

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      <header>
        <h1>Lease Comparison Results</h1>
        <button onClick={onReset} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Back to Upload
        </button>
      </header>

      <div className="card" style={{ borderTop: `4px solid ${riskShiftColor}`, textAlign: 'center' }}>
        <h2>Overall Shift for Tenant: <span style={{ color: riskShiftColor }}>{overall_risk_shift}</span></h2>
        <p style={{ fontSize: '1.1rem', marginTop: '1rem' }}>{summary}</p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Material Changes</h2>
        {(!changes || changes.length === 0) ? (
          <p>No material changes detected between the two documents.</p>
        ) : (
          changes.map((change, idx) => (
            <div key={idx} className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <strong style={{ fontSize: '1.1rem', color: '#2c3e50' }}>{change.topic}</strong>
                <span style={{ 
                  fontWeight: 'bold', 
                  fontSize: '0.85rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '12px',
                  backgroundColor: 
                    change.risk_shift === 'BETTER' ? 'var(--risk-low)' : 
                    change.risk_shift === 'WORSE' ? 'var(--risk-high)' : '#ccc',
                  color: change.risk_shift === 'NEUTRAL' ? '#333' : 'white'
                }}>
                  {change.risk_shift}
                </span>
              </div>
              <p>{change.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
