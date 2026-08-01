import { Router } from 'express'
import { getTodayDateString, generateTodayPlan } from '../lib/scheduler.js'
import { getSubjectProgress } from '../lib/store.js'
import { callGemini } from '../../ai/geminiClient.js'

const router = Router()

router.get('/daily', async (req, res) => {
  const dateStr = getTodayDateString()
  const plan = generateTodayPlan(dateStr)
  const progress = getSubjectProgress()

  const completedBlocks = plan.blocks.filter(b => b.status === 'completed')
  const pendingBlocks = plan.blocks.filter(b => b.status !== 'completed')

  const prompt = `Analyze today's study performance for a B.Tech IT student:

Date: ${dateStr}
Daily Goal: ${plan.dailyGoalMinutes} minutes
Total Completed: ${plan.totalCompletedMinutes} minutes
Challenge Accomplished: ${plan.challengeComplete ? 'YES' : 'NO'}

Blocks Planned:
${plan.blocks.map(b => `- ${b.subjectName} (${b.topic}): Planned ${b.plannedMinutes}m, Status: ${b.status}, Actual: ${b.actualMinutes}m`).join('\n')}

Provide a structured, encouraging, and actionable daily review covering:
1. **Summary & Score**: Brief evaluation of performance (out of 10).
2. **Key Wins**: What went well (subjects completed, focus time).
3. **Shortfall & Bottlenecks**: Analysis of missed or incomplete blocks.
4. **Actionable Suggestions for Tomorrow**: Specific adjustments to timetable or study habits.`

  const system = 'You are an elite academic productivity analyst for B.Tech CSE/IT students.'
  const aiAnalysis = await callGemini({ system, prompt, maxTokens: 800 })

  res.json({
    date: dateStr,
    completedBlocksCount: completedBlocks.length,
    pendingBlocksCount: pendingBlocks.length,
    totalCompletedMinutes: plan.totalCompletedMinutes,
    dailyGoalMinutes: plan.dailyGoalMinutes,
    challengeComplete: plan.challengeComplete,
    analysisText: aiAnalysis || 'Great effort today! Keep pushing through your topics systematically to build consistent study momentum.'
  })
})

export default router
