import bcrypt from 'bcrypt'
import pool from './src/config/database.js'

async function createAdminUser() {
  try {
    console.log('🔍 Criando usuário administrador...\n')

    // 1. Buscar primeira empresa
    const empresaResult = await pool.query(`
      SELECT empresa_id, empresa_nome 
      FROM empresa 
      LIMIT 1
    `)

    if (empresaResult.rows.length === 0) {
      console.error('❌ Nenhuma empresa encontrada no banco!')
      process.exit(1)
    }

    const empresa = empresaResult.rows[0]
    console.log(`✅ Empresa encontrada: ${empresa.empresa_nome}`)

    // 2. Buscar nível de acesso (administrador)
    const nivelResult = await pool.query(`
      SELECT nivel_acesso_id, nivel_acesso_ 
      FROM nivel_acesso 
      WHERE LOWER(nivel_acesso_) LIKE '%admin%'
      LIMIT 1
    `)

    let nivelAcessoId
    if (nivelResult.rows.length === 0) {
      // Se não existir, pegar o primeiro
      const firstNivel = await pool.query(`
        SELECT nivel_acesso_id, nivel_acesso_ 
        FROM nivel_acesso 
        LIMIT 1
      `)
      nivelAcessoId = firstNivel.rows[0].nivel_acesso_id
      console.log(`✅ Nível de acesso: ${firstNivel.rows[0].nivel_acesso_}`)
    } else {
      nivelAcessoId = nivelResult.rows[0].nivel_acesso_id
      console.log(`✅ Nível de acesso: ${nivelResult.rows[0].nivel_acesso_}`)
    }

    // 3. Verificar se usuário já existe
    const existingUser = await pool.query(`
      SELECT email FROM login WHERE email = 'admin@teste.com'
    `)

    if (existingUser.rows.length > 0) {
      console.log('\n⚠️  Usuário admin@teste.com já existe!')
      console.log('💡 Use este email para fazer login\n')
      await pool.end()
      process.exit(0)
    }

    // 4. Gerar hash da senha
    const password = 'admin123'
    const hash = await bcrypt.hash(password, 10)

    // 5. Criar usuário
    await pool.query(`
      INSERT INTO login (
        login_id,
        nivel_acesso_id,
        empresa_id,
        login,
        email,
        senha,
        nome
      ) VALUES (
        gen_random_uuid(),
        $1,
        $2,
        'admin',
        'admin@teste.com',
        $3,
        'Administrador'
      )
    `, [nivelAcessoId, empresa.empresa_id, hash])

    console.log('\n✅ Usuário criado com sucesso!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧 Email: admin@teste.com')
    console.log('🔑 Senha: admin123')
    console.log('🏢 Empresa:', empresa.empresa_nome)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error.message)
    process.exit(1)
  }
}

createAdminUser()








