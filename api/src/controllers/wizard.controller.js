import { wizardModel } from '../models/wizard.model.js'

// Verificar status do wizard
export async function checkWizardStatus(req, res) {
  try {
    const empresaId = req.user.empresa_id
    const completed = await wizardModel.checkWizardCompleted(empresaId)
    
    res.json({
      success: true,
      data: { completed }
    })
  } catch (error) {
    console.error('Erro ao verificar wizard:', error)
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
    console.error('Erro ao buscar dados da empresa:', error)
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
    console.error('Erro ao buscar dados da empresa:', error)
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
    
    // Se Super Admin ou Revenda, usar empresa_id do contexto da empresa sendo editada
    const SUPER_ADMIN_ID = '550e8400-e29b-41d4-a716-446655440012'
    const REVENDA_ID = '550e8400-e29b-41d4-a716-446655440020'
    
    const isSuperAdmin = req.user.nivel_acesso_id === SUPER_ADMIN_ID
    const isRevenda = req.user.nivel_acesso_id === REVENDA_ID
    
    const empresaId = (isSuperAdmin || isRevenda) && config.empresa_id 
      ? config.empresa_id 
      : req.user.empresa_id
    
    console.log('⚙️ saveConfiguracoes:', {
      isSuperAdmin,
      isRevenda,
      empresaIdFromBody: config.empresa_id,
      empresaIdFromUser: req.user.empresa_id,
      empresaIdFinal: empresaId,
      config
    })
    
    // Se for Revenda, verificar se pode editar esta empresa
    if (isRevenda) {
      const pool = await import('../config/database.js').then(m => m.default)
      const checkResult = await pool.query(`
        SELECT empresa_id FROM empresa WHERE empresa_id = $1 AND criado_por = $2
      `, [empresaId, req.user.login_id])
      
      if (checkResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado. Você só pode editar empresas que você cadastrou.'
        })
      }
    }
    
    const result = await wizardModel.saveConfiguracoes(empresaId, config)
    
    res.json({
      success: true,
      message: 'Configurações salvas com sucesso',
      data: result
    })
  } catch (error) {
    console.error('Erro ao salvar configurações:', error)
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
    
    // Se Super Admin, usar empresa_id do contexto
    const SUPER_ADMIN_ID = '550e8400-e29b-41d4-a716-446655440012'
    const isSuperAdmin = req.user.nivel_acesso_id === SUPER_ADMIN_ID
    const empresaId = (isSuperAdmin && empresa_id) ? empresa_id : req.user.empresa_id
    
    const result = await wizardModel.saveHorarios(empresaId, horarios)
    
    res.json({
      success: true,
      message: 'Horários salvos com sucesso',
      data: result
    })
  } catch (error) {
    console.error('Erro ao salvar horários:', error)
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
    
    // Se Super Admin, usar empresa_id do contexto
    const SUPER_ADMIN_ID = '550e8400-e29b-41d4-a716-446655440012'
    const isSuperAdmin = req.user.nivel_acesso_id === SUPER_ADMIN_ID
    const empresaId = (isSuperAdmin && profissional.empresa_id) ? profissional.empresa_id : req.user.empresa_id
    
    const result = await wizardModel.createProfissional(empresaId, profissional)
    
    res.json({
      success: true,
      message: 'Profissional criado com sucesso',
      data: result
    })
  } catch (error) {
    console.error('Erro ao criar profissional:', error)
    res.status(500).json({ 
      success: false,
      message: 'Erro ao criar profissional',
      error: error.message
    })
  }
}

// Criar serviço
export async function createServico(req, res) {
  try {
    const servico = req.body
    
    const result = await wizardModel.createServico(servico)
    
    res.json({
      success: true,
      message: 'Serviço criado com sucesso',
      data: result
    })
  } catch (error) {
    console.error('Erro ao criar serviço:', error)
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
    console.error('Erro ao vincular serviço:', error)
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
    
    await wizardModel.vincularHorarioProfissional(profissional_id, horario_f_id)
    
    res.json({
      success: true,
      message: 'Horário vinculado ao profissional com sucesso'
    })
  } catch (error) {
    console.error('Erro ao vincular horário:', error)
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
    
    // Se Super Admin, usar empresa_id do contexto
    const SUPER_ADMIN_ID = '550e8400-e29b-41d4-a716-446655440012'
    const isSuperAdmin = req.user.nivel_acesso_id === SUPER_ADMIN_ID
    const empresaId = (isSuperAdmin && instanciaData.empresa_id) ? instanciaData.empresa_id : req.user.empresa_id
    
    console.log('📱 updateInstancia:', {
      isSuperAdmin,
      empresaIdFromBody: instanciaData.empresa_id,
      empresaIdFromUser: req.user.empresa_id,
      empresaIdFinal: empresaId,
      instanciaId: instanciaData.instancia_id
    })
    
    const result = await wizardModel.updateInstancia(empresaId, instanciaData)
    
    res.json({
      success: true,
      message: 'Instância atualizada com sucesso',
      data: result
    })
  } catch (error) {
    console.error('❌ Erro ao atualizar instância:', error)
    res.status(500).json({ 
      success: false,
      message: 'Erro ao atualizar instância' 
    })
  }
}

// Concluir wizard
export async function completeWizard(req, res) {
  try {
    const empresaId = req.user.empresa_id
    
    await wizardModel.markWizardCompleted(empresaId)
    
    res.json({
      success: true,
      message: 'Wizard concluído com sucesso!'
    })
  } catch (error) {
    console.error('Erro ao concluir wizard:', error)
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
    
    // Se Super Admin ou Revenda e empresa_id vem no body, usar esse ID
    // Caso contrário, usar o ID do usuário logado
    const SUPER_ADMIN_ID = '550e8400-e29b-41d4-a716-446655440012'
    const REVENDA_ID = '550e8400-e29b-41d4-a716-446655440020'
    
    const isSuperAdmin = req.user.nivel_acesso_id === SUPER_ADMIN_ID
    const isRevenda = req.user.nivel_acesso_id === REVENDA_ID
    
    const empresaId = ((isSuperAdmin || isRevenda) && empresaData.empresa_id) 
      ? empresaData.empresa_id 
      : req.user.empresa_id
    
    console.log('🔧 updateEmpresa:', {
      isSuperAdmin,
      isRevenda,
      empresaIdFromBody: empresaData.empresa_id,
      empresaIdFromUser: req.user.empresa_id,
      empresaIdFinal: empresaId
    })
    
    // Se for Revenda, verificar se pode editar esta empresa
    if (isRevenda) {
      const pool = await import('../config/database.js').then(m => m.default)
      const checkResult = await pool.query(`
        SELECT empresa_id FROM empresa WHERE empresa_id = $1 AND criado_por = $2
      `, [empresaId, req.user.login_id])
      
      if (checkResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado. Você só pode editar empresas que você cadastrou.'
        })
      }
    }
    
    await wizardModel.updateEmpresaData(empresaId, empresaData)
    
    res.json({
      success: true,
      message: 'Dados da empresa atualizados com sucesso!'
    })
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error)
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
    
    console.log('🛠️ updateServico:', {
      servicoId,
      servicoData
    })
    
    await wizardModel.updateServicoData(servicoId, servicoData)
    
    res.json({
      success: true,
      message: 'Serviço atualizado com sucesso!'
    })
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error)
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
    
    await wizardModel.updateProfissionalData(profissionalId, profissionalData)
    
    res.json({
      success: true,
      message: 'Profissional atualizado com sucesso!'
    })
  } catch (error) {
    console.error('Erro ao atualizar profissional:', error)
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
    
    // Se Super Admin, usar empresa_id do contexto
    const SUPER_ADMIN_ID = '550e8400-e29b-41d4-a716-446655440012'
    const isSuperAdmin = req.user.nivel_acesso_id === SUPER_ADMIN_ID
    const empresaId = (isSuperAdmin && empresa_id) ? empresa_id : req.user.empresa_id
    
    console.log('🕐 updateHorarios:', {
      isSuperAdmin,
      empresaIdFromBody: empresa_id,
      empresaIdFromUser: req.user.empresa_id,
      empresaIdFinal: empresaId,
      totalHorarios: horarios?.length
    })
    
    await wizardModel.updateHorariosData(empresaId, horarios)
    
    res.json({
      success: true,
      message: 'Horários atualizados com sucesso!'
    })
  } catch (error) {
    console.error('❌ Erro ao atualizar horários:', error)
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
    
    await wizardModel.deleteServicoData(servicoId)
    
    res.json({
      success: true,
      message: 'Serviço excluído com sucesso!'
    })
  } catch (error) {
    console.error('Erro ao excluir serviço:', error)
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
    
    await wizardModel.deleteProfissionalData(profissionalId)
    
    res.json({
      success: true,
      message: 'Profissional excluído com sucesso!'
    })
  } catch (error) {
    console.error('Erro ao excluir profissional:', error)
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
    console.error('Erro ao buscar prompts:', error)
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
    console.error('Erro ao buscar versões do prompt:', error)
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
    
    // Se Super Admin, usar empresa_id do contexto
    const SUPER_ADMIN_ID = '550e8400-e29b-41d4-a716-446655440012'
    const isSuperAdmin = req.user.nivel_acesso_id === SUPER_ADMIN_ID
    const empresaId = (isSuperAdmin && req.body.empresa_id) ? req.body.empresa_id : req.user.empresa_id

    console.log('🤖 updateEmpresaPrompt:', {
      isSuperAdmin,
      empresaIdFromBody: req.body.empresa_id,
      empresaIdFromUser: req.user.empresa_id,
      empresaIdFinal: empresaId,
      promptKey,
      promptVersion
    })
    
    await wizardModel.updateEmpresaPrompt(empresaId, promptKey, promptVersion)
    
    res.json({
      success: true,
      message: 'Prompt atualizado com sucesso!'
    })
  } catch (error) {
    console.error('Erro ao atualizar prompt:', error)
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
    
    // Se Super Admin, usar empresaId da URL; senão, usar empresa do usuário logado
    const SUPER_ADMIN_ID = '550e8400-e29b-41d4-a716-446655440012'
    const isSuperAdmin = req.user.nivel_acesso_id === SUPER_ADMIN_ID
    const targetEmpresaId = (isSuperAdmin && empresaId) ? empresaId : req.user.empresa_id

    const usuarios = await wizardModel.getUsuariosByEmpresa(targetEmpresaId)
    
    res.json({
      success: true,
      data: usuarios
    })
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
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
    console.error('Erro ao buscar níveis de acesso:', error)
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
    
    // Se Super Admin, usar empresa_id do body; senão, usar empresa do usuário logado
    const SUPER_ADMIN_ID = '550e8400-e29b-41d4-a716-446655440012'
    const isSuperAdmin = req.user.nivel_acesso_id === SUPER_ADMIN_ID
    const empresaId = (isSuperAdmin && userData.empresa_id) ? userData.empresa_id : req.user.empresa_id

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
    console.error('Erro ao criar usuário:', error)
    res.status(500).json({ 
      success: false,
      message: error.message || 'Erro ao criar usuário' 
    })
  }
}

// Atualizar usuário
export async function updateUsuario(req, res) {
  try {
    const { loginId } = req.params
    const userData = req.body
    
    const usuarioAtualizado = await wizardModel.updateUsuario(loginId, userData)
    
    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso!',
      data: usuarioAtualizado
    })
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
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
    
    // Hash da nova senha
    const bcrypt = await import('bcrypt')
    const senhaHash = await bcrypt.hash(novaSenha, 10)
    
    await wizardModel.updateSenhaUsuario(loginId, senhaHash)
    
    res.json({
      success: true,
      message: 'Senha atualizada com sucesso!'
    })
  } catch (error) {
    console.error('Erro ao atualizar senha:', error)
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
    
    await wizardModel.deleteUsuario(loginId)
    
    res.json({
      success: true,
      message: 'Usuário excluído com sucesso!'
    })
  } catch (error) {
    console.error('Erro ao excluir usuário:', error)
    res.status(500).json({ 
      success: false,
      message: 'Erro ao excluir usuário' 
    })
  }
}

