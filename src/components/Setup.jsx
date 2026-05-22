import { useState } from 'react'
import { getSettings, saveSettings } from '../services/storage'

export default function Setup({ onComplete }) {
  const saved = getSettings()
  const [apiKey, setApiKey] = useState(saved.apiKey || '')
  const [interval, setInterval] = useState(saved.intervalMinutes || 60)
  const [error, setError] = useState('')

  function handleSave() {
    if (!apiKey.trim()) {
      setError('APIキーを入力してください')
      return
    }
    saveSettings({ apiKey: apiKey.trim(), intervalMinutes: Number(interval), lastPopupAt: null })
    onComplete()
  }

  return (
    <div className="setup-container">
      <div className="setup-header">
        <div className="setup-icon">📓</div>
        <h1 className="setup-heading">意思決定ログ</h1>
        <p className="setup-sub">
          定期的なチェックインで、あなたの思考の流れを記録・分析します。
        </p>
      </div>

      <div className="card">
        <div className="warning-box">
          ⚠️ APIキーはブラウザのローカルストレージに保存されます。個人のデバイスでのみご使用ください。
        </div>

        <div className="form-group">
          <label className="label">Anthropic APIキー</label>
          <input
            type="password"
            className="input"
            placeholder="sk-ant-..."
            value={apiKey}
            onChange={e => { setApiKey(e.target.value); setError('') }}
          />
          {error && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>{error}</p>}
          <p className="text-xs text-muted mt-2">
            <a
              href="https://console.anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent)' }}
            >
              console.anthropic.com
            </a>
            {' '}でAPIキーを取得できます
          </p>
        </div>

        <div className="form-group">
          <label className="label">チェックインの間隔</label>
          <select
            className="input"
            value={interval}
            onChange={e => setInterval(e.target.value)}
          >
            <option value={15}>15分ごと</option>
            <option value={30}>30分ごと</option>
            <option value={60}>1時間ごと</option>
            <option value={120}>2時間ごと</option>
            <option value={240}>4時間ごと</option>
          </select>
        </div>

        <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSave}>
          はじめる
        </button>
      </div>
    </div>
  )
}
