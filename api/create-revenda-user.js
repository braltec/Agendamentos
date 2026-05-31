import crypto from 'crypto'
import pg from 'pg'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg
const REVENDA_ID = '550e8400-e29b-41d4-a716-446655440020'
const CONFIRM_CREATE = process.env.CONFIRM_CREATE_REVENDA_USER === 'YES'
const CONFIRM_PRODUCTION = process.env.CONFIRM_PRODUCTION_USER_SCRIPT === 'YES'

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'agendamento',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
})

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Variável obrigatória ausente: ${name}`)
  }
  return value
}

function assertSafeExecution() {
  if (!CONFIRM_CREATE) {
    throw new Error('Defina CONFIRM_CREATE_REVENDA_USER=YES para executar este script')
  }

  if (process.env.NODE_ENV === 'production' && !CONFIRM_PRODUCTION) {
    throw new Error('Execução em produção exige CONFIRM_PRODUCTION_USER_SCRIPT=YES')
  }
}

async function createRevendaUser() {
  const client = await pool.connect()

  try {
    assertSafeExecution()

    const revendaData = {
      login_id: process.env.REVENDA_LOGIN_ID || crypto.randomUUID(),
      nome: requireEnv('REVENDA_NAME'),
      email: requireEnv('REVENDA_EMAIL').toLowerCase(),
      login: requireEnv('REVENDA_LOGIN'),
      password: requireEnv('REVENDA_PASSWORD'),
      nivel_acesso_id: REVENDA_ID,
      empresa_id: requireEnv('REVENDA_EMPRESA_ID'),
    }

    if (revendaData.password.length < 12) {
      throw new Error('REVENDA_PASSWORD deve ter pelo menos 12 caracteres')
    }

    console.log('Criando usuário revenda local')

    await client.query('BEGIN')

    const checkNivel = await client.query(
      `SELECT nivel_acesso_id
       FROM nivel_acesso
       WHERE nivel_acesso_id = $1
       LIMIT 1`,
      [REVENDA_ID]
    )

    if (checkNivel.rows.length === 0) {
      throw new Error('Nível de acesso Revenda não encontrado')
    }

    const empresaResult = await client.query(
      `SELECT empresa_id
       FROM empresa
       WHERE empresa_id = $1
       LIMIT 1`,
      [revendaData.empresa_id]
    )

    if (empresaResult.rows.length === 0) {
      throw new Error('Empresa informada em REVENDA_EMPRESA_ID não foi encontrada')
    }

    const checkUser = await client.query(
      `SELECT login_id
       FROM login
       WHERE email = $1 OR login_id = $2
       LIMIT 1`,
      [revendaData.email, revendaData.login_id]
    )

    const senhaHash = await bcrypt.hash(revendaData.password, 10)

    if (checkUser.rows.length > 0) {
      await client.query(`
        UPDATE login
        SET
          senha = $1,
          nivel_acesso_id = $2,
          nome = $3,
          login = $4,
          empresa_id = $5
        WHERE email = $6 OR login_id = $7
      `, [
        senhaHash,
        revendaData.nivel_acesso_id,
        revendaData.nome,
        revendaData.login,
        revendaData.empresa_id,
        revendaData.email,
        revendaData.login_id,
      ])

      console.log('Usuário revenda atualizado com sucesso.')
    } else {
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
        senhaHash,
        revendaData.nome,
      ])

      console.log('Usuário revenda criado com sucesso.')
    }

    await client.query('COMMIT')
    console.log('A senha não foi exibida. Guarde-a em cofre seguro.')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Erro ao criar usuário revenda:', error.message)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

createRevendaUser()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
