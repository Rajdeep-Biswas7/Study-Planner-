import { Router } from 'express'
import { clearCachedPlanForDate, getTodayDateString } from '../lib/scheduler.js'
import { loadSettings, saveSettings } from '../lib/settingsStore.js'
import { updateSubjectNames } from '../lib/store.js'

const router = Router()

router.get('/', (req, res) => {
  res.json(loadSettings())
})

// Full or partial update — merges into existing settings so the frontend
// can send just the piece it changed.
router.put('/', (req, res) => {
  const current = loadSettings()
  const next = {
    ...current,
    ...req.body,
    slots: { ...current.slots, ...(req.body.slots || {}) }
  }
  saveSettings(next)
  if (Array.isArray(req.body.subjectNames)) {
    updateSubjectNames(req.body.subjectNames)
  }
  clearCachedPlanForDate(getTodayDateString())
  res.json(next)
})

export default router
