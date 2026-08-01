import test from 'node:test'
import assert from 'node:assert/strict'
import { addSyllabusUpdate, searchKnowledgeBase, loadSyllabusUpdates } from '../lib/syllabusStore.js'

test('assistant search finds matching syllabus notes and topics', () => {
  const original = loadSyllabusUpdates()
  const newEntry = addSyllabusUpdate({ title: 'New topic', details: 'Added neural networks to AI syllabus' })

  const results = searchKnowledgeBase('neural networks')
  assert.ok(results.some((item) => item.details.includes('neural networks')))
  assert.ok(results.some((item) => item.source === 'syllabus'))

  loadSyllabusUpdates().slice()
  if (original.length === 0) {
    addSyllabusUpdate({ title: 'Cleanup', details: 'Remove test entry' })
  }
})
