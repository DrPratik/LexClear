export default function Checklist({ clauses }) {
  // Generate questions based on high/medium risk clauses
  const questions = [];
  
  clauses.forEach(clause => {
    if (clause.risk_level === 'HIGH' || clause.risk_level === 'MEDIUM') {
      if (clause.category === 'deposit') {
        questions.push(`Can you clarify the conditions under which my deposit (${clause.clause_id}) might not be refunded?`);
      } else if (clause.category === 'termination') {
        questions.push(`Under what specific conditions can this lease be terminated (${clause.clause_id})?`);
      } else if (clause.category === 'maintenance') {
        questions.push(`Can we define "wear and tear" versus "damage" for maintenance responsibilities (${clause.clause_id})?`);
      } else if (clause.category === 'rent_increase') {
        questions.push(`Is there a cap on rent increases, and how much notice will I receive (${clause.clause_id})?`);
      } else if (clause.category === 'penalties') {
        questions.push(`Can we negotiate the late fee structure (${clause.clause_id})?`);
      } else {
        questions.push(`Can you clarify the terms around ${clause.category} in ${clause.clause_id}?`);
      }
    }
  });

  // Deduplicate questions just in case
  const uniqueQuestions = [...new Set(questions)];

  return (
    <div className="card">
      <h3>Questions to ask before you sign</h3>
      {uniqueQuestions.length === 0 ? (
        <p style={{color: '#666', marginTop: '1rem', fontSize: '0.9rem'}}>
          No major red flags detected, but always read carefully!
        </p>
      ) : (
        <div style={{marginTop: '1rem'}}>
          {uniqueQuestions.map((q, idx) => (
            <div key={idx} className="checklist-item">
              <input type="checkbox" id={`q-${idx}`} />
              <label htmlFor={`q-${idx}`} style={{fontSize: '0.9rem'}}>{q}</label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
