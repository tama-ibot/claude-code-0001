import { useState } from 'react'
import { getTrends, saveTrends, getSessions, formatDate, getSettings } from '../services/storage'
import { generateTrends } from '../services/claude'

export default function TrendView() {
  const [trends, setTrends] = useState(() => getTrends())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sessions = getSessions()
  const summarizedCount = sessions.filter(s => s.summary || s.structured).length

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

      {!trends && summarizedCount === 0 && (
        <div className="card">
          <div className="empty-state">
            まずチェックインを行ってログを作成してください。
          </div>
        </div>
      )}

      {!trends && summarizedCount > 0 && (
        <div className="card">
          <div className="empty-state">
            <p style={{ marginBottom: 16 }}>{summarizedCount}件の記録があります。</p>
            <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading}>
              {loading ? '分析中…' : '今すぐ傾向を分析する'}
            </button>
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
