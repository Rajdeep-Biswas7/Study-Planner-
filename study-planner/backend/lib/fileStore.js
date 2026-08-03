// Persistent JSON file store — reads/writes data to JSON files in data/.
// Vercel compatible: uses /tmp/data when deployed on Vercel serverless functions.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { AsyncLocalStorage } from 'async_hooks'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SOURCE_DATA_DIR = path.join(__dirname, '..', 'data')
const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'data')
  : SOURCE_DATA_DIR
const LOCK_FILE = '.json-write.lock'
const userStorage = new AsyncLocalStorage()

function ensureDir(targetDir) {
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true })
}

function normalizeUserId(userId) {
  const value = String(userId || 'default').trim().toLowerCase()
  const cleaned = value.replace(/[^a-z0-9._-]/g, '_')
  return cleaned || 'default'
}

export function runWithUser(userId, fn) {
  return userStorage.run(normalizeUserId(userId), fn)
}

export function getCurrentUserId() {
  return userStorage.getStore() || 'default'
}

export function getDataFilePath(name, userId = getCurrentUserId()) {
  const safeUserId = normalizeUserId(userId)
  const targetDir = safeUserId === 'default'
    ? DATA_DIR
    : path.join(DATA_DIR, 'users', safeUserId)
  ensureDir(targetDir)
  return path.join(targetDir, name)
}

function withFileLock(fn) {
  ensureDir(DATA_DIR)

  const lockPath = path.join(DATA_DIR, LOCK_FILE)
  const deadline = Date.now() + 5000

  while (Date.now() < deadline) {
    try {
      const fd = fs.openSync(lockPath, 'wx')
      try {
        return fn()
      } finally {
        fs.closeSync(fd)
        if (fs.existsSync(lockPath)) {
          fs.unlinkSync(lockPath)
        }
      }
    } catch (err) {
      if (err.code !== 'EEXIST') throw err
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 25)
    }
  }

  throw new Error('Timed out waiting for data file lock')
}

function writeAtomically(name, data, userId = getCurrentUserId()) {
  const p = getDataFilePath(name, userId)
  const tempPath = path.join(path.dirname(p), `${path.basename(name)}.tmp`)
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2))
  fs.renameSync(tempPath, p)
}

export function loadJSON(name, fallback = null) {
  const userId = getCurrentUserId()
  const p = getDataFilePath(name, userId)
  
  if (!fs.existsSync(p)) {
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
  withFileLock(() => {
    const userId = getCurrentUserId()
    writeAtomically(name, data, userId)
  })
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
