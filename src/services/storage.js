const KEYS = {
  sessions: 'dl_sessions',
  settings: 'dl_settings',
  trends: 'dl_trends',
}

function read(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getSessions() {
  return read(KEYS.sessions, [])
}

export function saveSessions(sessions) {
  write(KEYS.sessions, sessions)
}

export function addSession(session) {
  const sessions = getSessions()
  sessions.unshift(session)
  saveSessions(sessions)
}

export function updateSession(id, updates) {
  const sessions = getSessions()
  const idx = sessions.findIndex(s => s.id === id)
  if (idx !== -1) {
    sessions[idx] = { ...sessions[idx], ...updates }
    saveSessions(sessions)
  }
}

export function getSettings() {
  return read(KEYS.settings, {
    apiKey: '',
    intervalMinutes: 60,
    lastPopupAt: null,
  })
}

export function saveSettings(settings) {
  write(KEYS.settings, settings)
}

export function getTrends() {
  return read(KEYS.trends, null)
}

export function saveTrends(trends) {
  write(KEYS.trends, trends)
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export function formatDate(iso) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now - d
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return 'たった今'
  if (mins < 60) return `${mins}分前`
  if (hours < 24) return `${hours}時間前`
  if (days < 7) return `${days}日前`

  return d.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })
}
