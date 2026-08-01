import { Router } from 'express'
import {
  getAllSubjectsGrouped,
  addSubject,
  updateSubject,
  deleteSubject,
  addTopic,
  updateTopic,
  deleteTopic
} from '../lib/store.js'
import { callClaude } from '../../ai/claudeClient.js'

const router = Router()

// GET all subjects grouped by category
router.get('/', (req, res) => {
  res.json(getAllSubjectsGrouped())
})

// POST add a new custom subject
router.post('/', (req, res) => {
  const { name, category, topics } = req.body
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Subject name is required' })
  }
  const newSubject = addSubject({ name: name.trim(), category: category || 'custom', topics })
  res.json(newSubject)
})

// PUT update a subject
router.put('/:id', (req, res) => {
  const updated = updateSubject(req.params.id, req.body)
  if (!updated) return res.status(404).json({ error: 'Subject not found' })
  res.json(updated)
})

// DELETE a custom subject
router.delete('/:id', (req, res) => {
  const success = deleteSubject(req.params.id)
  if (!success) return res.status(404).json({ error: 'Subject not found or cannot delete' })
  res.json({ success: true })
})

// POST add topic to subject
router.post('/:id/topics', (req, res) => {
  const { topicName } = req.body
  if (!topicName || !topicName.trim()) {
    return res.status(400).json({ error: 'Topic name is required' })
  }
  const topic = addTopic(req.params.id, topicName.trim())
  if (!topic) return res.status(404).json({ error: 'Subject not found' })
  res.json(topic)
})

// PUT update topic (e.g. toggle completion or rename)
router.put('/:id/topics/:topicId', (req, res) => {
  const updated = updateTopic(req.params.id, req.params.topicId, req.body)
  if (!updated) return res.status(404).json({ error: 'Topic or subject not found' })
  res.json(updated)
})

// DELETE topic
router.delete('/:id/topics/:topicId', (req, res) => {
  const success = deleteTopic(req.params.id, req.params.topicId)
  if (!success) return res.status(404).json({ error: 'Topic not found' })
  res.json({ success: true })
})

// POST extract syllabus topics using Claude AI
router.post('/extract-syllabus', async (req, res) => {
  const { text, subjectName } = req.body
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Syllabus text or content is required' })
  }

  const prompt = `Extract a structured list of study topics from the following syllabus text for the subject "${subjectName || 'Subject'}".
Return strictly a JSON array of strings, where each string is a clear, concise topic module name (e.g. ["Module 1: Basic Principles", "Module 2: Advanced Concepts"]).
No extra commentary, markdown wrapper, or text outside the JSON array.

Syllabus Text:
${text}`

  const system = 'You are an expert academic syllabus analyzer for Computer Science & Engineering / IT B.Tech courses.'
  const reply = await callClaude({ system, prompt, maxTokens: 800 })

  if (!reply) {
    // Fallback: split text by lines or numbers
    const fallbackTopics = text
      .split('\n')
      .map(line => line.trim().replace(/^[-*•\d+.\s]+/, ''))
      .filter(line => line.length > 3)
      .slice(0, 10)
    return res.json({ topics: fallbackTopics })
  }

  try {
    // Clean reply in case of markdown block wrappers
    const cleaned = reply.replace(/```json/g, '').replace(/```/g, '').trim()
    const topics = JSON.parse(cleaned)
    res.json({ topics: Array.isArray(topics) ? topics : [topics] })
  } catch (err) {
    console.error('Failed to parse AI syllabus extraction:', err, reply)
    res.json({ topics: [text.slice(0, 100)] })
  }
})

export default router
