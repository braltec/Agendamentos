import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import pool from './config/database.js'
import { errorMiddleware } from './middleware/error.middleware.js'

// Importar rotas
import authRoutes from './routes/auth.routes.js'
import empresasRoutes from './routes/empresas.routes.js'
import wizardRoutes from './routes/wizard.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import organizacaoRevendaRoutes from './routes/organizacao-revenda.routes.js'

dotenv.config()

const app = express()
const isProduction = process.env.NODE_ENV === 'production'
const defaultCorsOrigin = isProduction ? '' : 'http://localhost:3000'
const corsOrigins = (process.env.CORS_ORIGIN || defaultCorsOrigin)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)
const bodyLimit = process.env.BODY_LIMIT || '1mb'

if (isProduction && corsOrigins.length === 0) {
  throw new Error('CORS_ORIGIN obrigatório em produção')
}

if (process.env.TRUST_PROXY) {
  const trustProxy = Number.isNaN(Number(process.env.TRUST_PROXY))
    ? process.env.TRUST_PROXY
    : Number(process.env.TRUST_PROXY)
  app.set('trust proxy', trustProxy)
}

// Middlewares globais
app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true)
      return
    }

    callback(new Error('Origem não permitida pelo CORS'))
  },
  credentials: true,
}))
app.use(express.json({ limit: bodyLimit }))
app.use(express.urlencoded({ extended: true, limit: bodyLimit }))

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/health/db', async (req, res) => {
  try {
    await pool.query('SELECT 1')

    res.json({
      status: 'ok',
      database: 'ok',
      timestamp: new Date().toISOString(),
    })
  } catch {
    res.status(503).json({
      status: 'error',
      database: 'unavailable',
      timestamp: new Date().toISOString(),
    })
  }
})

// Rotas da API
app.use('/api/auth', authRoutes)
app.use('/api/empresas', empresasRoutes)
app.use('/api/wizard', wizardRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/organizacoes', organizacaoRevendaRoutes)

// Middleware de erro (deve ser o último)
app.use(errorMiddleware)

export default app
