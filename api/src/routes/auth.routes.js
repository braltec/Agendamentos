import express from 'express'
import { login, me, updateThemePreference } from '../controllers/auth.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { loginRateLimit } from '../middleware/loginRateLimit.middleware.js'

const router = express.Router()

// Rotas públicas
router.post('/login', loginRateLimit, login)

// Rotas protegidas
router.get('/me', authMiddleware, me)
router.put('/theme', authMiddleware, updateThemePreference)

export default router






