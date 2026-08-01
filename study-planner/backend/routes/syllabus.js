import { Router } from 'express'
import { addSyllabusUpdate, loadSyllabusUpdates, searchKnowledgeBase } from '../lib/syllabusStore.js'

const router = Router()

router.get('/updates', (req, res) => {
  res.json(loadSyllabusUpdates())
})

router.post('/updates', (req, res) => {
  const entry = addSyllabusUpdate(req.body)
  res.json(entry)
})

router.get('/search', (req, res) => {
  const q = req.query.q || ''
  res.json(searchKnowledgeBase(q))
})

export default router
