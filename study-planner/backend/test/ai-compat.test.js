import test from 'node:test'
import assert from 'node:assert/strict'
import { callGemini } from '../../ai/geminiClient.js'

test('callGemini exists and gracefully returns null without API credentials', async () => {
  const result = await callGemini({ system: 'test', prompt: 'hello', maxTokens: 10 })
  assert.equal(result, null)
})
