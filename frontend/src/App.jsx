import { useState } from 'react'
import './App.css'

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
    <div className="asktod-container">
      <h2>AskTod</h2>
      <div className="chat-layout">
        <img src="https://twemoji.maxcdn.com/v/latest/svg/1f916.svg" alt="AskTod bot" className="bot-image" />
        <div className="chat-area">
          <div className="messages">
            {messages.map((m, i) => (
              <div key={i} className="message">
                <b>{m.role === 'user' ? 'You' : 'AskTod'}:</b> {m.text}
                {m.citations && (
                  <div style={{ fontSize: '0.8em', color: '#666' }}>
                    {m.citations.join(' | ')}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="input-area">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => (e.key === 'Enter' ? send() : null)}
              placeholder="Type your question here..."
            />
            <div className="buttons">
              <button onClick={send}>Send</button>
              <button onClick={clear}>Clear</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
