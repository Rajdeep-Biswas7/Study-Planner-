import { useState } from 'react'
import { motion } from 'framer-motion'
import Calendar from './components/Calendar.jsx'
import DailyPlan from './components/DailyPlan.jsx'
import SubjectManager from './components/SubjectManager.jsx'
import ProgressDashboard from './components/ProgressDashboard.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import SemesterSwitcher from './components/SemesterSwitcher.jsx'
import Navbar from './components/Navbar.jsx'
import AIAssistant from './components/AIAssistant.jsx'

export default function App() {
  const [entered, setEntered] = useState(false)

  return (
    <div className="min-h-screen overflow-x-hidden bg-ink text-linen">
      {/* Calendar landing intro */}
      <Calendar onEnter={() => setEntered(true)} />

      {/* Main dashboard sections */}
      {entered && (
        <motion.main
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Navbar />
          <header className="px-4 sm:px-6 md:px-10 lg:px-16 pt-8 sm:pt-12 pb-4 max-w-5xl mx-auto">
            <p className="font-body text-[11px] sm:text-xs uppercase tracking-[0.25em] text-marigold font-semibold">
              Parakram GATE-CS 2027 · MAKAUT IT · Placement & Coding
            </p>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-linen mt-2 leading-tight">
              One Plan. Topic Mastery. Zero Excuses.
            </h1>
          </header>

          <DailyPlan />
          <SubjectManager />
          <ProgressDashboard />
          <AIAssistant />
          <SettingsPanel />
          <SemesterSwitcher />
        </motion.main>
      )}
    </div>
  )
}
