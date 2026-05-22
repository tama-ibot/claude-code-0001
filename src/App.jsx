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

  function handleSettings() {
    if (confirm('設定を変更しますか？APIキーの再入力が必要です。')) {
      saveSettings({ ...getSettings(), apiKey: '' })
      setSettings(getSettings())
    }
  }

  const navItems = [
    { id: 'dashboard', label: 'ホーム', icon: '⌂' },
    { id: 'history',   label: 'ログ',   icon: '≡' },
    { id: 'trends',    label: '傾向',   icon: '∿' },
  ]

  return (
    <div className="app">
      <header className="header">
        <span className="header-title">📓 意思決定ログ</span>
        <nav className="header-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-btn ${view === item.id && !dialogueActive ? 'active' : ''}`}
              onClick={() => { setView(item.id); setDialogueActive(false) }}
            >
              {item.label}
            </button>
          ))}
          <button className="nav-btn" onClick={handleSettings}>設定</button>
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

      <nav className="bottom-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`bottom-nav-item ${view === item.id && !dialogueActive ? 'active' : ''}`}
            onClick={() => { setView(item.id); setDialogueActive(false) }}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
        <button className="bottom-nav-item" onClick={handleSettings}>
          <span className="bottom-nav-icon">⚙</span>
          <span>設定</span>
        </button>
      </nav>

      {showPopup && !dialogueActive && (
        <PopupNotification onStart={startDialogue} onDismiss={dismissPopup} />
      )}
    </div>
  )
}
