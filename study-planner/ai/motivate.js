import { callGemini } from './geminiClient.js'

// Returns a short (1-2 sentence) motivational note based on the plan and
// recent rollover history. Falls back to null if AI is unavailable —
// the frontend just hides the note in that case.
export async function generateMotivationalNote(plan) {
  const prompt = `Here is today's study plan as JSON:
${JSON.stringify(plan, null, 2)}

Write one short, honest, non-cheesy motivational line (max 25 words) for a
B.Tech IT student preparing for GATE CS 2027 and campus placements. If there
was a rollover note (missed study time from yesterday), acknowledge it
directly and firmly rather than ignoring it — but stay encouraging, not
guilt-tripping. Return only the line, no quotes, no preamble.`

  const text = await callGemini({
    system: 'You are a calm, direct study coach. No emojis, no fluff.',
    prompt,
    maxTokens: 100
  })

  return text?.trim() ?? null
}
