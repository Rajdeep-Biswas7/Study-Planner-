import test from 'node:test'
import assert from 'node:assert/strict'
import { state } from '../lib/store.js'
import { clearCachedPlanForDate, generateTodayPlan, getTodayDateString, deleteBlock } from '../lib/scheduler.js'
import { loadSettings, saveSettings } from '../lib/settingsStore.js'

function cloneSettings(settings) {
  return JSON.parse(JSON.stringify(settings))
}

test('deleting a block removes it from the plan', () => {
  const today = getTodayDateString()
  const plan = generateTodayPlan(today)
  const firstBlockId = plan.blocks[0].id

  const updated = deleteBlock(today, firstBlockId)

  assert.ok(updated)
  assert.ok(!updated.blocks.some((block) => block.id === firstBlockId))

  clearCachedPlanForDate(today)
  delete state.dailyPlans[today]
})

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
