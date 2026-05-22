import { useState, useEffect, useCallback } from 'react'
import { getSettings, saveSettings } from './services/storage'
import Setup from './components/Setup'
import Dashboard from './components/Dashboard'
import Dialogue from './components/Dialogue'
import LogHistory from './components/LogHistory'
import TrendView from './components/TrendView'
import PopupNotification from './components/PopupNotification'

function isTimeForPopup(settings) {
  if (!settings.lastPopupAt) return true
  const elapsed = Date.now() - new Date(settings.lastPopupAt).getTime()
  return elapsed >= settings.intervalMinutes * 60 * 1000
}

export default function App() {
  const [settings, setSettings] = useState(() => getSettings())
  const [view, setView] = useState('dashboard')
  const [showPopup, setShowPopup] = useState(false)
  const [dialogueActive, setDialogueActive] = useState(false)

  const isSetup = !settings.apiKey

  const dismissPopup = useCallback(() => {
    const updated = { ...getSettings(), lastPopupAt: new Date().toISOString() }
    saveSettings(updated)
    setSettings(updated)
    setShowPopup(false)
  }, [])

  const startDialogue = useCallback(() => {
    setShowPopup(false)
    setDialogueActive(true)
    setView('dashboard')
    const updated = { ...getSettings(), lastPopupAt: new Date().toISOString() }
    saveSettings(updated)
    setSettings(updated)
  }, [])

  useEffect(() => {
    if (isSetup) return

    const check = () => {
      const s = getSettings()
      if (isTimeForPopup(s) && !dialogueActive) {
        setShowPopup(true)
      }
    }

    check()
    const id = setInterval(check, 60 * 1000)
    return () => clearInterval(id)
  }, [isSetup, dialogueActive])

  if (isSetup) {
    return <Setup onComplete={() => setSettings(getSettings())} />
  }

  return (
    <div className="app">
      <header className="header">
        <span className="header-title">📓 意思決定ログ</span>
        <nav className="header-nav">
          <button
            className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setView('dashboard'); setDialogueActive(false) }}
          >
            ホーム
          </button>
          <button
            className={`nav-btn ${view === 'history' ? 'active' : ''}`}
            onClick={() => { setView('history'); setDialogueActive(false) }}
          >
            ログ
          </button>
          <button
            className={`nav-btn ${view === 'trends' ? 'active' : ''}`}
            onClick={() => { setView('trends'); setDialogueActive(false) }}
          >
            傾向
          </button>
          <button
            className="nav-btn"
            onClick={() => {
              if (confirm('設定を変更しますか？APIキーの再入力が必要です。')) {
                saveSettings({ ...getSettings(), apiKey: '' })
                setSettings(getSettings())
              }
            }}
          >
            設定
          </button>
        </nav>
      </header>

      <main className="main">
        {dialogueActive ? (
          <Dialogue onClose={() => setDialogueActive(false)} />
        ) : view === 'dashboard' ? (
          <Dashboard onStartDialogue={startDialogue} />
        ) : view === 'history' ? (
          <LogHistory />
        ) : (
          <TrendView />
        )}
      </main>

      {showPopup && !dialogueActive && (
        <PopupNotification onStart={startDialogue} onDismiss={dismissPopup} />
      )}
    </div>
  )
}
