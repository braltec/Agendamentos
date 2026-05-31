import { wizardModel } from '../models/wizard.model.js'
import {
  buildAdminUserUpdatePayload,
  buildSelfProfileUpdatePayload,
  getLoginWithAccess,
  requireGCalendarCanBeAssigned,
  requireHorarioFAccess,
  requireProfissionalAccess,
  requireProfissionaisFromEmpresa,
  requireServicoAccess,
  isEmpresaAdmin,
  isRevenda,
  isSuperAdmin,
  requireWizardAdminAccess,
  requireUserManagementAccess,
  requireUserManagementOrSelf,
  resolveWritableEmpresaId,
  resolveTargetEmpresaId,
  sendAuthorizationError,
  validateNivelAcessoAssignment,
} from '../utils/authorization.js'
import { logger } from '../utils/logger.js'

function isValidGCalendarId(gcalendarId) {
  if (!gcalendarId) return true
  return String(gcalendarId).length <= 255 && /^[A-Za-z0-9._@%+\-#]+$/.test(String(gcalendarId))
}

async function resolveServicoTargetEmpresaId(user, servicoData = {}) {
  if (servicoData.empresa_id) {
    return resolveWritableEmpresaId(user, servicoData.empresa_id)
  }

  if (Array.isArray(servicoData.profissionais_ids) && servicoData.profissionais_ids.length > 0) {
    const profissional = await requireProfissionalAccess(user, servicoData.profissionais_ids[0])
    return profissional.empresa_id
  }

  return isSuperAdmin(user) ? null : user.empresa_id
}

async function canManageWizard(user) {
  return isSuperAdmin(user) || isRevenda(user) || await isEmpresaAdmin(user)
}

// Verificar status do wizard
export async function checkWizardStatus(req, res) {
  try {
    const empresaId = req.user.empresa_id
    const status = await wizardModel.getWizardStatus(empresaId)
    const canManage = await canManageWizard(req.user)
    
    res.json({
      success: true,
      data: {
        ...status,
        canManageWizard: canManage,
        shouldRedirectToWizard: canManage && status.accessState === 'setup_inicial',
      }
    })
  } catch (error) {
    logger.error('Erro ao verificar wizard', { error, empresaId: req.user?.empresa_id })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao verificar status do wizard' 
    })
  }
}

// Buscar todos os dados da empresa
export async function getEmpresaCompleta(req, res) {
  try {
    const SUPER_ADMIN_ID = '550e8400-e29b-41d4-a716-446655440012'
    const REVENDA_ID = '550e8400-e29b-41d4-a716-446655440020'
    
    const isSuperAdmin = req.user.nivel_acesso_id === SUPER_ADMIN_ID
    const isRevenda = req.user.nivel_acesso_id === REVENDA_ID
    
    // Se for Super Admin ou Revenda, eles NÃO têm uma empresa específica
    // Devem acessar configurações através da rota com ID
    if (isSuperAdmin || isRevenda) {
      return res.status(400).json({
        success: false,
        message: 'Super Admin e Revenda devem acessar configurações de empresas específicas através de /api/wizard/empresa/:empresaId'
      })
    }
    
    const empresaId = req.user.empresa_id
    const data = await wizardModel.getEmpresaCompleta(empresaId)
    
    res.json({
      success: true,
      data
    })
  } catch (error) {
    logger.error('Erro ao buscar dados da empresa', { error, empresaId: req.user?.empresa_id })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar dados da empresa' 
    })
  }
}

// Buscar dados completos de uma empresa específica (Super Admin e Revenda)
export async function getEmpresaCompletaPorId(req, res) {
  try {
    const { empresaId } = req.params
    const SUPER_ADMIN_ID = '550e8400-e29b-41d4-a716-446655440012'
    const REVENDA_ID = '550e8400-e29b-41d4-a716-446655440020'
    
    const isSuperAdmin = req.user.nivel_acesso_id === SUPER_ADMIN_ID
    const isRevenda = req.user.nivel_acesso_id === REVENDA_ID
    
    // Super Admin pode acessar qualquer empresa
    if (isSuperAdmin) {
      const data = await wizardModel.getEmpresaCompleta(empresaId)
      return res.json({
        success: true,
        data
      })
    }
    
    // Revenda pode acessar apenas empresas que cadastrou
    if (isRevenda) {
      // Verificar se esta empresa foi cadastrada por este revenda
      const pool = await import('../config/database.js').then(m => m.default)
      const checkResult = await pool.query(`
        SELECT empresa_id FROM empresa WHERE empresa_id = $1 AND criado_por = $2
      `, [empresaId, req.user.login_id])
      
      if (checkResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado. Você só pode acessar empresas que você cadastrou.'
        })
      }
      
      const data = await wizardModel.getEmpresaCompleta(empresaId)
      return res.json({
        success: true,
        data
      })
    }
    
    // Usuários comuns não podem acessar outras empresas
    return res.status(403).json({
      success: false,
      message: 'Acesso negado.'
    })
    
  } catch (error) {
    logger.error('Erro ao buscar dados da empresa por ID', { error, empresaId: req.params?.empresaId })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar dados da empresa' 
    })
  }
}

// Salvar configurações de agendamento
export async function saveConfiguracoes(req, res) {
  try {
    const config = req.body
    const empresaId = await resolveWritableEmpresaId(req.user, config.empresa_id)
    
    const result = await wizardModel.saveConfiguracoes(empresaId, config)
    
    res.json({
      success: true,
      message: 'Configurações salvas com sucesso',
      data: result
    })
  } catch (error) {
    if (sendAuthorizationError(res, error)) return

    logger.error('Erro ao salvar configurações', { error, empresaId: req.user?.empresa_id })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao salvar configurações' 
    })
  }
}

// Salvar horários de funcionamento
export async function saveHorarios(req, res) {
  try {
    const { horarios, empresa_id } = req.body
    const empresaId = await resolveWritableEmpresaId(req.user, empresa_id)
    
    const result = await wizardModel.saveHorarios(empresaId, horarios)
    
    res.json({
      success: true,
      message: 'Horários salvos com sucesso',
      data: result
    })
  } catch (error) {
    if (sendAuthorizationError(res, error)) return

    logger.error('Erro ao salvar horários', { error, empresaId: req.user?.empresa_id })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao salvar horários' 
    })
  }
}

// Criar profissional
export async function createProfissional(req, res) {
  try {
    const profissional = req.body
    const empresaId = await resolveWritableEmpresaId(req.user, profissional.empresa_id)
    
    const result = await wizardModel.createProfissional(empresaId, profissional)
    
    res.json({
      success: true,
      message: 'Profissional criado com sucesso',
      data: result
    })
  } catch (error) {
    if (sendAuthorizationError(res, error)) return

    logger.error('Erro ao criar profissional', { error, empresaId: req.user?.empresa_id })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao criar profissional'
    })
  }
}

// Criar serviço
export async function createServico(req, res) {
  try {
    const servico = req.body
    await requireWizardAdminAccess(req.user)
    
    const result = await wizardModel.createServico(servico)
    
    res.json({
      success: true,
      message: 'Serviço criado com sucesso',
      data: result
    })
  } catch (error) {
    if (sendAuthorizationError(res, error)) return

    logger.error('Erro ao criar serviço', { error, empresaId: req.user?.empresa_id })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao criar serviço' 
    })
  }
}

// Vincular serviço ao profissional
export async function vincularServico(req, res) {
  try {
    const { profissional_id, servico_id, personalizacao } = req.body
    await requireWizardAdminAccess(req.user)

    const profissional = await requireProfissionalAccess(req.user, profissional_id)
    const servico = await requireServicoAccess(req.user, servico_id, {
      allowUnlinked: true,
      requiredEmpresaId: profissional.empresa_id,
    })

    const crossTenantService = servico.empresaIds.some(
      empresaId => String(empresaId) !== String(profissional.empresa_id)
    )

    if (crossTenantService) {
      return res.status(403).json({
        success: false,
        message: 'Serviço não pertence à mesma empresa do profissional',
      })
    }
    
    const result = await wizardModel.vincularServicoProfissional(
      profissional_id,
      servico_id,
      personalizacao || {}
    )
    
    res.json({
      success: true,
      message: 'Serviço vinculado com sucesso',
      data: result
    })
  } catch (error) {
    if (sendAuthorizationError(res, error)) return

    logger.error('Erro ao vincular serviço', { error, profissional_id, servico_id })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao vincular serviço' 
    })
  }
}

// Vincular horário ao profissional
export async function vincularHorario(req, res) {
  try {
    const { profissional_id, horario_f_id } = req.body
    await requireWizardAdminAccess(req.user)

    const profissional = await requireProfissionalAccess(req.user, profissional_id)
    const horario = await requireHorarioFAccess(req.user, horario_f_id, {
      requiredEmpresaId: profissional.empresa_id,
    })

    const crossTenantHorario = horario.empresaIds.some(
      empresaId => String(empresaId) !== String(profissional.empresa_id)
    )

    if (crossTenantHorario) {
      return res.status(403).json({
        success: false,
        message: 'Horário não pertence à mesma empresa do profissional',
      })
    }
    
    await wizardModel.vincularHorarioProfissional(profissional_id, horario_f_id)
    
    res.json({
      success: true,
      message: 'Horário vinculado ao profissional com sucesso'
    })
  } catch (error) {
    if (sendAuthorizationError(res, error)) return

    logger.error('Erro ao vincular horário', { error, profissional_id, horario_f_id })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao vincular horário' 
    })
  }
}

// Atualizar instância WhatsApp
export async function updateInstancia(req, res) {
  try {
    const instanciaData = req.body
    const empresaId = await resolveWritableEmpresaId(req.user, instanciaData.empresa_id)
    
    const result = await wizardModel.updateInstancia(empresaId, instanciaData)
    
    res.json({
      success: true,
      message: 'Instância atualizada com sucesso',
      data: result
    })
  } catch (error) {
    if (sendAuthorizationError(res, error)) return

    logger.error('Erro ao atualizar instância', { error, empresaId: req.user?.empresa_id })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao atualizar instância' 
    })
  }
}

// Concluir wizard
export async function completeWizard(req, res) {
  try {
    await requireWizardAdminAccess(req.user)
    const empresaId = req.user.empresa_id
    
    await wizardModel.markWizardCompleted(empresaId)
    
    res.json({
      success: true,
      message: 'Wizard concluído com sucesso!'
    })
  } catch (error) {
    if (sendAuthorizationError(res, error)) return

    logger.error('Erro ao concluir wizard', { error, empresaId: req.user?.empresa_id })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao concluir wizard' 
    })
  }
}

// Atualizar dados da empresa
export async function updateEmpresa(req, res) {
  try {
    const empresaData = req.body
    const empresaId = await resolveWritableEmpresaId(req.user, empresaData.empresa_id)
    
    await wizardModel.updateEmpresaData(empresaId, empresaData)
    
    res.json({
      success: true,
      message: 'Dados da empresa atualizados com sucesso!'
    })
  } catch (error) {
    if (sendAuthorizationError(res, error)) return

    logger.error('Erro ao atualizar empresa', { error, empresaId: req.user?.empresa_id })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao atualizar dados da empresa' 
    })
  }
}

// Atualizar serviço
export async function updateServico(req, res) {
  try {
    const { servicoId } = req.params
    const servicoData = req.body
    await requireWizardAdminAccess(req.user)

    const targetEmpresaId = await resolveServicoTargetEmpresaId(req.user, servicoData)
    await requireServicoAccess(req.user, servicoId, {
      allowUnlinked: isSuperAdmin(req.user),
      requiredEmpresaId: targetEmpresaId,
    })
    await requireProfissionaisFromEmpresa(req.user, servicoData.profissionais_ids, targetEmpresaId)
    
    await wizardModel.updateServicoData(servicoId, servicoData, targetEmpresaId)
    
    res.json({
      success: true,
      message: 'Serviço atualizado com sucesso!'
    })
  } catch (error) {
    if (sendAuthorizationError(res, error)) return

    logger.error('Erro ao atualizar serviço', { error, servicoId })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao atualizar serviço' 
    })
  }
}

// Atualizar profissional
export async function updateProfissional(req, res) {
  try {
    const { profissionalId } = req.params
    const profissionalData = req.body
    await requireWizardAdminAccess(req.user)
    await requireProfissionalAccess(req.user, profissionalId)

    if (profissionalData.gcalendar_id && !isValidGCalendarId(profissionalData.gcalendar_id)) {
      return res.status(400).json({
        success: false,
        message: 'Calendário do Google inválido',
      })
    }

    await requireGCalendarCanBeAssigned(req.user, profissionalId, profissionalData.gcalendar_id)
    
    await wizardModel.updateProfissionalData(profissionalId, profissionalData)
    
    res.json({
      success: true,
      message: 'Profissional atualizado com sucesso!'
    })
  } catch (error) {
    if (sendAuthorizationError(res, error)) return

    logger.error('Erro ao atualizar profissional', { error, profissionalId })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao atualizar profissional' 
    })
  }
}

// Atualizar horários
export async function updateHorarios(req, res) {
  try {
    const { horarios, empresa_id } = req.body
    const empresaId = await resolveWritableEmpresaId(req.user, empresa_id)
    
    await wizardModel.updateHorariosData(empresaId, horarios)
    
    res.json({
      success: true,
      message: 'Horários atualizados com sucesso!'
    })
  } catch (error) {
    if (sendAuthorizationError(res, error)) return

    logger.error('Erro ao atualizar horários', { error, empresaId: req.user?.empresa_id })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao atualizar horários' 
    })
  }
}

// Excluir serviço (soft delete)
export async function deleteServico(req, res) {
  try {
    const { servicoId } = req.params
    await requireWizardAdminAccess(req.user)
    await requireServicoAccess(req.user, servicoId)
    
    await wizardModel.deleteServicoData(servicoId)
    
    res.json({
      success: true,
      message: 'Serviço excluído com sucesso!'
    })
  } catch (error) {
    if (sendAuthorizationError(res, error)) return

    logger.error('Erro ao excluir serviço', { error, servicoId })
    res.status(500).json({ 
      success: false,
      message: error.message || 'Erro ao excluir serviço' 
    })
  }
}

// Excluir profissional (soft delete)
export async function deleteProfissional(req, res) {
  try {
    const { profissionalId } = req.params
    await requireWizardAdminAccess(req.user)
    await requireProfissionalAccess(req.user, profissionalId)
    
    await wizardModel.deleteProfissionalData(profissionalId)
    
    res.json({
      success: true,
      message: 'Profissional excluído com sucesso!'
    })
  } catch (error) {
    if (sendAuthorizationError(res, error)) return

    logger.error('Erro ao excluir profissional', { error, profissionalId })
    res.status(500).json({ 
      success: false,
      message: error.message || 'Erro ao excluir profissional' 
    })
  }
}

// Buscar todos os prompts disponíveis
export async function getAllPrompts(req, res) {
  try {
    const prompts = await wizardModel.getAllPrompts()
    
    res.json({
      success: true,
      data: prompts
    })
  } catch (error) {
    logger.error('Erro ao buscar prompts', { error, empresaId: req.user?.empresa_id })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar prompts' 
    })
  }
}

// Buscar versões de um prompt específico
export async function getPromptVersions(req, res) {
  try {
    const { promptKey } = req.params
    const versions = await wizardModel.getPromptVersions(promptKey)
    
    res.json({
      success: true,
      data: versions
    })
  } catch (error) {
    logger.error('Erro ao buscar versões do prompt', { error, empresaId: req.user?.empresa_id })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar versões do prompt' 
    })
  }
}

// Atualizar prompt e versão da empresa
export async function updateEmpresaPrompt(req, res) {
  try {
    const { promptKey, promptVersion } = req.body
    const empresaId = await resolveWritableEmpresaId(req.user, req.body.empresa_id)
    
    await wizardModel.updateEmpresaPrompt(empresaId, promptKey, promptVersion)
    
    res.json({
      success: true,
      message: 'Prompt atualizado com sucesso!'
    })
  } catch (error) {
    if (sendAuthorizationError(res, error)) return

    logger.error('Erro ao atualizar prompt', { error, empresaId: req.user?.empresa_id })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao atualizar prompt' 
    })
  }
}

// Buscar usuários de uma empresa
export async function getUsuarios(req, res) {
  try {
    const { empresaId } = req.params
    await requireUserManagementAccess(req.user)
    const targetEmpresaId = await resolveTargetEmpresaId(req.user, empresaId)

    const usuarios = await wizardModel.getUsuariosByEmpresa(targetEmpresaId)
    
    res.json({
      success: true,
      data: usuarios
    })
  } catch (error) {
    if (sendAuthorizationError(res, error)) return

    logger.error('Erro ao buscar usuários', { error, empresaId: req.user?.empresa_id })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar usuários' 
    })
  }
}

// Buscar níveis de acesso
export async function getNiveisAcesso(req, res) {
  try {
    const niveis = await wizardModel.getNiveisAcesso()
    
    res.json({
      success: true,
      data: niveis
    })
  } catch (error) {
    logger.error('Erro ao buscar níveis de acesso', { error, empresaId: req.user?.empresa_id })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar níveis de acesso' 
    })
  }
}

// Criar novo usuário
export async function createUsuario(req, res) {
  try {
    const userData = req.body

    await requireUserManagementAccess(req.user)
    validateNivelAcessoAssignment(req.user, userData.nivel_acesso_id)
    const empresaId = await resolveTargetEmpresaId(req.user, userData.empresa_id)

    if (!userData.senha) {
      return res.status(400).json({
        success: false,
        message: 'Senha é obrigatória',
      })
    }

    // Hash da senha usando bcrypt
    const bcrypt = await import('bcrypt')
    const senhaHash = await bcrypt.hash(userData.senha, 10)
    
    const novoUsuario = await wizardModel.createUsuario(empresaId, {
      ...userData,
      senha: senhaHash
    })
    
    res.json({
      success: true,
      message: 'Usuário criado com sucesso!',
      data: novoUsuario
    })
  } catch (error) {
    if (sendAuthorizationError(res, error)) return

    logger.error('Erro ao criar usuário', { error, empresaId: req.user?.empresa_id })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao criar usuário'
    })
  }
}

// Atualizar usuário
export async function updateUsuario(req, res) {
  try {
    const { loginId } = req.params
    const userData = req.body

    const usuarioAlvo = await getLoginWithAccess(req.user, loginId)
    await requireUserManagementOrSelf(req.user, loginId)

    const isSelfUpdate = String(req.user.login_id || req.user.user_id || '') === String(loginId)
    const updatePayload = isSelfUpdate && !isSuperAdmin(req.user)
      ? buildSelfProfileUpdatePayload(req.user, loginId, userData)
      : buildAdminUserUpdatePayload(req.user, usuarioAlvo, userData)
    
    const usuarioAtualizado = await wizardModel.updateUsuario(loginId, updatePayload)

    if (!usuarioAtualizado) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      })
    }
    
    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso!',
      data: usuarioAtualizado
    })
  } catch (error) {
    if (sendAuthorizationError(res, error)) return

    logger.error('Erro ao atualizar usuário', { error, loginId })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao atualizar usuário' 
    })
  }
}

// Atualizar senha do usuário
export async function updateSenhaUsuario(req, res) {
  try {
    const { loginId } = req.params
    const { novaSenha } = req.body

    await getLoginWithAccess(req.user, loginId)
    await requireUserManagementOrSelf(req.user, loginId)

    if (!novaSenha) {
      return res.status(400).json({
        success: false,
        message: 'Nova senha é obrigatória',
      })
    }
    
    // Hash da nova senha
    const bcrypt = await import('bcrypt')
    const senhaHash = await bcrypt.hash(novaSenha, 10)
    
    await wizardModel.updateSenhaUsuario(loginId, senhaHash)
    
    res.json({
      success: true,
      message: 'Senha atualizada com sucesso!'
    })
  } catch (error) {
    if (sendAuthorizationError(res, error)) return

    logger.error('Erro ao atualizar senha', { error, loginId })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao atualizar senha' 
    })
  }
}

// Excluir usuário
export async function deleteUsuario(req, res) {
  try {
    const { loginId } = req.params
    
    // Verificar se não é o próprio usuário logado
    if (loginId === req.user.login_id) {
      return res.status(400).json({
        success: false,
        message: 'Você não pode excluir seu próprio usuário'
      })
    }

    await getLoginWithAccess(req.user, loginId)
    await requireUserManagementAccess(req.user)
    
    await wizardModel.deleteUsuario(loginId)
    
    res.json({
      success: true,
      message: 'Usuário excluído com sucesso!'
    })
  } catch (error) {
    if (sendAuthorizationError(res, error)) return

    logger.error('Erro ao excluir usuário', { error, loginId })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao excluir usuário' 
    })
  }
}
