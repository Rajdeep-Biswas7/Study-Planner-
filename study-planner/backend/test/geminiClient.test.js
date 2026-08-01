import test from 'node:test'
import assert from 'node:assert/strict'
import { getGeminiApiKey } from '../../ai/geminiClient.js'

test('gemini key helper prefers GEMINI_API_KEY and falls back to GOOGLE_API_KEY', () => {
  const originalGemini = process.env.GEMINI_API_KEY
  const originalGoogle = process.env.GOOGLE_API_KEY

  try {
    delete process.env.GEMINI_API_KEY
    delete process.env.GOOGLE_API_KEY
    assert.equal(getGeminiApiKey(), null)

    process.env.GOOGLE_API_KEY = 'google-key'
    assert.equal(getGeminiApiKey(), 'google-key')

    process.env.GEMINI_API_KEY = 'gemini-key'
    assert.equal(getGeminiApiKey(), 'gemini-key')
  } finally {
    if (originalGemini === undefined) {
      delete process.env.GEMINI_API_KEY
    } else {
      process.env.GEMINI_API_KEY = originalGemini
    }

    if (originalGoogle === undefined) {
      delete process.env.GOOGLE_API_KEY
    } else {
      process.env.GOOGLE_API_KEY = originalGoogle
    }
  }
})
