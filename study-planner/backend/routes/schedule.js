import { Router } from 'express'
import {
  generateTodayPlan,
  getTodayDateString,
  startBlock,
  completeBlock,
  updateBlock,
  addExtraBlock
} from '../lib/scheduler.js'
import { loadDailyPlans, getDailyPlan } from '../lib/fileStore.js'
import { generateMotivationalNote } from '../../ai/motivate.js'

const router = Router()

// GET today's daily plan
router.get('/today', async (req, res) => {
  const dateStr = getTodayDateString()
  const plan = generateTodayPlan(dateStr)

  if (!plan.motivationalNote) {
    plan.motivationalNote = await generateMotivationalNote(plan)
  }

  res.json(plan)
})

// GET plan for a specific date (or today)
router.get('/date/:dateStr', (req, res) => {
  const { dateStr } = req.params
  const plan = getDailyPlan(dateStr) || generateTodayPlan(dateStr)
  res.json(plan)
})

// GET all past plans history
router.get('/history', (req, res) => {
  const plans = loadDailyPlans()
  res.json(plans)
})

// POST start a study block
router.post('/start-block', (req, res) => {
  const { dateStr, blockId } = req.body
  const targetDate = dateStr || getTodayDateString()
  const updated = startBlock(targetDate, blockId)
  if (!updated) return res.status(404).json({ error: 'Block or plan not found' })
  res.json(updated)
})

// POST complete a study block
router.post('/complete-block', (req, res) => {
  const { dateStr, blockId, topicStudied, actualMinutes } = req.body
  const targetDate = dateStr || getTodayDateString()
  const updated = completeBlock(targetDate, blockId, topicStudied, actualMinutes)
  if (!updated) return res.status(404).json({ error: 'Block or plan not found' })
  res.json(updated)
})

// PUT update a block's subject or topic
router.put('/update-block', (req, res) => {
  const { dateStr, blockId, subjectId, subjectName, topic } = req.body
  const targetDate = dateStr || getTodayDateString()
  const updated = updateBlock(targetDate, blockId, { subjectId, subjectName, topic })
  if (!updated) return res.status(404).json({ error: 'Block or plan not found' })
  res.json(updated)
})

// POST add extra study block
router.post('/add-extra-block', (req, res) => {
  const { dateStr, subjectId, subjectName, topic } = req.body
  const targetDate = dateStr || getTodayDateString()
  const updated = addExtraBlock(targetDate, { subjectId, subjectName, topic })
  res.json(updated)
})

export default router
