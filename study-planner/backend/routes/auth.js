import { Router } from 'express'
import { registerUser, loginUser } from '../lib/authStore.js'

const router = Router()

router.post('/register', (req, res) => {
  try {
    const user = registerUser(req.body)
    res.json({ user, token: loginUser(req.body).token })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/login', (req, res) => {
  try {
    const result = loginUser(req.body)
    res.json(result)
  } catch (error) {
    res.status(401).json({ error: error.message })
  }
})

export default router
