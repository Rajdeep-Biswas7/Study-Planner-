// Central data store with JSON file persistence.
// All routes import from here. Subjects, topics, study sessions, and daily
// plans all persist to disk so nothing is lost on server restart.

import { loadJSON, saveJSON, loadDailyPlans, saveDailyPlans, loadSessions, saveSessions } from './fileStore.js'

const SUBJECTS_FILE = 'subjects.json'

// ── Subject data (loaded from disk, cached in memory, saved on mutation) ──
let _subjectData = null

function loadSubjectData() {
  if (!_subjectData) {
    _subjectData = loadJSON(SUBJECTS_FILE)
  }
  return _subjectData
}

function saveSubjectData() {
  if (_subjectData) saveJSON(SUBJECTS_FILE, _subjectData)
}

// ── Public API ────────────────────────────────────────────────────────

export function getSubjectData() {
  return loadSubjectData()
}

// Mutable state (daily plans keyed by date)
export const state = {
  get dailyPlans() { return loadDailyPlans() },
  set dailyPlans(v) { saveDailyPlans(v) },
  archivedSemesters: [],
  get semesters() { return loadSubjectData().semesters },
  get evergreen() { return loadSubjectData().evergreen }
}

export function getActiveSemester() {
  const data = loadSubjectData()
  return data.semesters.find((s) => s.status === 'active')
}

export function getUpcomingSemester() {
  const data = loadSubjectData()
  return data.semesters.find((s) => s.status === 'upcoming')
}

export function getAllActiveSubjects() {
  const data = loadSubjectData()
  const sem = data.semesters.find((s) => s.status === 'active')
  const semSubjects = sem ? sem.subjects : []
  return [...semSubjects, ...data.evergreen]
}

export function getAllSubjectsGrouped() {
  const data = loadSubjectData()
  const activeSem = data.semesters.find((s) => s.status === 'active')
  
  const makaut = activeSem ? activeSem.subjects.filter(s => s.category === 'makaut' || s.category === 'makaut+gate') : []
  const gate = data.evergreen.filter(s => s.category === 'gate')
  const placement = data.evergreen.filter(s => s.category === 'placement')
  const coding = data.evergreen.filter(s => s.category === 'coding')
  const custom = data.evergreen.filter(s => s.category === 'custom')

  return { makaut, gate, placement, coding, custom, all: [...makaut, ...gate, ...placement, ...coding, ...custom] }
}

export function getSubjectById(subjectId) {
  const all = getAllActiveSubjects()
  return all.find(s => s.id === subjectId) || null
}

// ── Subject mutations ─────────────────────────────────────────────────

export function addSubject(subject) {
  const data = loadSubjectData()
  const newSubject = {
    id: subject.id || `custom-${Date.now()}`,
    name: subject.name,
    category: subject.category || 'custom',
    topics: (subject.topics || []).map((t, i) => ({
      id: `${subject.id || 'custom'}-t${i + 1}`,
      name: typeof t === 'string' ? t : t.name,
      completed: false
    }))
  }
  
  // Add to evergreen (custom subjects go there)
  data.evergreen.push(newSubject)
  saveSubjectData()
  return newSubject
}

export function updateSubject(subjectId, updates) {
  const data = loadSubjectData()
  
  // Search in all semesters and evergreen
  for (const sem of data.semesters) {
    const idx = sem.subjects.findIndex(s => s.id === subjectId)
    if (idx >= 0) {
      sem.subjects[idx] = { ...sem.subjects[idx], ...updates }
      saveSubjectData()
      return sem.subjects[idx]
    }
  }
  
  const idx = data.evergreen.findIndex(s => s.id === subjectId)
  if (idx >= 0) {
    data.evergreen[idx] = { ...data.evergreen[idx], ...updates }
    saveSubjectData()
    return data.evergreen[idx]
  }
  
  return null
}

export function deleteSubject(subjectId) {
  const data = loadSubjectData()
  data.evergreen = data.evergreen.filter(s => s.id !== subjectId)
  saveSubjectData()
  return true
}

// ── Topic mutations ───────────────────────────────────────────────────

export function addTopic(subjectId, topicName) {
  const subject = findSubjectMutable(subjectId)
  if (!subject) return null
  
  const newTopic = {
    id: `${subjectId}-t${Date.now()}`,
    name: topicName,
    completed: false
  }
  subject.topics.push(newTopic)
  saveSubjectData()
  return newTopic
}

export function updateTopic(subjectId, topicId, updates) {
  const subject = findSubjectMutable(subjectId)
  if (!subject) return null
  
  const topic = subject.topics.find(t => t.id === topicId)
  if (!topic) return null
  
  if (updates.name !== undefined) topic.name = updates.name
  if (updates.completed !== undefined) {
    topic.completed = updates.completed
    topic.completedDate = updates.completed ? new Date().toISOString() : null
  }
  
  saveSubjectData()
  return topic
}

export function deleteTopic(subjectId, topicId) {
  const subject = findSubjectMutable(subjectId)
  if (!subject) return false
  
  subject.topics = subject.topics.filter(t => t.id !== topicId)
  saveSubjectData()
  return true
}

function findSubjectMutable(subjectId) {
  const data = loadSubjectData()
  for (const sem of data.semesters) {
    const s = sem.subjects.find(s => s.id === subjectId)
    if (s) return s
  }
  return data.evergreen.find(s => s.id === subjectId) || null
}

// ── Subject name updates (for settings panel) ────────────────────────

export function updateSubjectName(subjectId, newName) {
  const subject = findSubjectMutable(subjectId)
  if (!subject) return null
  subject.name = newName.trim() || subject.name
  saveSubjectData()
  return subject
}

export function updateSubjectNames(subjects) {
  subjects.forEach((entry) => {
    if (entry.id && entry.name) {
      updateSubjectName(entry.id, entry.name)
    }
  })
  return getAllActiveSubjects()
}

// ── Topic-based progress ──────────────────────────────────────────────

export function getSubjectProgress() {
  const subjects = getAllActiveSubjects()
  const sessions = loadSessions()
  const plans = loadDailyPlans()
  
  return subjects.map((subject) => {
    const totalTopics = subject.topics?.length || 0
    const completedTopics = subject.topics?.filter(t => t.completed)?.length || 0
    const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0
    
    // Also calculate time spent from sessions
    const subjectSessions = sessions.filter(s => s.subjectId === subject.id && s.status === 'completed')
    const totalMinutes = subjectSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0)
    
    // Last 7 days breakdown from plans
    const last7Days = []
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const d = new Date(today.getTime() - i * 86400000).toISOString().slice(0, 10)
      const daySessions = subjectSessions.filter(s => s.date === d)
      const dayMinutes = daySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0)
      last7Days.unshift({ date: d, completedMinutes: dayMinutes })
    }
    
    return {
      id: subject.id,
      name: subject.name,
      category: subject.category,
      totalTopics,
      completedTopics,
      progressPercent,
      totalMinutes,
      topics: subject.topics || [],
      days: last7Days
    }
  })
}

// ── Semester management ───────────────────────────────────────────────

export function completeSemester() {
  const data = loadSubjectData()
  const current = data.semesters.find(s => s.status === 'active')
  const upcoming = data.semesters.find(s => s.status === 'upcoming')
  
  if (current) {
    current.status = 'completed'
  }
  
  if (upcoming) {
    upcoming.status = 'active'
    
    // Check if there's a next semester to create
    const nextNum = (upcoming.number || 6) + 1
    // Don't auto-create beyond what we have
  }
  
  saveSubjectData()
  // Clear cached plans
  saveDailyPlans({})
  
  return {
    currentSemester: data.semesters.find(s => s.status === 'active'),
    archived: data.semesters.filter(s => s.status === 'completed').map(s => s.id)
  }
}

// ── Invalidate cache (call after file edits) ──────────────────────────
export function invalidateCache() {
  _subjectData = null
}
