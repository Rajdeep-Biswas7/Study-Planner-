// Thin wrapper around the Gemini API using native fetch (Node 18+).
// Supports both single-turn and multi-turn conversations.

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/'
const MODEL = 'gemini-2.0-flash-exp'

export function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null
}

function buildGeminiPayload({ system, messages, maxTokens }) {
  return {
    contents: messages.map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }]
    })),
    generationConfig: {
      maxOutputTokens: maxTokens
    },
    systemInstruction: {
      parts: [{ text: system }]
    }
  }
}

export async function callGemini({ system, prompt, maxTokens = 400 }) {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    console.warn('[ai] GEMINI_API_KEY/GOOGLE_API_KEY not set — skipping AI call.')
    return null
  }

  try {
    const endpoint = `${API_URL}${MODEL}:generateContent?key=${apiKey}`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(buildGeminiPayload({
        system,
        messages: [{ role: 'user', content: prompt }],
        maxTokens
      }))
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[ai] GEMINI API error', res.status, errText)
      return null
    }

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text ?? null
    return text
  } catch (err) {
    console.error('[ai] GEMINI call failed', err)
    return null
  }
}

// Multi-turn conversation support
export async function callClaudeChat({ system, messages, maxTokens = 800 }) {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    console.warn('[ai] GEMINI_API_KEY/GOOGLE_API_KEY not set — skipping AI call.')
    return null
  }

  try {
    const endpoint = `${API_URL}${MODEL}:generateContent?key=${apiKey}`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(buildGeminiPayload({
        system,
        messages,
        maxTokens
      }))
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[ai] GEMINI chat API error', res.status, errText)
      return null
    }

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text ?? null
    return text
  } catch (err) {
    console.error('[ai] GEMINI chat call failed', err)
    return null
  }
}
