import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns'
import events from '../data/events-bengali.json'

export default function Calendar({ onEnter }) {
  const [showIntro, setShowIntro] = useState(true)
  const today = new Date()

  const monthDays = useMemo(() => {
    const start = startOfMonth(today)
    const end = endOfMonth(today)
    return eachDayOfInterval({ start, end })
  }, [])

  const eventFor = (day) =>
    events.find((e) => isSameDay(new Date(e.date), day))

  function dismissIntro() {
    setShowIntro(false)
    setTimeout(() => onEnter?.(), 400)
  }

  return (
    <>
      <AnimatePresence>
        {showIntro && (
          <motion.div
            key="intro-calendar"
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink text-linen px-4 sm:px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <motion.p
              className="font-body text-xs sm:text-sm tracking-[0.3em] uppercase text-marigold mb-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {format(today, 'EEEE')}
            </motion.p>

            <motion.h1
              className="font-display text-5xl sm:text-7xl md:text-8xl font-semibold mb-8 sm:mb-10 text-center"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {format(today, 'd MMMM')}
            </motion.h1>

            <motion.div
              className="grid grid-cols-7 gap-1 sm:gap-2 max-w-md sm:max-w-xl w-full px-2"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.02, delayChildren: 0.5 } }
              }}
            >
              {monthDays.map((day) => {
                const ev = eventFor(day)
                const todayFlag = isToday(day)
                return (
                  <motion.div
                    key={day.toISOString()}
                    variants={{
                      hidden: { opacity: 0, y: 8 },
                      show: { opacity: 1, y: 0 }
                    }}
                    className={[
                      'aspect-square rounded-md sm:rounded-lg flex items-center justify-center text-xs sm:text-sm font-body relative',
                      todayFlag
                        ? 'bg-marigold text-ink font-semibold ring-2 ring-marigold ring-offset-2 ring-offset-surface'
                        : ev
                        ? 'bg-rollover/30 text-linen'
                        : 'bg-white/5 text-linen/70'
                    ].join(' ')}
                    title={ev?.name}
                  >
                    {format(day, 'd')}
                    {ev && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-marigold" />
                    )}
                  </motion.div>
                )
              })}
            </motion.div>

            <motion.button
              onClick={dismissIntro}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="mt-8 sm:mt-10 font-body text-xs sm:text-sm text-linen/70 hover:text-marigold underline underline-offset-4 cursor-pointer py-2 px-4"
            >
              Enter today's plan →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
