import { useState } from 'react'
import { getSessions, formatDate } from '../services/storage'

function SessionDetail({ session, onClose }) {
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
        {session.messages.map((msg, i) => (
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
      return <SessionDetail session={session} onClose={() => setSelected(null)} />
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
          {sessions.map(s => (
            <div key={s.id} className="session-item" onClick={() => setSelected(s.id)}>
              <div className="session-meta">
                <span className="session-date">{formatDate(s.startedAt)}</span>
                {s.summary && <span className="session-badge">まとめあり</span>}
              </div>
              <div className="session-title">
                {s.summary?.overview || 'チェックイン'}
              </div>
              {s.summary?.keywords?.length > 0 && (
                <div className="session-preview">
                  {s.summary.keywords.join('　・　')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
