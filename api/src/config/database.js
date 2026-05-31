import pg from 'pg'
import dotenv from 'dotenv'
import { logger } from '../utils/logger.js'

dotenv.config()

const { Pool } = pg
const isProduction = process.env.NODE_ENV === 'production'
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL)

if (isProduction && !hasDatabaseUrl) {
  const requiredDbVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
  const missingDbVars = requiredDbVars.filter(name => !process.env[name])

  if (missingDbVars.length > 0) {
    throw new Error(`Variáveis obrigatórias de banco ausentes: ${missingDbVars.join(', ')}`)
  }
}

const poolConfig = hasDatabaseUrl
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
        : undefined,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'agendamento',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    }

const pool = new Pool({
  ...poolConfig,
  max: Number(process.env.DB_POOL_MAX || 20),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Testar conexão
pool.on('connect', () => {
  logger.info('Conectado ao PostgreSQL')
})

pool.on('error', (err) => {
  logger.error('Erro inesperado no PostgreSQL', { error: err })
  process.exit(-1)
})

export default pool






