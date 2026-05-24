import { useState, useRef } from 'react'
import { structureInput } from '../services/claude'
import { addSession, generateId, getSettings } from '../services/storage'

const PROMPT = 'どういう判断をしましたか？最近の意思決定、気になっていること、考えていることを自由に話してください。音声でも文章でも、思ったままに流し込んでください。'

const hasVoiceSupport = typeof window !== 'undefined' &&
  !!(window.SpeechRecognition || window.webkitSpeechRecognition)

export default function Dialogue({ onClose }) {
  const [text, setText] = useState('')
  const [interim, setInterim] = useState('')
  const [listening, setListening] = useState(false)
  const [structuring, setStructuring] = useState(false)
  const [structured, setStructured] = useState(null)
  const [error, setError] = useState('')
  const [showRaw, setShowRaw] = useState(false)
  const [sessionId] = useState(() => generateId())
  const recognitionRef = useRef(null)

  function toggleVoice() {
    if (listening) {
      recognitionRef.current?.stop()
      return
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'ja-JP'
    rec.continuous = true
    rec.interimResults = true
    recognitionRef.current = rec

    let baseText = text
    let voiceCommitted = ''

    rec.onresult = (e) => {
      let newInterim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          voiceCommitted += e.results[i][0].transcript
        } else {
          newInterim += e.results[i][0].transcript
        }
      }
      setText(baseText + voiceCommitted + newInterim)
      setInterim(newInterim)
    }

    rec.onend = () => {
      setText(baseText + voiceCommitted)
      setInterim('')
      setListening(false)
    }

    rec.onerror = () => {
      setInterim('')
      setListening(false)
    }

    rec.start()
    setListening(true)
  }

  function handleTextChange(e) {
    setText(e.target.value)
    if (listening) {
      recognitionRef.current?.stop()
    }
  }

  async function handleSubmit() {
    const trimmed = text.trim()
    if (!trimmed || structuring) return

    recognitionRef.current?.stop()
    setListening(false)
    setInterim('')
    setStructuring(true)
    setError('')

    const { apiKey } = getSettings()

    try {
      const result = await structureInput(trimmed, apiKey)
      setStructured(result)
      addSession({
        id: sessionId,
        startedAt: new Date().toISOString(),
        rawInput: trimmed,
        structured: result,
      })
    } catch (err) {
      setError(`整理に失敗しました: ${err.message}`)
    } finally {
      setStructuring(false)
    }
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>
          {structured ? '整理された記録' : '意思決定を話す'}
        </span>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
      </div>

      <div style={{ padding: '20px' }}>
        {!structured && !structuring && (
          <>
            <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.7 }}>
              {PROMPT}
            </p>

            <textarea
              className="chat-textarea"
              style={{ width: '100%', minHeight: 180, maxHeight: 'none', resize: 'vertical', marginBottom: 8 }}
              placeholder="今日の判断、考えていること、気になっていること…"
              value={text}
              onChange={handleTextChange}
              rows={8}
            />

            {listening && interim && (
              <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8, fontStyle: 'italic' }}>
                {interim}
              </p>
            )}

            {listening && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--danger)', marginBottom: 10 }}>
                <span className="recording-dot" />
                録音中…
              </div>
            )}

            {error && (
              <p style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 12 }}>{error}</p>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              {hasVoiceSupport && (
                <button
                  className={`btn ${listening ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={toggleVoice}
                  style={{ flexShrink: 0 }}
                >
                  {listening ? '⏹ 停止' : '🎤 音声入力'}
                </button>
              )}
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={!text.trim()}
                style={{ flex: 1 }}
              >
                送信して整理する
              </button>
            </div>
          </>
        )}

        {structuring && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text2)' }}>
            <div className="typing-indicator" style={{ justifyContent: 'center', marginBottom: 12 }}>
              <div className="dot" /><div className="dot" /><div className="dot" />
            </div>
            <p style={{ fontSize: 14 }}>AIが内容を整理しています…</p>
          </div>
        )}

        {structured && (
          <>
            <div className="summary-box">
              <div className="summary-title">✦ 構造化された記録</div>

              <p style={{ fontSize: 13, color: 'var(--text)', marginBottom: 16, lineHeight: 1.65 }}>
                {structured.overview}
              </p>

              {structured.decisions?.map((d, i) => (
                <div key={i} className="summary-point" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                  <span className="summary-point-topic">{d.title}</span>
                  <span className="summary-point-text">{d.detail}</span>
                  {d.reasoning && (
                    <span style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>
                      背景: {d.reasoning}
                    </span>
                  )}
                </div>
              ))}

              {structured.context && (
                <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 12, padding: '8px 12px', background: 'rgba(79,124,110,0.06)', borderRadius: 6 }}>
                  {structured.context}
                </p>
              )}

              {structured.keywords?.length > 0 && (
                <div className="keywords">
                  {structured.keywords.map((k, i) => (
                    <span key={i} className="keyword">{k}</span>
                  ))}
                </div>
              )}
            </div>

            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowRaw(!showRaw)}
              style={{ marginTop: 12, fontSize: 12, color: 'var(--text3)' }}
            >
              {showRaw ? '元の入力を隠す' : '元の入力を確認する'}
            </button>

            {showRaw && (
              <div className="raw-input-box" style={{ marginTop: 8 }}>
                {text}
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={onClose}
              style={{ width: '100%', marginTop: 16 }}
            >
              完了
            </button>
          </>
        )}
      </div>
    </div>
  )
}
