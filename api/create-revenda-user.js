import pg from 'pg'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'agendamento',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
})

async function createRevendaUser() {
  const client = await pool.connect()
  
  try {
    console.log('🔧 Criando usuário Revenda de teste...\n')
    
    await client.query('BEGIN')

    // 1. Verificar se já existe o nível Revenda
    const checkNivel = await client.query(`
      SELECT nivel_acesso_id 
      FROM nivel_acesso 
      WHERE nivel_acesso_id = '550e8400-e29b-41d4-a716-446655440020'
    `)
    
    if (checkNivel.rows.length === 0) {
      console.log('❌ Nível de acesso "Revenda" não encontrado!')
      console.log('   Execute primeiro: node api/migrations/add-perfil-revenda.sql')
      await client.query('ROLLBACK')
      return
    }
    
    console.log('✅ Nível de acesso "Revenda" encontrado\n')

    // 2. Buscar uma empresa para vincular (usaremos a primeira empresa ativa)
    const empresaResult = await client.query(`
      SELECT empresa_id, empresa_nome
      FROM empresa
      WHERE status = 'ativa'
      LIMIT 1
    `)
    
    if (empresaResult.rows.length === 0) {
      console.log('❌ Nenhuma empresa encontrada para vincular')
      await client.query('ROLLBACK')
      return
    }
    
    const empresa = empresaResult.rows[0]
    console.log(`✅ Usando empresa: ${empresa.empresa_nome}`)
    console.log(`   ID: ${empresa.empresa_id}\n`)

    // 3. Credenciais do usuário Revenda
    const revendaData = {
      login_id: 'f0000000-0000-0000-0000-000000000001', // ID fixo para facilitar testes
      nome: 'Revenda Teste',
      email: 'revenda@teste.com',
      login: 'revenda',
      senha: 'revenda123',
      nivel_acesso_id: '550e8400-e29b-41d4-a716-446655440020', // Revenda
      empresa_id: empresa.empresa_id
    }

    // 4. Verificar se já existe usuário com este email
    const checkUser = await client.query(`
      SELECT login_id, email 
      FROM login 
      WHERE email = $1 OR login_id = $2
    `, [revendaData.email, revendaData.login_id])
    
    if (checkUser.rows.length > 0) {
      console.log('⚠️  Usuário já existe! Atualizando senha...\n')
      
      const senha_hash = await bcrypt.hash(revendaData.senha, 10)
      
      await client.query(`
        UPDATE login 
        SET 
          senha = $1,
          nivel_acesso_id = $2,
          nome = $3
        WHERE email = $4 OR login_id = $5
      `, [
        senha_hash,
        revendaData.nivel_acesso_id,
        revendaData.nome,
        revendaData.email,
        revendaData.login_id
      ])
      
      console.log('✅ Usuário atualizado com sucesso!\n')
    } else {
      console.log('📝 Criando novo usuário Revenda...\n')
      
      const senha_hash = await bcrypt.hash(revendaData.senha, 10)
      
      await client.query(`
        INSERT INTO login (
          login_id,
          nivel_acesso_id,
          empresa_id,
          login,
          email,
          senha,
          nome,
          created
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [
        revendaData.login_id,
        revendaData.nivel_acesso_id,
        revendaData.empresa_id,
        revendaData.login,
        revendaData.email,
        senha_hash,
        revendaData.nome
      ])
      
      console.log('✅ Usuário Revenda criado com sucesso!\n')
    }

    await client.query('COMMIT')
    
    // Exibir credenciais
    console.log('═══════════════════════════════════════════')
    console.log('📋 CREDENCIAIS DO USUÁRIO REVENDA')
    console.log('═══════════════════════════════════════════')
    console.log('')
    console.log(`  👤 Nome:     ${revendaData.nome}`)
    console.log(`  📧 Email:    ${revendaData.email}`)
    console.log(`  🔑 Senha:    ${revendaData.senha}`)
    console.log(`  🏢 Empresa:  ${empresa.empresa_nome}`)
    console.log(`  🆔 Login ID: ${revendaData.login_id}`)
    console.log('')
    console.log('═══════════════════════════════════════════')
    console.log('')
    console.log('🎯 PERMISSÕES:')
    console.log('   ✅ Pode cadastrar novas empresas')
    console.log('   ✅ Pode ver/editar empresas que cadastrou')
    console.log('   ❌ NÃO pode ver empresas de outros')
    console.log('   ❌ NÃO pode ver todas as empresas')
    console.log('')
    console.log('🧪 TESTE:')
    console.log('   1. Faça login com as credenciais acima')
    console.log('   2. Vá em "Empresas"')
    console.log('   3. Cadastre uma nova empresa')
    console.log('   4. Você verá apenas empresas que você cadastrar')
    console.log('')
    console.log('═══════════════════════════════════════════')
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Erro ao criar usuário Revenda:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

createRevendaUser()
  .then(() => {
    console.log('')
    console.log('✅ Script concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })



