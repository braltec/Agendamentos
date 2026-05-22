import pool from './src/config/database.js'
import bcrypt from 'bcrypt'

/**
 * Script para criar gestor de uma organização
 * 
 * Como usar:
 * node criar-gestor-organizacao.js
 */

async function criarGestor() {
  try {
    console.log('🔍 Buscando organizações disponíveis...\n')
    
    // Listar organizações
    const orgs = await pool.query(`
      SELECT 
        org_revenda_id, 
        org_nome, 
        org_razao_social,
        (SELECT COUNT(*) FROM login WHERE org_revenda_id = o.org_revenda_id) as total_usuarios
      FROM organizacao_revenda o
      ORDER BY org_criado_em DESC
    `)
    
    if (orgs.rows.length === 0) {
      console.log('❌ Nenhuma organização encontrada!')
      console.log('   Crie uma organização primeiro.')
      process.exit(1)
    }
    
    console.log('📋 Organizações disponíveis:\n')
    orgs.rows.forEach((org, index) => {
      console.log(`${index + 1}. ${org.org_nome}`)
      console.log(`   ID: ${org.org_revenda_id}`)
      console.log(`   Usuários: ${org.total_usuarios}`)
      console.log('')
    })
    
    // Para este exemplo, vou pegar a primeira organização
    const orgEscolhida = orgs.rows[0]
    const orgId = orgEscolhida.org_revenda_id
    
    console.log(`✅ Usando organização: ${orgEscolhida.org_nome}\n`)
    
    // Dados do gestor
    const dadosGestor = {
      nome: 'Gestor Principal',
      login: 'gestor.principal',
      email: 'gestor@teste.com',
      senha: 'senha123',
      is_gestor_revenda: true
    }
    
    console.log('👤 Dados do gestor:')
    console.log(`   Nome: ${dadosGestor.nome}`)
    console.log(`   Login: ${dadosGestor.login}`)
    console.log(`   Email: ${dadosGestor.email}`)
    console.log(`   Senha: ${dadosGestor.senha}`)
    console.log(`   Tipo: Gestor\n`)
    
    // Verificar se login já existe
    const checkLogin = await pool.query(
      'SELECT login_id FROM login WHERE login = $1',
      [dadosGestor.login]
    )
    
    if (checkLogin.rows.length > 0) {
      console.log('⚠️  Login já existe! Usando outro login...')
      dadosGestor.login = `gestor.${Date.now()}`
      console.log(`   Novo login: ${dadosGestor.login}\n`)
    }
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(dadosGestor.senha, 10)
    
    // Pegar primeira empresa como placeholder
    const empresaPlaceholder = await pool.query('SELECT empresa_id FROM empresa LIMIT 1')
    
    if (empresaPlaceholder.rows.length === 0) {
      console.log('❌ Nenhuma empresa encontrada no sistema!')
      console.log('   Crie pelo menos uma empresa primeiro.')
      process.exit(1)
    }
    
    // Criar gestor
    const REVENDA_ID = '550e8400-e29b-41d4-a716-446655440020'
    
    const result = await pool.query(`
      INSERT INTO login (
        login_id,
        nivel_acesso_id,
        empresa_id,
        login,
        email,
        senha,
        nome,
        org_revenda_id,
        is_gestor_revenda
      ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING login_id, nome, login, email, org_revenda_id, is_gestor_revenda, created
    `, [
      REVENDA_ID,
      empresaPlaceholder.rows[0].empresa_id,
      dadosGestor.login,
      dadosGestor.email,
      hashedPassword,
      dadosGestor.nome,
      orgId,
      dadosGestor.is_gestor_revenda
    ])
    
    console.log('✅ Gestor criado com sucesso!\n')
    console.log('📊 Dados do gestor criado:')
    console.log(`   ID: ${result.rows[0].login_id}`)
    console.log(`   Nome: ${result.rows[0].nome}`)
    console.log(`   Login: ${result.rows[0].login}`)
    console.log(`   Email: ${result.rows[0].email}`)
    console.log(`   É Gestor: ${result.rows[0].is_gestor_revenda}`)
    console.log(`   Criado em: ${result.rows[0].created}`)
    console.log('')
    console.log('🔑 Credenciais de acesso:')
    console.log(`   Email: ${dadosGestor.email}`)
    console.log(`   Senha: ${dadosGestor.senha}`)
    console.log('')
    console.log('📝 Próximos passos:')
    console.log('   1. Faça login com as credenciais acima')
    console.log('   2. Acesse o menu "Vendedores"')
    console.log('   3. Clique em "Novo Vendedor" para criar vendedores')
    
  } catch (error) {
    console.error('❌ Erro ao criar gestor:', error)
  } finally {
    await pool.end()
  }
}

// Executar
criarGestor()



