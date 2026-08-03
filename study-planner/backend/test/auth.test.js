import test from 'node:test'
import assert from 'node:assert/strict'
import { registerUser, loginUser, verifyToken, removeToken } from '../lib/authStore.js'

test('register and login a user with a valid token', () => {
  const username = `user-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const password = 'secret123'

  const user = registerUser({ username, password })
  assert.equal(user.username, username)

  const session = loginUser({ username, password })
  assert.equal(session.user.username, username)
  assert.ok(session.token)

  const verified = verifyToken(session.token)
  assert.equal(verified?.id, user.id)

  removeToken(session.token)
})
