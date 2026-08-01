import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = '/api'

function formatHrsMin(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export default function ProgressDashboard() {
  const [summary, setSummary] = useState(null)
  const [showBurst, setShowBurst] = useState(false)
  const wasComplete = useRef(false)

  async function load() {
    try {
      const res = await fetch(`${API_BASE}/dashboard/summary`)
      const data = await res.json()
      if (data.today.challengeComplete && !wasComplete.current) {
        setShowBurst(true)
        setTimeout(() => setShowBurst(false), 2500)
      }
      wasComplete.current = data.today.challengeComplete
      setSummary(data)
    } catch (err) {
      console.error('Failed to load dashboard summary:', err)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 5000)
    return () => clearInterval(id)
  }, [])

  if (!summary) return null

  const todayPct = summary.today.goalMinutes
    ? Math.min(100, Math.round((summary.today.completedMinutes / summary.today.goalMinutes) * 100))
    : 0

  // Total topics stats across all active subjects
  const subjectProgress = summary.subjectProgress || []
  const totalTopicsAll = subjectProgress.reduce((sum, s) => sum + (s.totalTopics || 0), 0)
  const totalTopicsCompleted = subjectProgress.reduce((sum, s) => sum + (s.completedTopics || 0), 0)
  const overallTopicPct = totalTopicsAll > 0 ? Math.round((totalTopicsCompleted / totalTopicsAll) * 100) : 0

  return (
    <section id="progress" className="px-6 md:px-16 py-10 max-w-4xl mx-auto relative font-body">
      <AnimatePresence>
        {showBurst && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-ink/95 rounded-xl border border-marigold/40 p-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="w-20 h-20 rounded-full bg-marigold flex items-center justify-center mb-4 text-ink text-3xl font-bold"
            >
              ⚡
            </motion.div>
            <p className="font-display text-3xl text-linen font-bold">Daily Study Challenge Complete!</p>
            <p className="font-body text-sm text-linen/70 mt-2">
              Streak: <span className="text-marigold font-bold">{summary.streak} days</span> in a row!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-sm uppercase tracking-[0.25em] text-teal mb-2">Analytics & Progress</p>
      <h2 className="font-display text-3xl font-semibold text-linen mb-6">
        Topic Mastery & Study Time
      </h2>

      {/* Top Cards Grid */}
      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        {/* Today's Goal */}
        <div className="rounded-xl border border-linen/10 bg-surface p-5">
          <p className="text-xs text-linen/60">Today's Goal</p>
          <p className="font-display text-2xl text-linen mt-1 font-semibold">
            {formatHrsMin(summary.today.completedMinutes)} / {formatHrsMin(summary.today.goalMinutes)}
          </p>
          <div className="mt-3 h-2 rounded-full bg-ink overflow-hidden">
            <motion.div
              className="h-full bg-marigold"
              initial={{ width: 0 }}
              animate={{ width: `${todayPct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Topic Mastery */}
        <div className="rounded-xl border border-teal/30 bg-surface p-5">
          <p className="text-xs text-teal font-medium">Topic Mastery</p>
          <p className="font-display text-2xl text-linen mt-1 font-semibold">
            {totalTopicsCompleted} / {totalTopicsAll} <span className="text-xs text-linen/50 font-normal">topics</span>
          </p>
          <div className="mt-3 h-2 rounded-full bg-ink overflow-hidden">
            <motion.div
              className="h-full bg-teal"
              initial={{ width: 0 }}
              animate={{ width: `${overallTopicPct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* This Week */}
        <div className="rounded-xl border border-linen/10 bg-surface p-5">
          <p className="text-xs text-linen/60">This Week</p>
          <p className="font-display text-2xl text-linen mt-1 font-semibold">
            {formatHrsMin(summary.week.completedMinutes)}
          </p>
          <p className="text-xs text-linen/40 mt-3">Target: {formatHrsMin(summary.week.goalMinutes)}</p>
        </div>

        {/* Streak */}
        <div className="rounded-xl border border-linen/10 bg-surface p-5">
          <p className="text-xs text-linen/60">Streak</p>
          <p className="font-display text-2xl text-linen mt-1 font-semibold">
            🔥 {summary.streak} <span className="text-sm font-normal text-linen/60">days</span>
          </p>
          <p className="text-xs text-linen/40 mt-3">Consistency momentum</p>
        </div>
      </div>

      {/* Subject Topic-Based Progress Section */}
      <div className="rounded-xl border border-linen/10 bg-surface p-6 mb-6">
        <h3 className="font-display text-xl text-linen font-semibold mb-4">
          Subject-by-Subject Topic Progress
        </h3>
        <div className="space-y-5">
          {subjectProgress.map((subject) => {
            const topicPct = subject.progressPercent || 0
            return (
              <div key={subject.id} className="rounded-lg bg-ink/30 p-4 border border-linen/5">
                <div className="flex flex-wrap items-center justify-between text-sm mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-linen text-base">{subject.name}</span>
                    <span className="rounded-full bg-linen/10 px-2 py-0.5 text-[10px] text-linen/60 uppercase">
                      {subject.category}
                    </span>
                  </div>
                  <div className="text-xs text-linen/70">
                    <span className="font-semibold text-teal">{subject.completedTopics} / {subject.totalTopics} topics</span> ({topicPct}%) · {formatHrsMin(subject.totalMinutes)} studied
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 rounded-full bg-ink overflow-hidden mb-3">
                  <div
                    className="h-full bg-teal transition-all duration-500"
                    style={{ width: `${topicPct}%` }}
                  />
                </div>

                {/* 7-Day breakdown tags */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {subject.days.map((day) => (
                    <div
                      key={day.date}
                      className="rounded-full border border-linen/10 bg-ink/60 px-2.5 py-0.5 text-[11px] text-linen/60"
                    >
                      {day.date.slice(5)}: {formatHrsMin(day.completedMinutes)}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 7-Day Consistency Tracker */}
      <div className="rounded-xl border border-linen/10 bg-surface p-5">
        <p className="text-sm text-linen/60 mb-3 font-medium">
          7-Day Challenge Consistency
        </p>
        <div className="flex items-end gap-3 h-12 pt-2">
          {summary.week.days.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <div
                title={`${d.date}: ${formatHrsMin(d.completedMinutes)} / ${formatHrsMin(d.goalMinutes)}`}
                className={[
                  'w-full rounded-md transition-all',
                  d.isOffDay
                    ? 'h-3 bg-linen/10'
                    : d.challengeComplete
                    ? 'h-10 bg-marigold'
                    : d.completedMinutes > 0
                    ? 'h-6 bg-teal/60'
                    : 'h-3 bg-rollover/40'
                ].join(' ')}
              />
              <span className="text-[10px] text-linen/40">{d.date.slice(8)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
