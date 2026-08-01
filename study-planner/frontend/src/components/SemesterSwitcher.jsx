import { useEffect, useState } from 'react'

const API_BASE = 'https://study-planner-ibll.onrender.com/api'

export default function SemesterSwitcher() {
  const [status, setStatus] = useState(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function loadStatus() {
    try {
      const res = await fetch(`${API_BASE}/semester/status`)
      const data = await res.json()
      setStatus(data)
    } catch (err) {
      console.error('Failed to load semester status:', err)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  async function handleCompleteSemester() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/semester/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const updated = await res.json()
      loadStatus()
      window.dispatchEvent(new Event('schedule:updated'))
      window.dispatchEvent(new Event('subjects:updated'))
      setOpen(false)
    } catch (err) {
      console.error('Failed to complete semester:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!status) return null

  const current = status.currentSemester
  const upcoming = status.upcomingSemester

  return (
    <section className="px-6 md:px-16 py-10 max-w-4xl mx-auto font-body">
      <div className="rounded-xl border border-linen/10 bg-surface p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-teal mb-1 font-semibold">
          Academic Term Management
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div>
            <h3 className="text-2xl font-display font-semibold text-linen">
              {current ? current.name : 'Completed All Semesters'}
            </h3>
            {upcoming && (
              <p className="text-xs text-linen/60 mt-1">
                Next Semester lined up: <span className="text-marigold font-medium">{upcoming.name}</span> ({upcoming.subjects?.length || 0} pre-loaded subjects)
              </p>
            )}
          </div>
          {current && !open && (
            <button
              onClick={() => setOpen(true)}
              className="rounded-full bg-marigold px-5 py-2 text-xs font-semibold text-ink hover:opacity-90 transition"
            >
              🎓 Complete {current.name} & Transition to {upcoming ? upcoming.name : 'Next Sem'}
            </button>
          )}
        </div>

        <p className="text-xs text-linen/50 border-t border-linen/10 pt-3">
          💡 Note: GATE CS 2027 and Placement/Coding tracks remain active continuously across semester transitions — only MAKAUT college subjects auto-populate for the new term.
        </p>

        {open && (
          <div className="mt-5 rounded-lg bg-ink/60 p-4 border border-linen/10 space-y-3">
            <p className="text-sm text-linen font-medium">
              Are you sure you want to finish <span className="text-marigold">{current?.name}</span>?
            </p>
            <p className="text-xs text-linen/60">
              This will archive {current?.name} subjects and automatically activate {upcoming?.name} ({upcoming?.subjects?.map(s => s.name).join(', ')}) into your active daily plan!
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCompleteSemester}
                disabled={loading}
                className="rounded-full bg-teal px-5 py-2 text-xs font-semibold text-linen disabled:opacity-40"
              >
                {loading ? 'Switching Semester...' : `Confirm & Switch to ${upcoming?.name || 'Next'}`}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full px-5 py-2 text-xs font-medium text-linen/60 hover:text-linen"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
