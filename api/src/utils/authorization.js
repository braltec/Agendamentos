import pool from '../config/database.js'
import { logger } from './logger.js'

export const SUPER_ADMIN_ID = '550e8400-e29b-41d4-a716-446655440012'
export const REVENDA_ID = '550e8400-e29b-41d4-a716-446655440020'

const RESERVED_ROLE_IDS = new Set([SUPER_ADMIN_ID, REVENDA_ID])
const EMPRESA_ADMIN_LEVEL_NAMES = new Set([
  'admin_empresa',
  'empresa_admin',
  'administrador_empresa',
  'empresa_administrador',
])

const SELF_PROFILE_ALLOWED_FIELDS = new Set(['nome', 'login', 'email'])
const ADMIN_USER_UPDATE_ALLOWED_FIELDS = new Set(['nome', 'login', 'email', 'nivel_acesso_id'])
const ADMINISTRATIVE_USER_FIELDS = new Set([
  'empresa_id',
  'organizacao_id',
  'org_revenda_id',
  'status',
  'ativo',
  'role',
  'roles',
  'permissao',
  'permissoes',
  'permissions',
  'is_gestor_revenda',
  'senha',
])

function hasOwn(object, field) {
  return Object.prototype.hasOwnProperty.call(object || {}, field)
}

export function isSuperAdmin(user) {
  return user?.nivel_acesso_id === SUPER_ADMIN_ID
}

export function isRevenda(user) {
  return user?.nivel_acesso_id === REVENDA_ID
}

export function isGestorRevenda(user) {
  return isRevenda(user) && Boolean(user?.is_gestor_revenda)
}

export async function isEmpresaAdmin(user) {
  if (!user?.nivel_acesso_id || RESERVED_ROLE_IDS.has(user.nivel_acesso_id)) {
    return false
  }

  const result = await pool.query(
    `SELECT LOWER(nivel_acesso_) AS nivel_acesso
     FROM nivel_acesso
     WHERE nivel_acesso_id = $1`,
    [user.nivel_acesso_id]
  )

  const nivelAcesso = result.rows[0]?.nivel_acesso
  if (!nivelAcesso) return false

  return EMPRESA_ADMIN_LEVEL_NAMES.has(nivelAcesso) || nivelAcesso.includes('admin')
}

function authError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

export function sendAuthorizationError(res, error, fallbackMessage = 'Acesso negado') {
  if (!error?.statusCode) return false

  res.status(error.statusCode).json({
    success: false,
    message: error.message || fallbackMessage,
  })

  return true
}

function logBlockedUserPrivilegeAttempt(user, targetLoginId, fields, operation) {
  logger.warn('Tentativa bloqueada de alteração administrativa em usuário', {
    actorLoginId: user?.login_id || user?.user_id || null,
    actorEmpresaId: user?.empresa_id || null,
    targetLoginId: targetLoginId || null,
    fields,
    operation,
  })
}

function pickAllowedFields(source, allowedFields) {
  const picked = {}

  for (const field of allowedFields) {
    if (hasOwn(source, field)) {
      picked[field] = source[field]
    }
  }

  return picked
}

function assertPayloadHasFields(payload) {
  if (Object.keys(payload).length === 0) {
    throw authError(400, 'Nenhum campo permitido foi informado para atualização')
  }
}

function getForbiddenAdministrativeFields(body, { allowNivelAcesso = false } = {}) {
  const forbiddenFields = []

  if (!allowNivelAcesso && hasOwn(body, 'nivel_acesso_id')) {
    forbiddenFields.push('nivel_acesso_id')
  }

  for (const field of ADMINISTRATIVE_USER_FIELDS) {
    if (hasOwn(body, field)) {
      forbiddenFields.push(field)
    }
  }

  return forbiddenFields
}

function assertNoForbiddenAdministrativeFields(user, targetLoginId, body, options = {}) {
  const forbiddenFields = getForbiddenAdministrativeFields(body, options)

  if (forbiddenFields.length > 0) {
    logBlockedUserPrivilegeAttempt(
      user,
      targetLoginId,
      forbiddenFields,
      options.operation || 'usuario_update'
    )
    throw authError(403, 'Campos administrativos não podem ser alterados nesta operação')
  }
}

export async function requireUserManagementAccess(user) {
  if (isSuperAdmin(user) || isRevenda(user) || await isEmpresaAdmin(user)) {
    return
  }

  throw authError(403, 'Acesso negado para gerenciar usuários')
}

export async function requireWizardAdminAccess(user) {
  if (isSuperAdmin(user) || isRevenda(user) || await isEmpresaAdmin(user)) {
    return
  }

  throw authError(403, 'Acesso negado para alterar configurações administrativas')
}

export async function requireUserManagementOrSelf(user, targetLoginId) {
  if (String(user?.login_id || user?.user_id || '') === String(targetLoginId)) {
    return
  }

  await requireUserManagementAccess(user)
}

export function buildSelfProfileUpdatePayload(user, targetLoginId, body) {
  if (String(user?.login_id || user?.user_id || '') !== String(targetLoginId)) {
    throw authError(403, 'Acesso negado para alterar este perfil')
  }

  assertNoForbiddenAdministrativeFields(user, targetLoginId, body, {
    operation: 'usuario_self_update',
  })

  const payload = pickAllowedFields(body, SELF_PROFILE_ALLOWED_FIELDS)
  assertPayloadHasFields(payload)
  return payload
}

export function buildAdminUserUpdatePayload(user, targetUser, body) {
  assertNoForbiddenAdministrativeFields(user, targetUser.login_id, body, {
    allowNivelAcesso: true,
    operation: 'usuario_admin_update',
  })

  const payload = pickAllowedFields(body, ADMIN_USER_UPDATE_ALLOWED_FIELDS)

  if (hasOwn(body, 'nivel_acesso_id')) {
    if (isSuperAdmin(user)) {
      validateNivelAcessoAssignment(user, body.nivel_acesso_id)
    } else if (String(body.nivel_acesso_id) !== String(targetUser.nivel_acesso_id)) {
      logBlockedUserPrivilegeAttempt(
        user,
        targetUser.login_id,
        ['nivel_acesso_id'],
        'usuario_admin_update'
      )
      throw authError(403, 'Acesso negado para alterar nível de acesso')
    } else {
      delete payload.nivel_acesso_id
    }
  }

  assertPayloadHasFields(payload)
  return payload
}

export async function canAccessEmpresa(user, empresaId) {
  if (!empresaId) return false
  if (isSuperAdmin(user)) return true

  if (isGestorRevenda(user) && user.org_revenda_id) {
    const result = await pool.query(
      `SELECT 1
       FROM empresa e
       JOIN login l ON l.login_id = e.criado_por
       WHERE e.empresa_id = $1
         AND l.org_revenda_id = $2
       LIMIT 1`,
      [empresaId, user.org_revenda_id]
    )

    return result.rows.length > 0
  }

  if (isRevenda(user)) {
    const result = await pool.query(
      `SELECT 1
       FROM empresa
       WHERE empresa_id = $1
         AND criado_por = $2
       LIMIT 1`,
      [empresaId, user.login_id]
    )

    return result.rows.length > 0
  }

  return String(user?.empresa_id || '') === String(empresaId)
}

export async function requireEmpresaAccess(user, empresaId) {
  if (!empresaId) {
    throw authError(400, 'Empresa não informada')
  }

  const allowed = await canAccessEmpresa(user, empresaId)
  if (!allowed) {
    throw authError(403, 'Acesso negado para esta empresa')
  }
}

export async function resolveWritableEmpresaId(user, requestedEmpresaId) {
  await requireWizardAdminAccess(user)
  return resolveTargetEmpresaId(user, requestedEmpresaId)
}

export async function resolveTargetEmpresaId(user, requestedEmpresaId) {
  const targetEmpresaId = requestedEmpresaId || user?.empresa_id
  await requireEmpresaAccess(user, targetEmpresaId)
  return targetEmpresaId
}

export function validateNivelAcessoAssignment(user, nivelAcessoId) {
  if (!nivelAcessoId) {
    throw authError(400, 'Nível de acesso é obrigatório')
  }

  if (!isSuperAdmin(user) && RESERVED_ROLE_IDS.has(nivelAcessoId)) {
    throw authError(403, 'Acesso negado para atribuir este nível de acesso')
  }
}

export async function getLoginWithAccess(user, loginId) {
  if (!loginId) {
    throw authError(400, 'Usuário não informado')
  }

  const result = await pool.query(
    `SELECT
       login_id,
       empresa_id,
       nivel_acesso_id,
       org_revenda_id,
       is_gestor_revenda
     FROM login
     WHERE login_id = $1`,
    [loginId]
  )

  if (result.rows.length === 0) {
    throw authError(404, 'Usuário não encontrado')
  }

  const targetUser = result.rows[0]

  if (isSuperAdmin(user)) {
    return targetUser
  }

  if (RESERVED_ROLE_IDS.has(targetUser.nivel_acesso_id)) {
    throw authError(403, 'Acesso negado para alterar este usuário')
  }

  await requireEmpresaAccess(user, targetUser.empresa_id)

  return targetUser
}

export async function requireProfissionalAccess(user, profissionalId) {
  if (!profissionalId) {
    throw authError(400, 'Profissional não informado')
  }

  const result = await pool.query(
    `SELECT profissional_id, empresa_id
     FROM profissional
     WHERE profissional_id = $1`,
    [profissionalId]
  )

  if (result.rows.length === 0) {
    throw authError(404, 'Profissional não encontrado')
  }

  const profissional = result.rows[0]
  await requireEmpresaAccess(user, profissional.empresa_id)
  return profissional
}

export async function requireProfissionaisFromEmpresa(user, profissionalIds, empresaId) {
  if (!Array.isArray(profissionalIds) || profissionalIds.length === 0) {
    return
  }

  const uniqueIds = [...new Set(profissionalIds.filter(Boolean))]
  if (uniqueIds.length === 0) return

  const result = await pool.query(
    `SELECT profissional_id, empresa_id
     FROM profissional
     WHERE profissional_id = ANY($1::uuid[])`,
    [uniqueIds]
  )

  if (result.rows.length !== uniqueIds.length) {
    throw authError(404, 'Um ou mais profissionais não foram encontrados')
  }

  for (const profissional of result.rows) {
    await requireEmpresaAccess(user, profissional.empresa_id)

    if (empresaId && String(profissional.empresa_id) !== String(empresaId)) {
      throw authError(403, 'Profissional não pertence à empresa informada')
    }
  }
}

export async function getServicoEmpresaIds(servicoId) {
  const result = await pool.query(
    `SELECT
       s.servicos_id,
       ARRAY_REMOVE(ARRAY_AGG(DISTINCT p.empresa_id), NULL) AS empresa_ids
     FROM servicos s
     LEFT JOIN profissional_servico ps ON ps.servicos_id = s.servicos_id
     LEFT JOIN profissional p ON p.profissional_id = ps.profissional_id
     WHERE s.servicos_id = $1
     GROUP BY s.servicos_id`,
    [servicoId]
  )

  if (result.rows.length === 0) {
    throw authError(404, 'Serviço não encontrado')
  }

  return result.rows[0].empresa_ids || []
}

export async function requireServicoAccess(user, servicoId, options = {}) {
  if (!servicoId) {
    throw authError(400, 'Serviço não informado')
  }

  const empresaIds = await getServicoEmpresaIds(servicoId)

  if (empresaIds.length === 0) {
    if (options.allowUnlinked) {
      return { servicos_id: servicoId, empresaIds }
    }

    if (isSuperAdmin(user)) {
      return { servicos_id: servicoId, empresaIds }
    }

    throw authError(403, 'Não foi possível validar a empresa deste serviço')
  }

  for (const empresaId of empresaIds) {
    await requireEmpresaAccess(user, empresaId)
  }

  if (options.requiredEmpresaId && !empresaIds.some(id => String(id) === String(options.requiredEmpresaId))) {
    throw authError(403, 'Serviço não pertence à empresa informada')
  }

  return { servicos_id: servicoId, empresaIds }
}

export async function requireHorarioFAccess(user, horarioFId, options = {}) {
  if (!horarioFId) {
    throw authError(400, 'Horário não informado')
  }

  const result = await pool.query(
    `SELECT
       hf.horario_f_id,
       ARRAY_REMOVE(ARRAY_AGG(DISTINCT p.empresa_id), NULL) AS empresa_ids
     FROM horario_f hf
     LEFT JOIN profissional_horario ph ON ph.horario_f_id = hf.horario_f_id
     LEFT JOIN profissional p ON p.profissional_id = ph.profissional_id
     WHERE hf.horario_f_id = $1
     GROUP BY hf.horario_f_id`,
    [horarioFId]
  )

  if (result.rows.length === 0) {
    throw authError(404, 'Horário não encontrado')
  }

  const empresaIds = result.rows[0].empresa_ids || []

  if (empresaIds.length === 0) {
    if (isSuperAdmin(user)) {
      return { horario_f_id: horarioFId, empresaIds }
    }

    throw authError(403, 'Não foi possível validar a empresa deste horário')
  }

  for (const empresaId of empresaIds) {
    await requireEmpresaAccess(user, empresaId)
  }

  if (options.requiredEmpresaId && !empresaIds.some(id => String(id) === String(options.requiredEmpresaId))) {
    throw authError(403, 'Horário não pertence à empresa informada')
  }

  return { horario_f_id: horarioFId, empresaIds }
}

export async function ensureHorarioFExclusiveToEmpresa(horarioFId, empresaId) {
  if (!horarioFId || !empresaId) return

  const result = await pool.query(
    `SELECT DISTINCT p.empresa_id
     FROM profissional_horario ph
     JOIN profissional p ON p.profissional_id = ph.profissional_id
     WHERE ph.horario_f_id = $1`,
    [horarioFId]
  )

  const otherEmpresa = result.rows.find(row => String(row.empresa_id) !== String(empresaId))
  if (otherEmpresa) {
    throw authError(403, 'Horário compartilhado com outra empresa não pode ser alterado')
  }
}

export async function requireGCalendarCanBeAssigned(user, profissionalId, gcalendarId) {
  if (!gcalendarId) return

  const result = await pool.query(
    `SELECT gc.profissional_id, p.empresa_id
     FROM gcalendar gc
     JOIN profissional p ON p.profissional_id = gc.profissional_id
     WHERE gc.gcalendar_id = $1`,
    [gcalendarId]
  )

  if (result.rows.length === 0) return

  const calendar = result.rows[0]
  await requireEmpresaAccess(user, calendar.empresa_id)

  if (String(calendar.profissional_id) !== String(profissionalId)) {
    logger.warn('Tentativa bloqueada de reatribuição de Google Calendar', {
      actorLoginId: user?.login_id || user?.user_id || null,
      actorEmpresaId: user?.empresa_id || null,
      profissionalId,
      calendarProfissionalId: calendar.profissional_id,
    })
    throw authError(403, 'Calendário já está vinculado a outro profissional')
  }
}
