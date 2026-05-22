import { useState } from 'react'
import { getTrends, saveTrends, getSessions, formatDate } from '../services/storage'
import { generateTrends } from '../services/claude'
import { getSettings } from '../services/storage'

export default function TrendView() {
  const [trends, setTrends] = useState(() => getTrends())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sessions = getSessions()
  const summarizedCount = sessions.filter(s => s.summary).length

  async function handleAnalyze() {
    const { apiKey } = getSettings()
    setLoading(true)
    setError('')
    try {
      const result = await generateTrends(sessions, apiKey)
      const withDate = { ...result, analyzedAt: new Date().toISOString() }
      saveTrends(withDate)
      setTrends(withDate)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">傾向分析</h2>
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleAnalyze}
          disabled={loading || summarizedCount < 1}
        >
          {loading ? '分析中…' : '分析を更新'}
        </button>
      </div>

      {error && (
        <div style={{ background: '#fdecea', border: '1px solid #f5c6c6', borderRadius: 8, padding: 12, fontSize: 13, color: 'var(--danger)', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {!trends && (
        <div className="card">
          <div className="empty-state">
            {summarizedCount === 0
              ? 'まずチェックインを行い、「まとめる」をクリックしてログを作成してください。'
              : `${summarizedCount}件のまとめがあります。「分析を更新」で傾向を表示できます。`}
          </div>
        </div>
      )}

      {trends && (
        <>
          <div className="trend-card">
            <div className="trend-label">最近の焦点</div>
            <div className="trend-text" style={{ fontWeight: 500 }}>
              {trends.recentFocus}
            </div>
          </div>

          <div className="trend-card">
            <div className="trend-label">意識の傾向</div>
            <div className="trend-text">{trends.currentTendencies}</div>
          </div>

          {trends.keyPoints?.length > 0 && (
            <div className="trend-card">
              <div className="trend-label">把握できていること</div>
              {trends.keyPoints.map((p, i) => (
                <div key={i} className="trend-point">
                  <span className="trend-point-label">{p.point}</span>
                  <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55 }}>
                    {p.understanding}
                  </span>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-muted" style={{ textAlign: 'right' }}>
            更新: {formatDate(trends.analyzedAt)}　対象ログ: {summarizedCount}件
          </p>
        </>
      )}
    </div>
  )
}
