import { useState } from 'react'
import { getSessions, formatDate } from '../services/storage'

function NewSessionDetail({ session, onClose }) {
  const [showRaw, setShowRaw] = useState(false)
  const { structured } = session

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>{formatDate(session.startedAt)}</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{structured.overview}</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>← 戻る</button>
      </div>

      <div className="summary-box" style={{ marginBottom: 16 }}>
        <div className="summary-title">✦ 構造化された記録</div>

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
        style={{ fontSize: 12, color: 'var(--text3)' }}
      >
        {showRaw ? '元の入力を隠す' : '元の入力を確認する'}
      </button>

      {showRaw && session.rawInput && (
        <div className="raw-input-box" style={{ marginTop: 8 }}>
          {session.rawInput}
        </div>
      )}
    </div>
  )
}

function OldSessionDetail({ session, onClose }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>{formatDate(session.startedAt)}</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>
            {session.summary?.overview || 'チェックイン'}
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>← 戻る</button>
      </div>

      {session.summary && (
        <div className="summary-box" style={{ marginBottom: 20 }}>
          <div className="summary-title">✦ まとめ</div>
          {session.summary.points.map((p, i) => (
            <div key={i} className="summary-point">
              <span className="summary-point-topic">{p.topic}</span>
              <span className="summary-point-text">{p.understanding}</span>
            </div>
          ))}
          {session.summary.keywords?.length > 0 && (
            <div className="keywords">
              {session.summary.keywords.map((k, i) => (
                <span key={i} className="keyword">{k}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card-title">対話内容</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(session.messages || []).map((msg, i) => (
          <div key={i} className={`message message-${msg.role}`}>
            <div className={`message-avatar avatar-${msg.role}`}>
              {msg.role === 'assistant' ? 'AI' : 'あ'}
            </div>
            <div className={`message-bubble bubble-${msg.role}`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LogHistory() {
  const sessions = getSessions()
  const [selected, setSelected] = useState(null)

  if (selected) {
    const session = sessions.find(s => s.id === selected)
    if (session) {
      return session.structured
        ? <NewSessionDetail session={session} onClose={() => setSelected(null)} />
        : <OldSessionDetail session={session} onClose={() => setSelected(null)} />
    }
  }

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">ログ一覧</h2>
        <span className="text-sm text-muted">{sessions.length}件</span>
      </div>

      {sessions.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            まだログがありません。<br />
            ダッシュボードからチェックインをはじめてみましょう。
          </div>
        </div>
      ) : (
        <div className="card">
          {sessions.map(s => {
            const overview = s.structured?.overview || s.summary?.overview || 'チェックイン'
            const keywords = s.structured?.keywords || s.summary?.keywords || []
            const hasStructure = !!(s.structured || s.summary)
            return (
              <div key={s.id} className="session-item" onClick={() => setSelected(s.id)}>
                <div className="session-meta">
                  <span className="session-date">{formatDate(s.startedAt)}</span>
                  {hasStructure && <span className="session-badge">整理済み</span>}
                </div>
                <div className="session-title">{overview}</div>
                {keywords.length > 0 && (
                  <div className="session-preview">
                    {keywords.join('　・　')}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
