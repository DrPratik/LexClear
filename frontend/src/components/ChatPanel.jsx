import { useState, useRef, useEffect } from 'react';

export default function ChatPanel({ leaseText }) {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Have questions about your lease? Ask me here!', citations: [] }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMsg, text: leaseText })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: data.answer,
        citations: data.cited_clauses || []
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, I encountered an error answering that.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card chat-container">
      <h3>Q&A</h3>
      <div className="chat-history">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.role}`}>
            <p style={{fontSize: '0.9rem'}}>{msg.text}</p>
            {msg.citations && msg.citations.length > 0 && (
              <div className="chat-citations">
                Source: {msg.citations.join(', ')}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="chat-message bot" aria-live="polite">
            <p style={{fontSize: '0.9rem'}}>Thinking...</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-input" onSubmit={handleSend}>
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a question..."
          aria-label="Ask a question about the lease"
          disabled={loading}
        />
        <button type="submit" aria-label="Send question" disabled={loading || !input.trim()}>Send</button>
      </form>
    </div>
  );
}
