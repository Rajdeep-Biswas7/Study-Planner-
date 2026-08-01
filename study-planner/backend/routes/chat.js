import { Router } from 'express'
import { callGeminiChat } from '../../ai/geminiClient.js'
import { getSubjectProgress, getActiveSemester } from '../lib/store.js'
import { getTodayDateString, generateTodayPlan } from '../lib/scheduler.js'

const router = Router()

router.post('/', async (req, res) => {
  const { messages } = req.body // Array of { role: 'user' | 'assistant', content: string }
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' })
  }

  const todayStr = getTodayDateString()
  const todayPlan = generateTodayPlan(todayStr)
  const progress = getSubjectProgress()
  const activeSem = getActiveSemester()

  // Build context summary for AI
  const semName = activeSem ? activeSem.name : 'Semester'
  const progressSummary = progress
    .map(p => `- ${p.name} (${p.category}): ${p.completedTopics}/${p.totalTopics} topics mastered (${p.progressPercent}%), ${p.totalMinutes} mins studied`)
    .join('\n')

  const todaySummary = todayPlan.blocks
    .map(b => `- [${b.status}] ${b.subjectName} (${b.topic}) | Planned: ${b.plannedMinutes}m, Actual: ${b.actualMinutes}m`)
    .join('\n')

  const system = `You are Antigravity AI, an intelligent, empathetic, and highly strategic study mentor for a B.Tech Information Technology student preparing for MAKAUT exams, GATE Computer Science 2027, and Coding/Placement interviews.

CURRENT STUDENT CONTEXT:
- Active Academic Term: ${semName}
- Today's Date: ${todayStr}
- Today's Challenge Goal: ${todayPlan.dailyGoalMinutes} mins (Completed so far: ${todayPlan.totalCompletedMinutes} mins)
- Today's Timetable Blocks:
${todaySummary}

SUBJECT & TOPIC MASTERY PROGRESS:
${progressSummary}

YOUR INSTRUCTIONS:
1. Provide direct, insightful, AI-style answers (no generic fluff).
2. Offer smart syllabus suggestions based on the student's uncompleted topics and exam weightage (GATE & MAKAUT).
3. Auto-generate study tips tailored to their current progress and shortfall.
4. Keep formatting clean with standard markdown formatting, bold text, bullet points, and code snippets where relevant.
5. Be encouraging yet realistic about time management.`

  const reply = await callGeminiChat({ system, messages, maxTokens: 1000 })

  if (!reply) {
    return res.json({
      role: 'assistant',
      content: "I'm having trouble connecting to AI services right now. However, looking at your progress, focus on completing your pending study blocks for today and master topics in Discrete Mathematics or DBMS!"
    })
  }

  res.json({
    role: 'assistant',
    content: reply
  })
})

export default router
