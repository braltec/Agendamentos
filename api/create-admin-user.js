import bcrypt from 'bcrypt'
import pool from './src/config/database.js'

const CONFIRM_CREATE = process.env.CONFIRM_CREATE_ADMIN_USER === 'YES'
const CONFIRM_PRODUCTION = process.env.CONFIRM_PRODUCTION_USER_SCRIPT === 'YES'

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Variável obrigatória ausente: ${name}`)
  }
  return value
}

function assertSafeExecution() {
  if (!CONFIRM_CREATE) {
    throw new Error('Defina CONFIRM_CREATE_ADMIN_USER=YES para executar este script')
  }

  if (process.env.NODE_ENV === 'production' && !CONFIRM_PRODUCTION) {
    throw new Error('Execução em produção exige CONFIRM_PRODUCTION_USER_SCRIPT=YES')
  }
}

async function createAdminUser() {
  try {
    assertSafeExecution()

    const adminData = {
      empresa_id: requireEnv('ADMIN_EMPRESA_ID'),
      email: requireEnv('ADMIN_EMAIL').toLowerCase(),
      password: requireEnv('ADMIN_PASSWORD'),
      login: requireEnv('ADMIN_LOGIN'),
      nome: requireEnv('ADMIN_NAME'),
      nivel_acesso_id: process.env.ADMIN_NIVEL_ACESSO_ID || null,
    }

    if (adminData.password.length < 12) {
      throw new Error('ADMIN_PASSWORD deve ter pelo menos 12 caracteres')
    }

    console.log('Criando usuário administrador local')

    const empresaResult = await pool.query(
      `SELECT empresa_id
       FROM empresa
       WHERE empresa_id = $1
       LIMIT 1`,
      [adminData.empresa_id]
    )

    if (empresaResult.rows.length === 0) {
      throw new Error('Empresa informada em ADMIN_EMPRESA_ID não foi encontrada')
    }

    let nivelAcessoId = adminData.nivel_acesso_id

    if (!nivelAcessoId) {
      const nivelResult = await pool.query(`
        SELECT nivel_acesso_id
        FROM nivel_acesso
        WHERE LOWER(nivel_acesso_) LIKE '%admin%'
        LIMIT 1
      `)

      if (nivelResult.rows.length === 0) {
        throw new Error('Nível de acesso administrador não encontrado')
      }

      nivelAcessoId = nivelResult.rows[0].nivel_acesso_id
    }

    const existingUser = await pool.query(
      `SELECT login_id FROM login WHERE email = $1 LIMIT 1`,
      [adminData.email]
    )

    if (existingUser.rows.length > 0) {
      console.log('Usuário já existe. Nenhuma alteração foi feita.')
      await pool.end()
      process.exit(0)
    }

    const hash = await bcrypt.hash(adminData.password, 10)

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
        $3,
        $4,
        $5,
        $6
      )
    `, [
      nivelAcessoId,
      adminData.empresa_id,
      adminData.login,
      adminData.email,
      hash,
      adminData.nome,
    ])

    console.log('Usuário administrador criado com sucesso.')
    console.log('A senha não foi exibida. Guarde-a em cofre seguro.')

    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error.message)
    await pool.end()
    process.exit(1)
  }
}

createAdminUser()
