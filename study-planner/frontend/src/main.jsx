import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'

const USER_ID_KEY = 'study-planner:user-id'

function getOrCreateUserId() {
  if (typeof window === 'undefined') return 'default'

  const stored = window.localStorage.getItem(USER_ID_KEY)
  if (stored) return stored

  const userId = window.crypto?.randomUUID?.() || `user-${Date.now()}-${Math.random().toString(16).slice(2)}`
  window.localStorage.setItem(USER_ID_KEY, userId)
  return userId
}

const currentUserId = getOrCreateUserId()
const originalFetch = window.fetch.bind(window)

window.fetch = (input, init = {}) => {
  const headers = new Headers(init?.headers || {})
  headers.set('x-user-id', currentUserId)

  const token = window.localStorage.getItem('study-planner:token')
  if (token) {
    headers.set('authorization', `Bearer ${token}`)
  }

  return originalFetch(input, {
    ...init,
    headers
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
