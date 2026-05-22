import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { errorMiddleware } from './middleware/error.middleware.js'

// Importar rotas
import authRoutes from './routes/auth.routes.js'
import empresasRoutes from './routes/empresas.routes.js'
import wizardRoutes from './routes/wizard.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import organizacaoRevendaRoutes from './routes/organizacao-revenda.routes.js'

dotenv.config()

const app = express()

// Middlewares globais
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
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

