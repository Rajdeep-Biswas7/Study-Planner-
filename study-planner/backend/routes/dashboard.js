import { Router } from 'express'
import { state, updateSubjectName, getSubjectProgress } from '../lib/store.js'
import { generateTodayPlan } from '../lib/scheduler.js'
import { computeStreak } from '../lib/streak.js'

const router = Router()

function todayIST() {
  const now = new Date(Date.now() + 5.5 * 60 * 60 * 1000)
  return now.toISOString().slice(0, 10)
}

router.get('/summary', (req, res) => {
  const dateStr = todayIST()
  const todayPlan = generateTodayPlan(dateStr)

  const last7 = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(new Date(dateStr).getTime() - i * 86400000).toISOString().slice(0, 10)
    const plan = state.dailyPlans[d]
    last7.unshift({
      date: d,
      completedMinutes: plan?.totalCompletedMinutes ?? 0,
      goalMinutes: plan?.dailyGoalMinutes ?? 0,
      challengeComplete: plan?.challengeComplete ?? false,
      isOffDay: plan?.isOffDay ?? false
    })
  }

  const weekMinutes = last7.reduce((sum, d) => sum + d.completedMinutes, 0)
  const weekGoal = last7.reduce((sum, d) => sum + d.goalMinutes, 0)
  const streak = computeStreak(dateStr) + (todayPlan.challengeComplete ? 1 : 0)
  const monthlyMinutes = Object.values(state.dailyPlans).reduce((sum, plan) => sum + (plan?.totalCompletedMinutes ?? 0), 0)

  res.json({
    today: {
      completedMinutes: todayPlan.totalCompletedMinutes,
      goalMinutes: todayPlan.dailyGoalMinutes,
      challengeComplete: todayPlan.challengeComplete
    },
    week: { completedMinutes: weekMinutes, goalMinutes: weekGoal, days: last7 },
    month: { completedMinutes: monthlyMinutes },
    streak,
    subjectProgress: getSubjectProgress()
  })
})

router.post('/subject-name', (req, res) => {
  const { subjectId, name } = req.body
  const updated = updateSubjectName(subjectId, name)
  if (!updated) return res.status(404).json({ error: 'Subject not found' })
  res.json(updated)
})

export default router
