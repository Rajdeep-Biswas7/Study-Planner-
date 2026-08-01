import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = '/api'

function formatSecondsToHMS(totalSec) {
  const hrs = Math.floor(totalSec / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  const secs = totalSec % 60
  
  const pad = (n) => String(n).padStart(2, '0')
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
  }
  return `${pad(mins)}:${pad(secs)}`
}

export default function DailyPlan() {
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Local state for active timers: keyed by blockId -> { seconds: number, isPaused: boolean }
  const [timers, setTimers] = useState({})

  // Extra block modal
  const [showAddExtra, setShowAddExtra] = useState(false)
  const [extraSubjectName, setExtraSubjectName] = useState('')
  const [extraTopic, setExtraTopic] = useState('')

  // Edit block modal
  const [editingBlock, setEditingBlock] = useState(null)
  const [editSubjectName, setEditSubjectName] = useState('')
  const [editTopic, setEditTopic] = useState('')

  // Completing block modal
  const [completingBlock, setCompletingBlock] = useState(null)
  const [topicStudied, setTopicStudied] = useState('')
  const [customCompletedMins, setCustomCompletedMins] = useState(0)

  function refreshPlan() {
    fetch(`${API_BASE}/plan/today`)
      .then((r) => r.json())
      .then((data) => {
        setPlan(data)
        // Initialize timer for any in-progress block if not already initialized
        if (data && data.blocks) {
          setTimers((prev) => {
            const next = { ...prev }
            data.blocks.forEach((block) => {
              if (block.status === 'in-progress' && !(block.id in next)) {
                let initialSec = 0
                if (block.actualStartTime) {
                  const elapsedMs = Date.now() - new Date(block.actualStartTime).getTime()
                  initialSec = Math.max(0, Math.floor(elapsedMs / 1000))
                }
                next[block.id] = { seconds: initialSec, isPaused: false }
              }
            })
            return next
          })
        }
      })
      .catch(() => setError('Could not reach the backend. Is it running on port 4000?'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refreshPlan()
    const handleRefresh = () => refreshPlan()
    window.addEventListener('schedule:updated', handleRefresh)
    return () => window.removeEventListener('schedule:updated', handleRefresh)
  }, [])

  // Timer interval ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prevTimers) => {
        let hasActive = false
        const next = { ...prevTimers }
        Object.keys(next).forEach((blockId) => {
          if (!next[blockId].isPaused) {
            next[blockId] = {
              ...next[blockId],
              seconds: next[blockId].seconds + 1
            }
            hasActive = true
          }
        })
        return hasActive ? next : prevTimers
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  async function handleStartBlock(blockId) {
    const res = await fetch(`${API_BASE}/plan/start-block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockId })
    })
    const updated = await res.json()
    setPlan(updated)
    setTimers((prev) => ({
      ...prev,
      [blockId]: { seconds: 0, isPaused: false }
    }))
  }

  function handleTogglePause(blockId) {
    setTimers((prev) => {
      const current = prev[blockId] || { seconds: 0, isPaused: false }
      return {
        ...prev,
        [blockId]: { ...current, isPaused: !current.isPaused }
      }
    })
  }

  function handleResetTimer(blockId) {
    setTimers((prev) => ({
      ...prev,
      [blockId]: { seconds: 0, isPaused: false }
    }))
  }

  function openCompleteModal(block) {
    const elapsedSec = timers[block.id]?.seconds || 0
    const mins = Math.max(1, Math.round(elapsedSec / 60))
    setCompletingBlock(block)
    setTopicStudied(block.topic)
    setCustomCompletedMins(mins)
  }

  async function handleCompleteBlock() {
    if (!completingBlock) return
    const res = await fetch(`${API_BASE}/plan/complete-block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blockId: completingBlock.id,
        topicStudied,
        actualMinutes: Number(customCompletedMins) || 0
      })
    })
    const updated = await res.json()
    setPlan(updated)
    setCompletingBlock(null)
    setTopicStudied('')
  }

  async function handleSaveEdit() {
    if (!editingBlock) return
    const res = await fetch(`${API_BASE}/plan/update-block`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blockId: editingBlock.id,
        subjectName: editSubjectName,
        topic: editTopic
      })
    })
    const updated = await res.json()
    setPlan(updated)
    setEditingBlock(null)
  }

  async function handleAddExtraBlock() {
    if (!extraSubjectName.trim()) return
    const res = await fetch(`${API_BASE}/plan/add-extra-block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subjectName: extraSubjectName.trim(),
        topic: extraTopic.trim() || 'General Practice'
      })
    })
    const updated = await res.json()
    setPlan(updated)
    setShowAddExtra(false)
    setExtraSubjectName('')
    setExtraTopic('')
  }

  if (loading) return <p className="font-body text-linen/60 px-4 sm:px-6">Loading today's plan…</p>
  if (error) return <p className="font-body text-rollover px-4 sm:px-6">{error}</p>
  if (!plan) return null

  return (
    <section id="plan" className="px-4 sm:px-6 md:px-16 py-8 sm:py-10 max-w-4xl mx-auto font-body">
      {/* Header section with mobile responsive flex */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-marigold font-semibold mb-1">
            {plan.isLightDay ? 'Light day — festival adjusted' : "Today's Timetable"}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-linen">
            {plan.dateLabel}
          </h2>
        </div>
        <button
          onClick={() => setShowAddExtra(true)}
          className="self-start sm:self-auto rounded-full border border-marigold/40 bg-marigold/10 px-4 py-2 text-xs font-semibold text-marigold hover:bg-marigold hover:text-ink transition"
        >
          + Add Extra Subject
        </button>
      </div>

      {plan.rolloverNote && (
        <div className="mb-6 rounded-xl border border-rollover/40 bg-rollover/10 px-4 py-3 text-xs sm:text-sm text-rollover">
          {plan.rolloverNote}
        </div>
      )}

      {/* Blocks List */}
      <div className="space-y-4">
        {plan.blocks.map((block, i) => {
          const isPending = block.status === 'pending' || !block.status
          const isInProgress = block.status === 'in-progress'
          const isCompleted = block.status === 'completed'
          const timerState = timers[block.id] || { seconds: 0, isPaused: false }

          return (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={[
                'rounded-2xl border p-4 sm:p-5 flex flex-col gap-4 transition-all',
                isCompleted
                  ? 'bg-teal/10 border-teal/40'
                  : isInProgress
                  ? 'bg-surface border-marigold/60 shadow-lg shadow-marigold/5'
                  : 'bg-surface border-linen/10'
              ].join(' ')}
            >
              {/* Card Top Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display font-semibold text-linen text-xl sm:text-2xl">{block.subjectName}</p>
                    {block.isExtra && (
                      <span className="rounded-full bg-marigold/20 text-marigold px-2.5 py-0.5 text-[10px] font-bold">
                        EXTRA
                      </span>
                    )}
                    {isInProgress && (
                      <span className={[
                        'rounded-full px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1.5',
                        timerState.isPaused ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-marigold text-ink animate-pulse'
                      ].join(' ')}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {timerState.isPaused ? 'PAUSED' : 'STUDYING NOW'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-linen/70 mt-1">
                    <span className="text-marigold font-medium">{block.topic}</span> · {block.startTime}–{block.endTime}
                    {block.plannedMinutes > 0 && ` (${block.plannedMinutes} min)`}
                    {block.rolledOverMinutes ? ` · +${block.rolledOverMinutes}m carried over` : ''}
                  </p>
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => {
                    setEditingBlock(block)
                    setEditSubjectName(block.subjectName)
                    setEditTopic(block.topic)
                  }}
                  className="self-end sm:self-center text-xs text-linen/40 hover:text-linen px-2 py-1"
                >
                  Edit
                </button>
              </div>

              {/* ── Active Timer Clock Banner (Visible when in-progress) ── */}
              {isInProgress && (
                <div className="rounded-xl bg-ink/90 border border-marigold/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Digital Clock Display */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-marigold/10 border border-marigold/30 flex items-center justify-center text-marigold text-lg font-bold">
                      ⏱
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-linen/50 font-semibold">Active Study Timer</p>
                      <p className="font-mono text-2xl sm:text-3xl font-bold tracking-widest text-marigold">
                        {formatSecondsToHMS(timerState.seconds)}
                      </p>
                    </div>
                  </div>

                  {/* Timer Action Controls: Pause, Reset, Complete */}
                  <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto">
                    {/* Pause / Resume Button */}
                    <button
                      onClick={() => handleTogglePause(block.id)}
                      className={[
                        'flex-1 sm:flex-none min-h-[42px] px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition',
                        timerState.isPaused
                          ? 'bg-marigold text-ink hover:opacity-90'
                          : 'bg-linen/15 text-linen hover:bg-linen/20'
                      ].join(' ')}
                    >
                      {timerState.isPaused ? '▶ Resume' : '⏸ Pause'}
                    </button>

                    {/* Reset Timer Button */}
                    <button
                      onClick={() => handleResetTimer(block.id)}
                      className="flex-1 sm:flex-none min-h-[42px] px-3.5 rounded-xl bg-ink border border-linen/20 text-linen/70 hover:text-linen text-xs font-medium flex items-center justify-center gap-1"
                      title="Reset timer to 00:00"
                    >
                      🔄 Reset
                    </button>

                    {/* Complete Subject Button */}
                    <button
                      onClick={() => openCompleteModal(block)}
                      className="w-full sm:w-auto min-h-[42px] px-5 rounded-xl bg-teal text-linen hover:opacity-90 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-teal/20"
                    >
                      ✓ Complete Subject
                    </button>
                  </div>
                </div>
              )}

              {/* Start Button (Pending state) */}
              {isPending && (
                <div className="flex justify-end border-t border-linen/5 pt-3">
                  <button
                    onClick={() => handleStartBlock(block.id)}
                    className="w-full sm:w-auto min-h-[44px] px-6 rounded-xl bg-marigold text-ink font-bold text-xs hover:opacity-90 transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    ▶ Start Study Session
                  </button>
                </div>
              )}

              {/* Completed Status */}
              {isCompleted && (
                <div className="flex items-center justify-between border-t border-teal/20 pt-3 text-xs">
                  <span className="text-teal font-semibold flex items-center gap-1">
                    ✓ Completed ({block.actualMinutes} mins logged)
                  </span>
                  <button
                    onClick={() => openCompleteModal(block)}
                    className="text-linen/50 hover:text-linen underline"
                  >
                    Re-open / Update
                  </button>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {plan.motivationalNote && (
        <p className="mt-8 font-display text-base sm:text-lg text-linen/80 italic border-l-2 border-marigold pl-4">
          "{plan.motivationalNote}"
        </p>
      )}

      {/* Add Extra Block Modal */}
      <AnimatePresence>
        {showAddExtra && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-md rounded-2xl border border-linen/15 bg-surface p-5 sm:p-6 space-y-4"
            >
              <h3 className="font-display text-xl text-linen font-bold">
                Add Extra Study Subject
              </h3>
              <p className="text-xs text-linen/60">
                Create an extra study session for today with a Start & Live Timer clock.
              </p>
              <div>
                <label className="text-xs text-linen/60 block mb-1">Subject Name</label>
                <input
                  type="text"
                  value={extraSubjectName}
                  onChange={(e) => setExtraSubjectName(e.target.value)}
                  placeholder="e.g. Operating Systems / LeetCode"
                  className="w-full rounded-xl border border-linen/15 bg-ink px-3.5 py-2.5 text-sm text-linen"
                />
              </div>
              <div>
                <label className="text-xs text-linen/60 block mb-1">Topic / Objective</label>
                <input
                  type="text"
                  value={extraTopic}
                  onChange={(e) => setExtraTopic(e.target.value)}
                  placeholder="e.g. Process Synchronization problems"
                  className="w-full rounded-xl border border-linen/15 bg-ink px-3.5 py-2.5 text-sm text-linen"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowAddExtra(false)}
                  className="rounded-full px-4 py-2 text-xs font-medium text-linen/60 hover:text-linen"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddExtraBlock}
                  className="rounded-full bg-marigold px-5 py-2.5 text-xs font-bold text-ink hover:opacity-90"
                >
                  Add Subject Block
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Block Modal */}
      <AnimatePresence>
        {editingBlock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-md rounded-2xl border border-linen/15 bg-surface p-5 sm:p-6 space-y-4"
            >
              <h3 className="font-display text-xl text-linen font-bold">
                Edit Study Block
              </h3>
              <div>
                <label className="text-xs text-linen/60 block mb-1">Subject Name</label>
                <input
                  type="text"
                  value={editSubjectName}
                  onChange={(e) => setEditSubjectName(e.target.value)}
                  className="w-full rounded-xl border border-linen/15 bg-ink px-3.5 py-2.5 text-sm text-linen"
                />
              </div>
              <div>
                <label className="text-xs text-linen/60 block mb-1">Topic</label>
                <input
                  type="text"
                  value={editTopic}
                  onChange={(e) => setEditTopic(e.target.value)}
                  className="w-full rounded-xl border border-linen/15 bg-ink px-3.5 py-2.5 text-sm text-linen"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setEditingBlock(null)}
                  className="rounded-full px-4 py-2 text-xs font-medium text-linen/60 hover:text-linen"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="rounded-full bg-marigold px-5 py-2.5 text-xs font-bold text-ink hover:opacity-90"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Complete Block Modal */}
      <AnimatePresence>
        {completingBlock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-md rounded-2xl border border-teal/30 bg-surface p-5 sm:p-6 space-y-4"
            >
              <h3 className="font-display text-xl text-linen font-bold">
                ✓ Complete {completingBlock.subjectName}
              </h3>
              <div>
                <label className="text-xs text-linen/60 block mb-1">Topic Studied</label>
                <input
                  type="text"
                  value={topicStudied}
                  onChange={(e) => setTopicStudied(e.target.value)}
                  className="w-full rounded-xl border border-linen/15 bg-ink px-3.5 py-2.5 text-sm text-linen"
                />
              </div>
              <div>
                <label className="text-xs text-linen/60 block mb-1">Actual Time Spent (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  value={customCompletedMins}
                  onChange={(e) => setCustomCompletedMins(e.target.value)}
                  className="w-full rounded-xl border border-linen/15 bg-ink px-3.5 py-2.5 text-sm text-linen font-mono"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setCompletingBlock(null)}
                  className="rounded-full px-4 py-2 text-xs font-medium text-linen/60 hover:text-linen"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteBlock}
                  className="rounded-full bg-teal px-6 py-2.5 text-xs font-bold text-linen hover:opacity-90"
                >
                  Confirm Completion
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
