import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const syllabusPath = path.join(__dirname, '..', 'data', 'syllabus-updates.json')

const DEFAULT_UPDATES = [
  {
    id: 'seed-1',
    title: 'Syllabus baseline',
    details: 'Start with core subjects and revise them every week.',
    source: 'syllabus'
  }
]

function ensureFile() {
  if (!fs.existsSync(syllabusPath)) {
    fs.writeFileSync(syllabusPath, JSON.stringify(DEFAULT_UPDATES, null, 2))
  }
}

export function loadSyllabusUpdates() {
  ensureFile()
  return JSON.parse(fs.readFileSync(syllabusPath, 'utf-8'))
}

export function addSyllabusUpdate(entry) {
  const updates = loadSyllabusUpdates()
  const next = {
    id: `update-${Date.now()}`,
    title: entry.title || 'Study update',
    details: entry.details || '',
    source: 'syllabus'
  }
  updates.push(next)
  fs.writeFileSync(syllabusPath, JSON.stringify(updates, null, 2))
  return next
}

export function searchKnowledgeBase(query) {
  const normalized = query.toLowerCase()
  const updates = loadSyllabusUpdates()
  return updates.filter((item) => {
    const haystack = `${item.title} ${item.details}`.toLowerCase()
    return haystack.includes(normalized)
  }).map((item) => ({ ...item }))
}
