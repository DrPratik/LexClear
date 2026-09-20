export default function PriorityActions({ actions }) {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="card priority-actions">
      <h3 style={{ color: 'var(--risk-high)', marginBottom: '1rem' }}>Priority Actions</h3>
      <ul style={{ paddingLeft: '1.2rem' }}>
        {actions.sort((a, b) => a.priority - b.priority).map((action, idx) => (
          <li key={idx} style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>
            <strong>Clause {action.clause}:</strong> {action.reason}
          </li>
        ))}
      </ul>
    </div>
  );
}
