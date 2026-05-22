import express from 'express'
import { login, me } from '../controllers/auth.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const router = express.Router()

// Rotas públicas
router.post('/login', login)

// Rotas protegidas
router.get('/me', authMiddleware, me)

export default router








