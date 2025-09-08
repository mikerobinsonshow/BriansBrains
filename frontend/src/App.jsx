import { useState, useRef, useEffect } from 'react'
import './App.css'

export default function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [botState, setBotState] = useState('idle')
  const answerTimer = useRef(null)
  const questionTimer = useRef(null)
  const [questionMarks, setQuestionMarks] = useState([])

  useEffect(() => {
    return () => {
      if (answerTimer.current) clearTimeout(answerTimer.current)
      if (questionTimer.current) clearInterval(questionTimer.current)
    }
  }, [])

  const spawnQuestionMark = () => {
    const id = Date.now()
    const x = Math.random() * 60 - 30
    setQuestionMarks((q) => [...q, { id, x }])
    setTimeout(() => {
      setQuestionMarks((q) => q.filter((m) => m.id !== id))
    }, 1500)
  }

  const send = async () => {
    if (!input.trim()) return
    const user = { role: 'user', text: input }
    setMessages((m) => [...m, user])
    setInput('')
    if (answerTimer.current) {
      clearTimeout(answerTimer.current)
      answerTimer.current = null
    }
    setBotState('thinking')
    spawnQuestionMark()
    if (questionTimer.current) {
      clearInterval(questionTimer.current)
      questionTimer.current = null
    }
    questionTimer.current = setInterval(spawnQuestionMark, 5000)
    try {
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: user.text }),
      })
      const data = await res.json()
      setMessages((m) => [...m, { role: 'assistant', text: data.text, citations: data.citations }])
      setBotState('answer')
      answerTimer.current = setTimeout(() => {
        setBotState('idle')
        answerTimer.current = null
        if (questionTimer.current) {
          clearInterval(questionTimer.current)
          questionTimer.current = null
        }
        setQuestionMarks([])
      }, 15000)
    } catch (e) {
      setBotState('idle')
      if (questionTimer.current) {
        clearInterval(questionTimer.current)
        questionTimer.current = null
      }
      setQuestionMarks([])
    }
  }

  const clear = () => {
    setMessages([])
    setBotState('idle')
    if (answerTimer.current) {
      clearTimeout(answerTimer.current)
      answerTimer.current = null
    }
    if (questionTimer.current) {
      clearInterval(questionTimer.current)
      questionTimer.current = null
    }
    setQuestionMarks([])
  }

  const botImages = {
    idle: '/todidle.jpg',
    thinking: '/todthinking.jpg',
    answer: '/todhastheanswer.jpg',
  }

  return (
    <div className="asktod-container">
      <img src="/asktod.png" alt="AskTod logo" className="asktod-logo" />
      <div className="chat-layout">
        <div className="bot-image-wrapper">
          <img
            src={botImages[botState]}
            alt="AskTod bot"
            className={`bot-image ${botState === 'thinking' ? 'tod-thinking' : ''}`}
          />
          {botState === 'thinking' &&
            questionMarks.map((m) => (
              <span
                key={m.id}
                className="question-mark"
                style={{ '--x-offset': `${m.x}px` }}
              >
                ?
              </span>
            ))}
        </div>
        <img
          src={botImages[botState]}
          alt="AskTod bot"
          className={`bot-image ${botState === 'thinking' ? 'tod-thinking' : ''}`}
        />
        <div className="chat-area">
          <div className="messages">
            {messages.map((m, i) => (
                <div key={i} className="message">
                  <b>{m.role === 'user' ? 'You' : 'AskTod'}:</b> {m.text}
                  {m.citations && (
                      <div style={{fontSize: '0.8em', color: '#666'}}>
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
