import { callGemini } from './geminiClient.js'

// Optional refinement layer: given the deterministic plan the scheduler
// built, ask Claude which topic order makes most sense given proximity to
// GATE 2027 and placement season. Returns an array of { blockId, topic } or
// null if AI is unavailable, in which case the scheduler's default order is used.
export async function suggestTopicOrder(plan, subjectCatalogue) {
  const prompt = `Today's draft plan (blocks with subject but topic may be a
placeholder):
${JSON.stringify(plan.blocks, null, 2)}

Full subject/topic catalogue to choose from:
${JSON.stringify(subjectCatalogue, null, 2)}

For each block, pick the single most useful next topic for that subject,
prioritizing: (1) foundational topics before advanced ones, (2) GATE-weighted
topics if the exam is approaching, (3) topics not yet marked done.
Respond ONLY with JSON: an array of {"blockId": "...", "topic": "..."}. No
prose, no markdown fences.`

  const text = await callGemini({
    system: 'You output strictly valid JSON and nothing else.',
    prompt,
    maxTokens: 500
  })

  if (!text) return null
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return null
  }
}
