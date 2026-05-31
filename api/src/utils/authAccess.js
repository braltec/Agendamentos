import pool from '../config/database.js'
import { REVENDA_ID, SUPER_ADMIN_ID } from './authorization.js'

const ACTIVE_EMPRESA_STATUSES = new Set(['ativa', 'ativo', 'active'])
const GLOBAL_ACCESS_LEVELS = new Set([SUPER_ADMIN_ID, REVENDA_ID])

function normalizeStatus(status) {
  return String(status || 'ativa').trim().toLowerCase()
}

function accessError(statusCode, code, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  error.code = code
  return error
}

export function isGlobalAccessUser(user) {
  return GLOBAL_ACCESS_LEVELS.has(user?.nivel_acesso_id)
}

export function isEmpresaStatusActive(status) {
  return ACTIVE_EMPRESA_STATUSES.has(normalizeStatus(status))
}

export async function getAuthenticatedUserAccessState(user) {
  if (isGlobalAccessUser(user)) {
    return {
      allowed: true,
      state: 'acesso_global',
      empresaStatus: null,
    }
  }

  if (!user?.empresa_id) {
    return {
      allowed: false,
      state: 'usuario_sem_empresa',
      code: 'USUARIO_SEM_EMPRESA',
      message: 'Seu usuário não possui empresa vinculada. Entre em contato com o administrador.',
    }
  }

  const result = await pool.query(
    `SELECT empresa_id, status
     FROM empresa
     WHERE empresa_id = $1
     LIMIT 1`,
    [user.empresa_id]
  )

  if (result.rows.length === 0) {
    return {
      allowed: false,
      state: 'empresa_inexistente',
      code: 'EMPRESA_INEXISTENTE',
      message: 'A empresa vinculada ao seu usuário não foi encontrada. Entre em contato com o administrador.',
    }
  }

  const empresaStatus = result.rows[0].status

  if (!isEmpresaStatusActive(empresaStatus)) {
    return {
      allowed: false,
      state: 'empresa_inativa',
      code: 'EMPRESA_INATIVA',
      empresaStatus,
      message: 'A empresa vinculada ao seu usuário está inativa. Entre em contato com o administrador.',
    }
  }

  return {
    allowed: true,
    state: 'empresa_ativa',
    empresaStatus,
  }
}

export async function assertAuthenticatedUserAccess(user) {
  const accessState = await getAuthenticatedUserAccessState(user)

  if (!accessState.allowed) {
    throw accessError(403, accessState.code, accessState.message)
  }

  return accessState
}

export function sendAuthAccessError(res, error) {
  if (!error?.statusCode) return false

  res.status(error.statusCode).json({
    success: false,
    code: error.code,
    message: error.message,
  })

  return true
}
