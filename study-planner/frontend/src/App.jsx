import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Calendar from './components/Calendar.jsx'
import DailyPlan from './components/DailyPlan.jsx'
import SubjectManager from './components/SubjectManager.jsx'
import ProgressDashboard from './components/ProgressDashboard.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import SemesterSwitcher from './components/SemesterSwitcher.jsx'
import Navbar from './components/Navbar.jsx'
import AIAssistant from './components/AIAssistant.jsx'

export default function App() {
  const [entered, setEntered] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null
    const stored = window.localStorage.getItem('study-planner:user')
    return stored ? JSON.parse(stored) : null
  })

  useEffect(() => {
    if (user) {
      setEntered(true)
    }
  }, [user])

  async function handleAuthSubmit(e) {
    e.preventDefault()
    setAuthMessage('')

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'}/auth/${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed')
      }

      window.localStorage.setItem('study-planner:user', JSON.stringify(data.user))
      window.localStorage.setItem('study-planner:token', data.token)
      setUser(data.user)
      setPassword('')
      setAuthMessage(`${authMode === 'login' ? 'Logged in' : 'Account created'} successfully`)
    } catch (err) {
      setAuthMessage(err.message)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-ink text-linen flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-linen/10 bg-surface p-6 shadow-xl">
          <h1 className="font-display text-3xl font-semibold">Study Planner</h1>
          <p className="text-sm text-linen/70 mt-2">Sign in to keep your own study plan private and synced.</p>
          <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full rounded-lg border border-linen/15 bg-ink px-3 py-2 text-sm"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Password"
              className="w-full rounded-lg border border-linen/15 bg-ink px-3 py-2 text-sm"
            />
            <button className="w-full rounded-full bg-marigold px-4 py-2 text-sm font-semibold text-ink">
              {authMode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>
          <div className="mt-4 text-sm text-linen/70">
            {authMessage && <p className="mb-3 text-rollover">{authMessage}</p>}
            <button
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login')
                setAuthMessage('')
              }}
              className="text-marigold underline"
            >
              {authMode === 'login' ? 'Create an account' : 'Back to login'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-ink text-linen">
      {/* Calendar landing intro */}
      <Calendar onEnter={() => setEntered(true)} />

      {/* Main dashboard sections */}
      {entered && (
        <motion.main
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Navbar />
          <div className="px-4 sm:px-6 md:px-10 lg:px-16 pt-4">
            <div className="flex items-center justify-between rounded-full border border-linen/10 bg-surface/80 px-4 py-2 text-sm text-linen/70">
              <span>Signed in as <strong>{user.username}</strong></span>
              <button
                onClick={() => {
                  window.localStorage.removeItem('study-planner:user')
                  window.localStorage.removeItem('study-planner:token')
                  setUser(null)
                  setEntered(false)
                }}
                className="text-marigold underline"
              >
                Logout
              </button>
            </div>
          </div>
          <header className="px-4 sm:px-6 md:px-10 lg:px-16 pt-8 sm:pt-12 pb-4 max-w-5xl mx-auto">
            <p className="font-body text-[11px] sm:text-xs uppercase tracking-[0.25em] text-marigold font-semibold">
              Parakram GATE-CS 2027 · MAKAUT IT · Placement & Coding
            </p>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-linen mt-2 leading-tight">
              One Plan. Topic Mastery. Zero Excuses.
            </h1>
          </header>

          <DailyPlan />
          <SubjectManager />
          <ProgressDashboard />
          <AIAssistant />
          <SettingsPanel />
          <SemesterSwitcher />
        </motion.main>
      )}
    </div>
  )
}
