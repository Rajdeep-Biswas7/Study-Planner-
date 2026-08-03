import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import scheduleRoutes from './routes/schedule.js'
import semesterRoutes from './routes/semester.js'
import settingsRoutes from './routes/settings.js'
import dashboardRoutes from './routes/dashboard.js'
import syllabusRoutes from './routes/syllabus.js'
import subjectsRoutes from './routes/subjects.js'
import chatRoutes from './routes/chat.js'
import analysisRoutes from './routes/analysis.js'
import authRoutes from './routes/auth.js'
import { runWithUser } from './lib/fileStore.js'
import { verifyToken } from './lib/authStore.js'

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use((req, res, next) => {
  const authHeader = req.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  const verified = token ? verifyToken(token) : null
  const userId = verified?.id || req.get('x-user-id') || req.query.userId || 'default'
  req.userId = userId
  runWithUser(userId, () => next())
})

app.use('/api/plan', scheduleRoutes)
app.use('/api/semester', semesterRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/syllabus', syllabusRoutes)
app.use('/api/subjects', subjectsRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/analysis', analysisRoutes)
app.use('/api/auth', authRoutes)

app.get('/api/health', (req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }))

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 4000
  app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`))
}

export default app
