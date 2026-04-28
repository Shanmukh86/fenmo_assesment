const { signup, login } = require('../services/authService')

async function handleSignup(req, res, next) {
  try {
    const { email, password, name } = req.body
    const result = await signup({ email, password, name })
    res.json({ success: true, data: { user: { id: result.user.id, email: result.user.email, name: result.user.name }, token: result.token }, timestamp: new Date().toISOString() })
  } catch (err) {
    next(err)
  }
}

async function handleLogin(req, res, next) {
  try {
    const { email, password } = req.body
    const result = await login({ email, password })
    res.json({ success: true, data: { user: { id: result.user.id, email: result.user.email, name: result.user.name }, token: result.token }, timestamp: new Date().toISOString() })
  } catch (err) {
    next(err)
  }
}

module.exports = { handleSignup, handleLogin }
