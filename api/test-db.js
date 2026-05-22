import pool from './src/config/database.js'

async function testConnection() {
  try {
    console.log('🔍 Testando conexão com banco de dados...')
    console.log('📍 Host:', process.env.DB_HOST)
    console.log('📍 Database:', process.env.DB_NAME)
    
    const result = await pool.query('SELECT NOW() as now, current_database() as database')
    
    console.log('✅ Conexão bem-sucedida!')
    console.log('⏰ Hora do servidor:', result.rows[0].now)
    console.log('💾 Banco de dados:', result.rows[0].database)
    
    // Testar se as tabelas existem
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    
    console.log(`\n📋 Tabelas encontradas: ${tables.rows.length}`)
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`)
    })
    
    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro ao conectar:', error.message)
    process.exit(1)
  }
}

testConnection()








