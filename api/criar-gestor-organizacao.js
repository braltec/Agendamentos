import bcrypt from 'bcrypt'
import pool from './src/config/database.js'

const REVENDA_ID = '550e8400-e29b-41d4-a716-446655440020'
const CONFIRM_CREATE = process.env.CONFIRM_CREATE_GESTOR_ORGANIZACAO === 'YES'
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
    throw new Error('Defina CONFIRM_CREATE_GESTOR_ORGANIZACAO=YES para executar este script')
  }

  if (process.env.NODE_ENV === 'production' && !CONFIRM_PRODUCTION) {
    throw new Error('Execução em produção exige CONFIRM_PRODUCTION_USER_SCRIPT=YES')
  }
}

async function criarGestor() {
  try {
    assertSafeExecution()

    const dadosGestor = {
      org_revenda_id: requireEnv('GESTOR_ORG_REVENDA_ID'),
      empresa_id: requireEnv('GESTOR_EMPRESA_ID'),
      nome: requireEnv('GESTOR_NAME'),
      login: requireEnv('GESTOR_LOGIN'),
      email: requireEnv('GESTOR_EMAIL').toLowerCase(),
      password: requireEnv('GESTOR_PASSWORD'),
      is_gestor_revenda: true,
    }

    if (dadosGestor.password.length < 12) {
      throw new Error('GESTOR_PASSWORD deve ter pelo menos 12 caracteres')
    }

    console.log('Criando gestor de organização')

    const orgResult = await pool.query(
      `SELECT org_revenda_id
       FROM organizacao_revenda
       WHERE org_revenda_id = $1
       LIMIT 1`,
      [dadosGestor.org_revenda_id]
    )

    if (orgResult.rows.length === 0) {
      throw new Error('Organização informada em GESTOR_ORG_REVENDA_ID não foi encontrada')
    }

    const empresaResult = await pool.query(
      `SELECT empresa_id
       FROM empresa
       WHERE empresa_id = $1
       LIMIT 1`,
      [dadosGestor.empresa_id]
    )

    if (empresaResult.rows.length === 0) {
      throw new Error('Empresa informada em GESTOR_EMPRESA_ID não foi encontrada')
    }

    const checkLogin = await pool.query(
      `SELECT login_id
       FROM login
       WHERE login = $1 OR email = $2
       LIMIT 1`,
      [dadosGestor.login, dadosGestor.email]
    )

    if (checkLogin.rows.length > 0) {
      throw new Error('Já existe usuário com o login ou email informado')
    }

    const hashedPassword = await bcrypt.hash(dadosGestor.password, 10)

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
      dadosGestor.empresa_id,
      dadosGestor.login,
      dadosGestor.email,
      hashedPassword,
      dadosGestor.nome,
      dadosGestor.org_revenda_id,
      dadosGestor.is_gestor_revenda,
    ])

    console.log('Gestor criado com sucesso.')
    console.log(`Login ID: ${result.rows[0].login_id}`)
    console.log('A senha não foi exibida. Guarde-a em cofre seguro.')
  } catch (error) {
    console.error('Erro ao criar gestor:', error.message)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

criarGestor()
