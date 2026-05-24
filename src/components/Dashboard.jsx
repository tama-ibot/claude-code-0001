import { getSessions, getTrends, formatDate } from '../services/storage'

export default function Dashboard({ onStartDialogue }) {
  const sessions = getSessions().slice(0, 5)
  const trends = getTrends()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'おはようございます' : hour < 18 ? 'こんにちは' : 'こんばんは'

  return (
    <div>
      <div className="dashboard-hero">
        <div className="hero-greeting">{greeting}</div>
        <div className="hero-title">今、何が気になっていますか？</div>
        <button className="hero-btn" onClick={onStartDialogue}>
          チェックインをはじめる →
        </button>
      </div>

      {trends && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">最近の傾向</div>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)' }}>
            {trends.currentTendencies}
          </p>
          {trends.recentFocus && (
            <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 10, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 8 }}>
              💡 {trends.recentFocus}
            </p>
          )}
          <p className="text-xs text-muted mt-2" style={{ textAlign: 'right' }}>
            {formatDate(trends.analyzedAt)}時点
          </p>
        </div>
      )}

      <div className="section-header">
        <h2 className="section-title">最近のログ</h2>
      </div>

      {sessions.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            まだログがありません。<br />
            上のボタンからはじめてみましょう。
          </div>
        </div>
      ) : (
        <div className="card">
          {sessions.map(s => {
            const overview = s.structured?.overview || s.summary?.overview || 'チェックイン'
            const keywords = s.structured?.keywords || s.summary?.keywords || []
            return (
              <div key={s.id} className="session-item" style={{ cursor: 'default' }}>
                <div className="session-meta">
                  <span className="session-date">{formatDate(s.startedAt)}</span>
                  {(s.structured || s.summary) && <span className="session-badge">整理済み</span>}
                </div>
                <div className="session-title">{overview}</div>
                {keywords.length > 0 && (
                  <div className="session-preview">{keywords.join('　・　')}</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
