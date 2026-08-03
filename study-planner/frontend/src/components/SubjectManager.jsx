import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = 'https://study-planner-ibll.onrender.com/api'

export default function SubjectManager() {
  const [data, setData] = useState({ makaut: [], gate: [], placement: [], coding: [], custom: [] })
  const [activeTab, setActiveTab] = useState('makaut')
  const [loading, setLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusType, setStatusType] = useState('success')
  
  // Topic adding state
  const [addingTopicFor, setAddingTopicFor] = useState(null)
  const [newTopicName, setNewTopicName] = useState('')

  // Custom subject modal state
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [subjectName, setSubjectName] = useState('')
  const [subjectCategory, setSubjectCategory] = useState('custom')

  // AI Extraction state
  const [showSyllabusExtract, setShowSyllabusExtract] = useState(false)
  const [extractSubjectId, setExtractSubjectId] = useState('')
  const [syllabusText, setSyllabusText] = useState('')
  const [extracting, setExtracting] = useState(false)

  async function loadSubjects() {
    try {
      const res = await fetch(`${API_BASE}/subjects`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('Failed to load subjects:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubjects()
    const handleUpdate = () => loadSubjects()
    window.addEventListener('subjects:updated', handleUpdate)
    return () => window.removeEventListener('subjects:updated', handleUpdate)
  }, [])

  async function toggleTopic(subjectId, topicId, currentCompleted) {
    await fetch(`${API_BASE}/subjects/${subjectId}/topics/${topicId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !currentCompleted })
    })
    loadSubjects()
    window.dispatchEvent(new Event('schedule:updated'))
  }

  async function handleAddTopic(subjectId) {
    if (!newTopicName.trim()) return
    await fetch(`${API_BASE}/subjects/${subjectId}/topics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicName: newTopicName.trim() })
    })
    setNewTopicName('')
    setAddingTopicFor(null)
    loadSubjects()
  }

  async function handleDeleteTopic(subjectId, topicId) {
    await fetch(`${API_BASE}/subjects/${subjectId}/topics/${topicId}`, {
      method: 'DELETE'
    })
    loadSubjects()
  }

  async function handleAddSubject() {
    if (!subjectName.trim()) return
    await fetch(`${API_BASE}/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: subjectName.trim(), category: subjectCategory, topics: [] })
    })
    setSubjectName('')
    setShowAddSubject(false)
    loadSubjects()
  }

  function showStatus(message, type = 'success') {
    setStatusMessage(message)
    setStatusType(type)
    window.setTimeout(() => {
      setStatusMessage('')
    }, 4000)
  }

  async function handleExtractSyllabus() {
    if (!syllabusText.trim()) return
    setExtracting(true)
    try {
      const selectedSubject = [...data.makaut, ...data.gate, ...data.placement, ...data.coding, ...data.custom].find(s => s.id === extractSubjectId)
      const res = await fetch(`${API_BASE}/subjects/extract-syllabus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: syllabusText, subjectName: selectedSubject?.name || 'Subject' })
      })
      const { topics } = await res.json()
      
      // Add each extracted topic
      if (topics && extractSubjectId) {
        for (const topicStr of topics) {
          await fetch(`${API_BASE}/subjects/${extractSubjectId}/topics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topicName: topicStr })
          })
        }
      }
      setSyllabusText('')
      setShowSyllabusExtract(false)
      loadSubjects()
    } catch (err) {
      console.error('Failed to extract topics:', err)
    } finally {
      setExtracting(false)
    }
  }

  const tabLabels = [
    { key: 'makaut', label: 'MAKAUT College' },
    { key: 'gate', label: 'GATE CS 2027' },
    { key: 'placement', label: 'Placement Core' },
    { key: 'coding', label: 'Coding Practice' },
    { key: 'custom', label: 'Custom Subjects' }
  ]

  const currentList = data[activeTab] || []

  return (
    <section id="subjects" className="px-4 sm:px-6 md:px-10 lg:px-16 py-8 sm:py-10 max-w-5xl mx-auto font-body">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-marigold mb-1">
            Subject & Topic Management
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-linen">
            Syllabus Topic Breakdown
          </h2>
          {statusMessage && (
            <div className={`mt-3 inline-flex rounded-full px-4 py-2 text-xs font-medium ${statusType === 'success' ? 'bg-teal/10 text-teal' : 'bg-rollover/10 text-rollover'}`}>
              {statusMessage}
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setShowSyllabusExtract(true)}
            className="rounded-full border border-teal/40 bg-teal/10 px-4 py-2 text-xs font-medium text-teal hover:bg-teal hover:text-linen transition"
          >
            ✨ AI Upload Syllabus
          </button>
          <button
            onClick={() => setShowAddSubject(true)}
            className="rounded-full bg-marigold px-4 py-2 text-xs font-medium text-ink hover:opacity-90 transition"
          >
            + Add Subject
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-linen/10 pb-3 mb-6">
        {tabLabels.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={[
              'rounded-full px-4 py-1.5 text-xs font-medium transition whitespace-nowrap',
              activeTab === t.key
                ? 'bg-marigold text-ink'
                : 'bg-surface text-linen/70 hover:bg-linen/10'
            ].join(' ')}
          >
            {t.label} ({(data[t.key] || []).length})
          </button>
        ))}
      </div>

      {/* Subject List */}
      {loading ? (
        <p className="text-linen/60">Loading syllabus topics...</p>
      ) : currentList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-linen/20 p-8 text-center text-linen/50">
          No subjects in this category yet. Click "+ Add Subject" above to create one.
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map((subject) => {
            const total = subject.topics?.length || 0
            const done = subject.topics?.filter((t) => t.completed)?.length || 0
            const pct = total > 0 ? Math.round((done / total) * 100) : 0

            return (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-linen/10 bg-surface p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-display text-xl text-linen font-semibold">
                      {subject.name}
                    </h3>
                    <p className="text-xs text-linen/50">
                      {done} of {total} topics completed ({pct}%)
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        setExtractSubjectId(subject.id)
                        setShowSyllabusExtract(true)
                      }}
                      className="text-xs text-teal hover:underline"
                    >
                      + Extract topics with AI
                    </button>
                    <button
                      onClick={async () => {
                        if (!window.confirm('Delete this subject and all its topics?')) return
                        const res = await fetch(`${API_BASE}/subjects/${subject.id}`, {
                          method: 'DELETE'
                        })
                        if (res.ok) {
                          loadSubjects()
                          window.dispatchEvent(new Event('schedule:updated'))
                          showStatus('Subject deleted successfully.', 'success')
                        } else {
                          const text = await res.text()
                          showStatus('Unable to delete subject. Please try again.', 'error')
                          console.error('Failed to delete subject', text)
                        }
                      }}
                      className="text-xs text-rollover hover:underline"
                    >
                      Delete Subject
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 rounded-full bg-ink overflow-hidden mb-4">
                  <div
                    className="h-full bg-teal transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Topics Checkbox Grid */}
                <div className="space-y-2 mb-4">
                  {(subject.topics || []).map((topic) => (
                    <div
                      key={topic.id}
                      className="flex items-center justify-between rounded-lg bg-ink/40 px-3 py-2 text-sm hover:bg-ink/70"
                    >
                      <label className="flex items-center gap-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={!!topic.completed}
                          onChange={() => toggleTopic(subject.id, topic.id, topic.completed)}
                          className="w-4 h-4 accent-teal rounded cursor-pointer"
                        />
                        <span
                          className={
                            topic.completed ? 'line-through text-linen/40' : 'text-linen/90'
                          }
                        >
                          {topic.name}
                        </span>
                      </label>
                      <button
                        onClick={() => handleDeleteTopic(subject.id, topic.id)}
                        className="text-linen/30 hover:text-rollover text-xs px-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Topic Inline Form */}
                {addingTopicFor === subject.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTopicName}
                      onChange={(e) => setNewTopicName(e.target.value)}
                      placeholder="e.g. Unit 3: Dynamic Programming"
                      className="flex-1 rounded-lg border border-linen/15 bg-ink px-3 py-1.5 text-xs text-linen"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTopic(subject.id)}
                    />
                    <button
                      onClick={() => handleAddTopic(subject.id)}
                      className="rounded-full bg-marigold px-3 py-1.5 text-xs font-medium text-ink"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setAddingTopicFor(null)}
                      className="rounded-full px-3 py-1.5 text-xs text-linen/50 hover:text-linen"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setAddingTopicFor(subject.id)
                      setNewTopicName('')
                    }}
                    className="text-xs text-marigold hover:underline font-medium"
                  >
                    + Add Topic
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Add Custom Subject Modal */}
      <AnimatePresence>
        {showAddSubject && (
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
              className="w-full max-w-md rounded-2xl border border-linen/15 bg-surface p-6 space-y-4"
            >
              <h3 className="font-display text-xl text-linen font-semibold">
                Add New Subject
              </h3>
              <div>
                <label className="text-xs text-linen/60 block mb-1">Subject Name</label>
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="e.g. Machine Learning, System Design"
                  className="w-full rounded-lg border border-linen/15 bg-ink px-3 py-2 text-sm text-linen"
                />
              </div>
              <div>
                <label className="text-xs text-linen/60 block mb-1">Category</label>
                <select
                  value={subjectCategory}
                  onChange={(e) => setSubjectCategory(e.target.value)}
                  className="w-full rounded-lg border border-linen/15 bg-ink px-3 py-2 text-sm text-linen"
                >
                  <option value="makaut">MAKAUT College</option>
                  <option value="gate">GATE CS 2027</option>
                  <option value="placement">Placement Core</option>
                  <option value="coding">Coding Practice</option>
                  <option value="custom">Custom Subject</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowAddSubject(false)}
                  className="rounded-full px-4 py-2 text-xs font-medium text-linen/60 hover:text-linen"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSubject}
                  className="rounded-full bg-marigold px-4 py-2 text-xs font-medium text-ink hover:opacity-90"
                >
                  Save Subject
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Syllabus Extractor Modal */}
      <AnimatePresence>
        {showSyllabusExtract && (
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
              className="w-full max-w-lg rounded-2xl border border-teal/30 bg-surface p-6 space-y-4"
            >
              <h3 className="font-display text-xl text-linen font-semibold">
                ✨ AI Syllabus Topic Extractor
              </h3>
              <p className="text-xs text-linen/60">
                Paste syllabus text or notes below. AI will analyze the syllabus and break it down into clean, structured topics automatically.
              </p>
              <div>
                <label className="text-xs text-linen/60 block mb-1">Target Subject</label>
                <select
                  value={extractSubjectId}
                  onChange={(e) => setExtractSubjectId(e.target.value)}
                  className="w-full rounded-lg border border-linen/15 bg-ink px-3 py-2 text-sm text-linen"
                >
                  <option value="">Select a subject...</option>
                  {[...data.makaut, ...data.gate, ...data.placement, ...data.coding, ...data.custom].map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-linen/60 block mb-1">Syllabus Text / Content</label>
                <textarea
                  value={syllabusText}
                  onChange={(e) => setSyllabusText(e.target.value)}
                  rows={6}
                  placeholder="Paste syllabus modules, course objectives, or textbook contents here..."
                  className="w-full rounded-lg border border-linen/15 bg-ink px-3 py-2 text-sm text-linen"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowSyllabusExtract(false)}
                  className="rounded-full px-4 py-2 text-xs font-medium text-linen/60 hover:text-linen"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExtractSyllabus}
                  disabled={extracting || !extractSubjectId || !syllabusText.trim()}
                  className="rounded-full bg-teal px-5 py-2 text-xs font-medium text-linen disabled:opacity-40 hover:opacity-90"
                >
                  {extracting ? 'Extracting Topics with AI...' : 'Extract & Add Topics'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
