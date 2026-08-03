import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { getDataFilePath } from './fileStore.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AUTH_FILE = 'auth.json'
const TOKENS_FILE = 'tokens.json'

function readJSON(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2))
    return structuredClone(fallback)
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

function authPath() {
  return getDataFilePath(AUTH_FILE, 'default')
}

function tokensPath() {
  return getDataFilePath(TOKENS_FILE, 'default')
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

function createToken(user) {
  return crypto.randomBytes(24).toString('hex')
}

export function registerUser({ username, password }) {
  const safeUsername = String(username || '').trim().toLowerCase()
  if (!safeUsername || !String(password || '').trim()) {
    throw new Error('Username and password are required')
  }

  const authData = readJSON(authPath(), { users: [] })
  if (authData.users.some((u) => u.username === safeUsername)) {
    throw new Error('Username already exists')
  }

  const user = {
    id: `user-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    username: safeUsername,
    passwordHash: hashPassword(String(password))
  }

  authData.users.push(user)
  writeJSON(authPath(), authData)
  return { id: user.id, username: user.username }
}

export function loginUser({ username, password }) {
  const safeUsername = String(username || '').trim().toLowerCase()
  const authData = readJSON(authPath(), { users: [] })
  const user = authData.users.find((u) => u.username === safeUsername)

  if (!user || user.passwordHash !== hashPassword(String(password))) {
    throw new Error('Invalid username or password')
  }

  const token = createToken(user)
  const tokens = readJSON(tokensPath(), {})
  tokens[token] = { userId: user.id, username: user.username, createdAt: new Date().toISOString() }
  writeJSON(tokensPath(), tokens)
  return { token, user: { id: user.id, username: user.username } }
}

export function verifyToken(token) {
  const tokens = readJSON(tokensPath(), {})
  const record = tokens[token]
  return record ? { id: record.userId, username: record.username } : null
}

export function removeToken(token) {
  const tokens = readJSON(tokensPath(), {})
  delete tokens[token]
  writeJSON(tokensPath(), tokens)
}
