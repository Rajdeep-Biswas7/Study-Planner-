// Scheduling logic: builds the daily plan from settings + subjects.
// NO auto-complete — blocks use a manual Start → Complete flow.
// Tracks real elapsed time from user actions, not from the clock.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getAllActiveSubjects } from './store.js'
import { loadSettings } from './settingsStore.js'
import { loadDailyPlans, saveDailyPlans, getDailyPlan, saveDailyPlan } from './fileStore.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const events = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'events-bengali.json'), 'utf-8')
)

function eventFor(dateStr) {
  return events.find((e) => e.date === dateStr)
}

export function getStudyDateString(now = new Date()) {
  const istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
  const hour = istNow.getUTCHours()
  if (hour < 4) {
    const previousDay = new Date(istNow.getTime() - 24 * 60 * 60 * 1000)
    return previousDay.toISOString().slice(0, 10)
  }
  return istNow.toISOString().slice(0, 10)
}

export function getTodayDateString() {
  return getStudyDateString(new Date())
}

export function clearCachedPlanForDate(dateStr) {
  const plans = loadDailyPlans()
  delete plans[dateStr]
  saveDailyPlans(plans)
}

function pickSubjectsForToday(count, dateStr) {
  const subjects = getAllActiveSubjects()
  const [year, month, day] = dateStr.split('-').map(Number)
  const dayIndex = Math.floor(Date.UTC(year, month - 1, day) / 86400000)
  const rotated = [...subjects.slice(dayIndex % subjects.length), ...subjects.slice(0, dayIndex % subjects.length)]
  return rotated.slice(0, count)
}

function nextTopic(subject) {
  const incomplete = subject.topics?.find(t => !t.completed)
  return incomplete?.name ?? subject.topics?.[0]?.name ?? 'Revision'
}

function attachTotals(plan, settings) {
  const totalCompleted = plan.blocks.reduce((sum, b) => sum + (b.actualMinutes || 0), 0)
  plan.dailyGoalMinutes = plan.isOffDay ? 0 : plan.isLightDay ? settings.lightGoalMinutes : settings.dailyGoalMinutes
  plan.totalCompletedMinutes = totalCompleted
  plan.challengeComplete = plan.dailyGoalMinutes > 0 && totalCompleted >= plan.dailyGoalMinutes
  return plan
}

export function generateTodayPlan(dateStr) {
  const settings = loadSettings()
  const existing = getDailyPlan(dateStr)
  if (existing) return attachTotals(existing, settings)

  const ev = eventFor(dateStr)
  const isOffDay = ev?.study_load === 'off'
  const isLightDay = ev?.study_load === 'light'

  const slots = isOffDay ? [] : isLightDay ? settings.slots.light : settings.slots.normal
  const subjects = pickSubjectsForToday(slots.length, dateStr)

  const yesterday = new Date(new Date(dateStr).getTime() - 86400000)
    .toISOString()
    .slice(0, 10)
  const prevPlan = getDailyPlan(yesterday)
  let rolloverMinutes = 0
  let rolloverNote = null
  if (prevPlan) {
    const shortfall = Math.max(0, (prevPlan.dailyGoalMinutes ?? 0) - (prevPlan.totalCompletedMinutes ?? 0))
    rolloverMinutes = Math.min(shortfall, settings.rolloverCapMinutes)
    if (rolloverMinutes > 0) {
      rolloverNote = `${rolloverMinutes} min carried over from yesterday's shortfall — today's challenge is harder until you clear it.`
    }
  }

  const blocks = slots.map((slot, i) => {
    const subject = subjects[i]
    const rolledOverMinutes = i === 0 ? rolloverMinutes : 0
    return {
      id: `${dateStr}-${i}`,
      subjectId: slot.subjectId || subject?.id || 'revision',
      subjectName: slot.subjectName || subject?.name || 'Revision',
      topic: subject ? nextTopic(subject) : 'General revision',
      startTime: slot.startTime,
      endTime: slot.endTime,
      plannedMinutes: slot.minutes + rolledOverMinutes,
      rolledOverMinutes,
      status: 'pending',
      actualStartTime: null,
      actualEndTime: null,
      actualMinutes: 0
    }
  })

  const plan = {
    date: dateStr,
    dateLabel: new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }),
    isOffDay,
    isLightDay,
    eventName: ev?.name ?? null,
    rolloverNote,
    blocks,
    motivationalNote: null
  }

  saveDailyPlan(dateStr, plan)
  return attachTotals(plan, settings)
}

export function startBlock(dateStr, blockId) {
  const settings = loadSettings()
  const plan = getDailyPlan(dateStr)
  if (!plan) return null
  
  const block = plan.blocks.find((b) => b.id === blockId)
  if (!block) return null
  
  block.status = 'in-progress'
  block.actualStartTime = new Date().toISOString()
  
  saveDailyPlan(dateStr, plan)
  return attachTotals(plan, settings)
}

export function completeBlock(dateStr, blockId, topicStudied, actualMinutesInput) {
  const settings = loadSettings()
  const plan = getDailyPlan(dateStr)
  if (!plan) return null
  
  const block = plan.blocks.find((b) => b.id === blockId)
  if (!block) return null
  
  const now = new Date()
  block.status = 'completed'
  block.actualEndTime = now.toISOString()
  
  if (typeof actualMinutesInput === 'number' && actualMinutesInput >= 0) {
    block.actualMinutes = actualMinutesInput
  } else if (block.actualStartTime) {
    const startTime = new Date(block.actualStartTime)
    block.actualMinutes = Math.max(1, Math.round((now - startTime) / 60000))
  } else {
    block.actualMinutes = block.plannedMinutes || 30
  }
  
  if (topicStudied) {
    block.topic = topicStudied
  }
  
  saveDailyPlan(dateStr, plan)
  return attachTotals(plan, settings)
}

export function updateBlock(dateStr, blockId, updates) {
  const settings = loadSettings()
  const plan = getDailyPlan(dateStr)
  if (!plan) return null
  
  const block = plan.blocks.find((b) => b.id === blockId)
  if (!block) return null
  
  if (updates.subjectId !== undefined) block.subjectId = updates.subjectId
  if (updates.subjectName !== undefined) block.subjectName = updates.subjectName
  if (updates.topic !== undefined) block.topic = updates.topic
  
  saveDailyPlan(dateStr, plan)
  return attachTotals(plan, settings)
}

export function addExtraBlock(dateStr, { subjectId, subjectName, topic }) {
  const settings = loadSettings()
  let plan = getDailyPlan(dateStr)
  if (!plan) {
    plan = generateTodayPlan(dateStr)
  }
  
  const newBlock = {
    id: `${dateStr}-extra-${Date.now()}`,
    subjectId: subjectId || 'custom',
    subjectName: subjectName || 'Extra Study',
    topic: topic || 'Free study',
    startTime: 'Extra',
    endTime: 'Block',
    plannedMinutes: 0,
    rolledOverMinutes: 0,
    status: 'pending',
    actualStartTime: null,
    actualEndTime: null,
    actualMinutes: 0,
    isExtra: true
  }
  
  plan.blocks.push(newBlock)
  saveDailyPlan(dateStr, plan)
  return attachTotals(plan, settings)
}

export function deleteBlock(dateStr, blockId) {
  const settings = loadSettings()
  const plan = getDailyPlan(dateStr)
  if (!plan) return null

  const beforeCount = plan.blocks.length
  plan.blocks = plan.blocks.filter((block) => block.id !== blockId)

  if (plan.blocks.length === beforeCount) {
    return null
  }

  saveDailyPlan(dateStr, plan)
  return attachTotals(plan, settings)
}

export function markBlockComplete(dateStr, blockId, completedMinutes) {
  return completeBlock(dateStr, blockId, null, completedMinutes)
}
