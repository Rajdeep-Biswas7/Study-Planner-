import { callGemini } from './geminiClient.js'

export async function callClaude({ system, prompt, maxTokens = 800 }) {
  return callGemini({ system, prompt, maxTokens })
}

export async function callClaudeChat({ system, messages, maxTokens = 800 }) {
  return callGemini({ system, prompt: messages.at(-1)?.content ?? '', maxTokens })
}
