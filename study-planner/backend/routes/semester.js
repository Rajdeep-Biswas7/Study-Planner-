import { Router } from 'express'
import { getActiveSemester, getUpcomingSemester, completeSemester, state } from '../lib/store.js'

const router = Router()

router.get('/status', (req, res) => {
  const currentSemester = getActiveSemester()
  const upcomingSemester = getUpcomingSemester()
  res.json({
    currentSemester,
    upcomingSemester,
    allSemesters: state.semesters
  })
})

// Trigger semester completion / auto-transition (e.g. 5th -> 6th Sem)
router.post('/complete', (req, res) => {
  const result = completeSemester()
  res.json(result)
})

export default router
