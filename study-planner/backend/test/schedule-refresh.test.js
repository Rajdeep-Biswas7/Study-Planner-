import test from 'node:test'
import assert from 'node:assert/strict'
import { state } from '../lib/store.js'
import { clearCachedPlanForDate, generateTodayPlan, getTodayDateString } from '../lib/scheduler.js'
import { loadSettings, saveSettings } from '../lib/settingsStore.js'

function cloneSettings(settings) {
  return JSON.parse(JSON.stringify(settings))
}

test('saving settings clears the cached today plan so the schedule refreshes', () => {
  const today = getTodayDateString()
  const original = loadSettings()
  const updated = cloneSettings(original)

  updated.slots.normal[0].startTime = '10:00'
  updated.slots.normal[0].endTime = '11:30'
  updated.slots.normal[0].minutes = 90

  state.dailyPlans[today] = {
    date: today,
    blocks: [{ id: 'stale', startTime: '00:00', endTime: '00:00', plannedMinutes: 0 }]
  }

  saveSettings(updated)
  clearCachedPlanForDate(today)

  const plan = generateTodayPlan(today)

  assert.equal(plan.blocks[0].startTime, '10:00')
  assert.equal(plan.blocks[0].endTime, '11:30')

  saveSettings(original)
  clearCachedPlanForDate(today)
  delete state.dailyPlans[today]
})
