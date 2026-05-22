import { useState, useEffect, useRef } from 'react'
import { sendDialogueMessage, generateSummary } from '../services/claude'
import { addSession, updateSession, generateId, getSettings } from '../services/storage'

const OPENING = 'こんにちは。最近、頭の中でぐるぐると考えていることや、気になっていることはありますか？どんな小さなことでも構いません。'

export default function Dialogue({ onClose, sessionId: existingId }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: OPENING }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState(null)
  const [summarizing, setSummarizing] = useState(false)
  const [sessionId] = useState(() => existingId || generateId())
  const [saved, setSaved] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (!saved) {
      addSession({
        id: sessionId,
        startedAt: new Date().toISOString(),
        messages: [{ role: 'assistant', content: OPENING }],
        summary: null,
      })
      setSaved(true)
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    const { apiKey } = getSettings()
    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const assistantMsg = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, assistantMsg])

    try {
      let full = ''
      await sendDialogueMessage(
        newMessages.map(m => ({ role: m.role, content: m.content })),
        apiKey,
        (chunk, accumulated) => {
          full = accumulated
          setMessages(prev => {
            const next = [...prev]
            next[next.length - 1] = { role: 'assistant', content: accumulated }
            return next
          })
        }
      )

      const finalMessages = [...newMessages, { role: 'assistant', content: full }]
      updateSession(sessionId, { messages: finalMessages })
    } catch (err) {
      setMessages(prev => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', content: `エラーが発生しました: ${err.message}` }
        return next
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSummarize() {
    const { apiKey } = getSettings()
    setSummarizing(true)
    try {
      const result = await generateSummary(
        messages.filter(m => m.content),
        apiKey
      )
      setSummary(result)
      updateSession(sessionId, { summary: result })
    } catch (err) {
      alert(`まとめの生成に失敗しました: ${err.message}`)
    } finally {
      setSummarizing(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const userTurns = messages.filter(m => m.role === 'user').length

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>チェックイン</span>
        <div className="flex items-center gap-2">
          {userTurns >= 2 && !summary && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleSummarize}
              disabled={summarizing || loading}
            >
              {summarizing ? 'まとめ中…' : 'まとめる'}
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <div className="chat-container">
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`message message-${msg.role}`}>
                <div className={`message-avatar avatar-${msg.role}`}>
                  {msg.role === 'assistant' ? 'AI' : 'あ'}
                </div>
                <div className={`message-bubble bubble-${msg.role}`}>
                  {msg.content || (
                    <div className="typing-indicator">
                      <div className="dot" />
                      <div className="dot" />
                      <div className="dot" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {summary && (
            <div className="summary-box">
              <div className="summary-title">
                ✦ 今回の理解まとめ
              </div>
              <p style={{ fontSize: 13, color: 'var(--text)', marginBottom: 14, lineHeight: 1.65 }}>
                {summary.overview}
              </p>
              {summary.points.map((p, i) => (
                <div key={i} className="summary-point">
                  <span className="summary-point-topic">{p.topic}</span>
                  <span className="summary-point-text">{p.understanding}</span>
                </div>
              ))}
              {summary.keywords?.length > 0 && (
                <div className="keywords">
                  {summary.keywords.map((k, i) => (
                    <span key={i} className="keyword">{k}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="chat-input-area">
            <textarea
              ref={textareaRef}
              className="chat-textarea"
              placeholder="思っていることを話してみてください…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
            />
            <button
              className="btn btn-primary"
              onClick={handleSend}
              disabled={!input.trim() || loading}
              style={{ flexShrink: 0 }}
            >
              送信
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
