import app from './app.js'
import pool from './config/database.js'

const PORT = process.env.PORT || 5000

// Testar conexão com o banco antes de iniciar o servidor
async function startServer() {
  try {
    // Testar conexão
    await pool.query('SELECT NOW()')
    console.log('✅ Banco de dados conectado com sucesso')

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`)
      console.log(`📍 http://localhost:${PORT}`)
      console.log(`🏥 Health check: http://localhost:${PORT}/health`)
    })
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error)
    process.exit(1)
  }
}

startServer()








