// Walks backward day-by-day counting a consecutive run of completed
// 6-hour-challenge days. Festival "off" days are skipped over (they don't
// help or hurt the streak). Any real study day that missed its goal — or a
// gap in history — breaks the streak back to zero.
import { state } from './store.js'

export function computeStreak(fromDateStrExclusive) {
  let streak = 0
  const from = new Date(fromDateStrExclusive)

  for (let i = 1; i <= 400; i++) {
    const d = new Date(from.getTime() - i * 86400000).toISOString().slice(0, 10)
    const plan = state.dailyPlans[d]
    if (!plan) break
    if (plan.isOffDay) continue
    if (plan.challengeComplete) {
      streak++
    } else {
      break
    }
  }
  return streak
}
