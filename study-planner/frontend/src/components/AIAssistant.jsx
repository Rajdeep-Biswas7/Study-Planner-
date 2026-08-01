import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'

const API_BASE = '/api'

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your AI Study Mentor. I am synced with your active MAKAUT sem, GATE CS 2027 goals, and daily progress. How can I help you today?'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  // Daily Analysis state
  const [dailyReport, setDailyReport] = useState(null)
  const [loadingReport, setLoadingReport] = useState(false)

  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(textToSend) {
    const text = textToSend || input
    if (!text || !text.trim()) return

    const userMsg = { role: 'user', content: text.trim() }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages })
      })
      const reply = await res.json()
      if (reply && reply.content) {
        setMessages((prev) => [...prev, reply])
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I lost connection to the server. Make sure the backend is running!' }
      ])
    } finally {
      setLoading(false)
    }
  }

  async function fetchDailyAnalysis() {
    setLoadingReport(true)
    try {
      const res = await fetch(`${API_BASE}/analysis/daily`)
      const data = await res.json()
      setDailyReport(data)
    } catch (err) {
      console.error('Failed to load daily analysis:', err)
    } finally {
      setLoadingReport(false)
    }
  }

  const quickPrompts = [
    '✨ Auto-generate study tips based on my progress',
    '📅 Suggest a daily study schedule tweak for today',
    '🎓 How should I balance MAKAUT vs GATE CS 2027?'
  ]

  return (
    <section id="assistant" className="px-6 md:px-16 py-10 max-w-4xl mx-auto font-body">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-marigold mb-1">
            AI Assistant & Mentor
          </p>
          <h2 className="font-display text-3xl font-semibold text-linen">
            Real AI Chatbot & Daily Analysis
          </h2>
        </div>
        <button
          onClick={fetchDailyAnalysis}
          disabled={loadingReport}
          className="rounded-full border border-teal/40 bg-teal/10 px-5 py-2 text-xs font-semibold text-teal hover:bg-teal hover:text-linen transition disabled:opacity-50"
        >
          {loadingReport ? 'Analyzing...' : '📊 Run End-of-Day AI Review'}
        </button>
      </div>

      {/* Daily AI Analysis Report Card */}
      {dailyReport && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-teal/40 bg-surface p-6 mb-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl text-linen font-bold">
              📊 Daily AI Performance Review ({dailyReport.date})
            </h3>
            <button
              onClick={() => setDailyReport(null)}
              className="text-xs text-linen/40 hover:text-linen"
            >
              ✕ Close
            </button>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg bg-ink/40 p-3">
              <span className="text-linen/50 block">Time Studied</span>
              <span className="font-bold text-linen text-sm">
                {dailyReport.totalCompletedMinutes} / {dailyReport.dailyGoalMinutes} mins
              </span>
            </div>
            <div className="rounded-lg bg-ink/40 p-3">
              <span className="text-linen/50 block">Blocks Completed</span>
              <span className="font-bold text-teal text-sm">
                {dailyReport.completedBlocksCount} blocks done ({dailyReport.pendingBlocksCount} pending)
              </span>
            </div>
            <div className="rounded-lg bg-ink/40 p-3">
              <span className="text-linen/50 block">Challenge Status</span>
              <span className="font-bold text-marigold text-sm">
                {dailyReport.challengeComplete ? '✓ ACCOMPLISHED' : 'IN PROGRESS'}
              </span>
            </div>
          </div>
          <div className="rounded-lg bg-ink/60 p-4 text-sm text-linen/90 whitespace-pre-wrap leading-relaxed border border-linen/10">
            {dailyReport.analysisText}
          </div>
        </motion.div>
      )}

      {/* Chat Window Container */}
      <div className="rounded-2xl border border-linen/15 bg-surface flex flex-col h-[520px] overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[82%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-marigold text-ink font-medium rounded-br-none'
                    : 'bg-ink/80 text-linen/90 border border-linen/10 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-ink/80 border border-linen/10 text-linen/60 rounded-2xl rounded-bl-none px-5 py-3 text-xs animate-pulse">
                Antigravity AI is thinking...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-6 py-2 border-t border-linen/10 bg-ink/40 flex flex-wrap gap-2">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => sendMessage(prompt)}
              disabled={loading}
              className="rounded-full border border-linen/15 bg-surface/80 px-3 py-1 text-xs text-linen/70 hover:text-marigold hover:border-marigold/40 transition disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-linen/10 bg-ink flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about syllabus, study tips, GATE topics, or timetable..."
            disabled={loading}
            className="flex-1 rounded-xl border border-linen/15 bg-surface px-4 py-2.5 text-sm text-linen placeholder:text-linen/40 focus:outline-none focus:border-marigold"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-marigold px-6 py-2.5 text-sm font-semibold text-ink hover:opacity-90 transition disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </section>
  )
}
