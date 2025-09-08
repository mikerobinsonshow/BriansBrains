import { useState } from 'react'

export default function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')

  const send = async () => {
    if (!input.trim()) return
    const user = { role: 'user', text: input }
    setMessages((m) => [...m, user])
    setInput('')
    const res = await fetch('http://localhost:8000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: user.text }),
    })
    const data = await res.json()
    setMessages((m) => [...m, { role: 'assistant', text: data.text, citations: data.citations }])
  }

  const clear = () => setMessages([])

  return (
    <div style={{ padding: '1rem', fontFamily: 'sans-serif' }}>
      <h2>Local RAG Chat</h2>
      <div style={{ minHeight: '200px', border: '1px solid #ccc', padding: '0.5rem' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: '0.5rem' }}>
            <b>{m.role === 'user' ? 'You' : 'Assistant'}:</b> {m.text}
            {m.citations && (
              <div style={{ fontSize: '0.8em', color: '#666' }}>
                {m.citations.join(' | ')}
              </div>
            )}
          </div>
        ))}
      </div>
      <input
        style={{ width: '80%', padding: '0.5rem', marginTop: '0.5rem' }}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' ? send() : null}
      />
      <button onClick={send} style={{ marginLeft: '0.5rem' }}>Send</button>
      <button onClick={clear} style={{ marginLeft: '0.5rem' }}>Clear</button>
    </div>
  )
}
