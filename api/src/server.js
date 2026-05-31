import app from './app.js'
import pool from './config/database.js'
import { logger } from './utils/logger.js'

const PORT = process.env.PORT || 5000

// Testar conexão com o banco antes de iniciar o servidor
async function startServer() {
  try {
    // Testar conexão
    await pool.query('SELECT NOW()')
    logger.info('Banco de dados conectado com sucesso')

    // Iniciar servidor
    app.listen(PORT, () => {
      logger.info('Servidor iniciado', { port: PORT })
    })
  } catch (error) {
    logger.error('Erro ao iniciar servidor', { error })
    process.exit(1)
  }
}

startServer()







