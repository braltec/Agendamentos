import crypto from 'crypto'

const WINDOW_MS = Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000)
const MAX_ATTEMPTS_BY_IP = Number(process.env.LOGIN_RATE_LIMIT_IP_MAX || 30)
const MAX_ATTEMPTS_BY_EMAIL = Number(process.env.LOGIN_RATE_LIMIT_EMAIL_MAX || 10)
const attempts = new Map()

function normalizeIp(req) {
  const forwardedFor = req.headers['x-forwarded-for']
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim()
  }

  return req.ip || req.socket?.remoteAddress || 'unknown'
}

function hashEmail(email) {
  return crypto
    .createHash('sha256')
    .update(String(email || '').trim().toLowerCase())
    .digest('hex')
}

function consumeAttempt(key, maxAttempts, now) {
  const current = attempts.get(key)

  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }

  current.count += 1
  attempts.set(key, current)
  return current.count > maxAttempts
}

function cleanupExpired(now) {
  for (const [key, value] of attempts.entries()) {
    if (value.resetAt <= now) {
      attempts.delete(key)
    }
  }
}

export function loginRateLimit(req, res, next) {
  const now = Date.now()
  cleanupExpired(now)

  const ipKey = `ip:${normalizeIp(req)}`
  const emailKey = `email:${hashEmail(req.body?.email || req.body?.login || '')}`

  const ipBlocked = consumeAttempt(ipKey, MAX_ATTEMPTS_BY_IP, now)
  const emailBlocked = consumeAttempt(emailKey, MAX_ATTEMPTS_BY_EMAIL, now)

  if (ipBlocked || emailBlocked) {
    return res.status(429).json({
      success: false,
      message: 'Muitas tentativas de login. Tente novamente em alguns minutos.',
    })
  }

  next()
}
