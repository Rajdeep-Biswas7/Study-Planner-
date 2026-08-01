// Persistent JSON file store — reads/writes data to JSON files in data/.
// Vercel compatible: uses /tmp/data when deployed on Vercel serverless functions.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SOURCE_DATA_DIR = path.join(__dirname, '..', 'data')
const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'data')
  : SOURCE_DATA_DIR

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

function filePath(name) {
  return path.join(DATA_DIR, name)
}

export function loadJSON(name, fallback = null) {
  ensureDir()
  const p = filePath(name)
  
  if (!fs.existsSync(p)) {
    // Check if source seed data exists in backend/data
    const sourcePath = path.join(SOURCE_DATA_DIR, name)
    if (fs.existsSync(sourcePath)) {
      try {
        const seedData = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'))
        saveJSON(name, seedData)
        return structuredClone(seedData)
      } catch (err) {
        console.error(`Failed to read seed file ${sourcePath}:`, err)
      }
    }

    if (fallback !== null) {
      saveJSON(name, fallback)
    }
    return fallback !== null ? structuredClone(fallback) : null
  }

  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'))
  } catch {
    return fallback !== null ? structuredClone(fallback) : null
  }
}

export function saveJSON(name, data) {
  ensureDir()
  fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2))
}

export function updateJSON(name, mutator, fallback = null) {
  const data = loadJSON(name, fallback)
  const result = mutator(data)
  saveJSON(name, result !== undefined ? result : data)
  return result !== undefined ? result : data
}

// ── Study sessions store ──────────────────────────────────────────────
const SESSIONS_FILE = 'study-sessions.json'

export function loadSessions() {
  return loadJSON(SESSIONS_FILE, [])
}

export function saveSessions(sessions) {
  saveJSON(SESSIONS_FILE, sessions)
}

export function addSession(session) {
  const sessions = loadSessions()
  sessions.push(session)
  saveSessions(sessions)
  return session
}

export function updateSession(sessionId, updates) {
  const sessions = loadSessions()
  const idx = sessions.findIndex((s) => s.id === sessionId)
  if (idx < 0) return null
  sessions[idx] = { ...sessions[idx], ...updates }
  saveSessions(sessions)
  return sessions[idx]
}

// ── Daily plans store ─────────────────────────────────────────────────
const PLANS_FILE = 'daily-plans.json'

export function loadDailyPlans() {
  return loadJSON(PLANS_FILE, {})
}

export function saveDailyPlans(plans) {
  saveJSON(PLANS_FILE, plans)
}

export function getDailyPlan(dateStr) {
  const plans = loadDailyPlans()
  return plans[dateStr] || null
}

export function saveDailyPlan(dateStr, plan) {
  const plans = loadDailyPlans()
  plans[dateStr] = plan
  saveDailyPlans(plans)
  return plan
}

// ── Chat history store ────────────────────────────────────────────────
const CHAT_FILE = 'chat-history.json'

export function loadChatHistory() {
  return loadJSON(CHAT_FILE, [])
}

export function saveChatHistory(messages) {
  const trimmed = messages.slice(-100)
  saveJSON(CHAT_FILE, trimmed)
}

export function addChatMessage(message) {
  const messages = loadChatHistory()
  messages.push(message)
  saveChatHistory(messages)
  return message
}
