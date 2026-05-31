import bcrypt from 'bcrypt'
import { empresaModel } from '../models/empresa.model.js'
import pool from '../config/database.js'
import {
  requireEmpresaAccess,
  sendAuthorizationError,
} from '../utils/authorization.js'
import { logger } from '../utils/logger.js'

// Listar empresas agrupadas por revenda (apenas para Super Admin)
export async function listarEmpresasPorRevenda(req, res) {
  try {
    const userNivelAcessoId = req.user.nivel_acesso_id
    const SUPER_ADMIN_ID = '550e8400-e29b-41d4-a716-446655440012'
    
    // Apenas Super Admin pode acessar
    if (userNivelAcessoId !== SUPER_ADMIN_ID) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas Super Admin pode visualizar este relatório.'
      })
    }
    
    // Buscar todas as empresas com informação do criador
    const result = await pool.query(`
      SELECT 
        e.empresa_id,
        e.empresa_nome,
        e.status,
        e.criado_por,
        e.data_cadastro,
        e.empresa_dt_criacao,
        l.nome as criador_nome,
        l.login as criador_login,
        l.email as criador_email,
        na.nivel_acesso_ as criador_nivel,
        (SELECT COUNT(*) FROM login WHERE empresa_id = e.empresa_id) as total_usuarios,
        (SELECT COUNT(*) FROM profissional WHERE empresa_id = e.empresa_id) as total_profissionais,
        (SELECT COUNT(*) FROM agendamento WHERE empresa_id = e.empresa_id) as total_agendamentos
      FROM empresa e
      LEFT JOIN login l ON l.login_id = e.criado_por
      LEFT JOIN nivel_acesso na ON na.nivel_acesso_id = l.nivel_acesso_id
      ORDER BY l.nome, e.data_cadastro DESC
    `)
    
    // Agrupar empresas por revenda
    const empresasPorRevenda = {}
    const empresasSemRevenda = []
    
    result.rows.forEach(empresa => {
      if (empresa.criado_por && empresa.criador_nivel === 'revenda') {
        // Empresa criada por revenda
        const revendaKey = empresa.criado_por
        if (!empresasPorRevenda[revendaKey]) {
          empresasPorRevenda[revendaKey] = {
            revenda_id: empresa.criado_por,
            revenda_nome: empresa.criador_nome,
            revenda_login: empresa.criador_login,
            revenda_email: empresa.criador_email,
            empresas: []
          }
        }
        empresasPorRevenda[revendaKey].empresas.push(empresa)
      } else {
        // Empresa sem revenda ou criada por outro perfil
        empresasSemRevenda.push(empresa)
      }
    })
    
    // Converter objeto em array
    const revendas = Object.values(empresasPorRevenda)
    
    res.json({
      success: true,
      data: {
        revendas,
        empresas_sem_revenda: empresasSemRevenda,
        estatisticas: {
          total_revendas: revendas.length,
          total_empresas_com_revenda: revendas.reduce((acc, r) => acc + r.empresas.length, 0),
          total_empresas_sem_revenda: empresasSemRevenda.length,
          total_empresas: result.rows.length
        }
      }
    })
  } catch (error) {
    logger.error('Erro ao listar empresas por revenda', { error, empresaId: req.user?.empresa_id })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao listar empresas por revenda' 
    })
  }
}

// Listar todas as empresas
export async function listarEmpresas(req, res) {
  try {
    const userEmpresaId = req.user.empresa_id
    const userNivelAcessoId = req.user.nivel_acesso_id
    const userLoginId = req.user.login_id
    const userOrgRevendaId = req.user.org_revenda_id
    const userIsGestorRevenda = req.user.is_gestor_revenda
    
    // IDs dos níveis de acesso
    const SUPER_ADMIN_ID = '550e8400-e29b-41d4-a716-446655440012'
    const REVENDA_ID = '550e8400-e29b-41d4-a716-446655440020'
    
    // Definir quais empresas o usuário pode ver
    let empresas
    if (userNivelAcessoId === SUPER_ADMIN_ID) {
      // Super Admin vê todas
      empresas = await empresaModel.findAll()
    } else if (userNivelAcessoId === REVENDA_ID && userIsGestorRevenda && userOrgRevendaId) {
      // Gestor de Revenda vê todas da organização
      empresas = await empresaModel.findByOrganizacao(userOrgRevendaId)
    } else if (userNivelAcessoId === REVENDA_ID) {
      // Vendedor de Revenda vê apenas as suas
      empresas = await empresaModel.findByCreator(userLoginId)
    } else {
      // Admin de Empresa vê apenas sua empresa
      empresas = await empresaModel.findByEmpresaId(userEmpresaId)
    }
    
    logger.info('Empresas listadas', {
      actorLoginId: userLoginId,
      actorEmpresaId: userEmpresaId,
      total: empresas.length,
    })
    
    res.json({
      success: true,
      data: empresas
    })
  } catch (error) {
    logger.error('Erro ao listar empresas', { error, empresaId: req.user?.empresa_id })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao listar empresas' 
    })
  }
}

// Buscar empresa por ID
export async function buscarEmpresa(req, res) {
  try {
    const { id } = req.params
    await requireEmpresaAccess(req.user, id)

    const empresa = await empresaModel.findById(id)
    
    if (!empresa) {
      return res.status(404).json({ 
        success: false,
        message: 'Empresa não encontrada' 
      })
    }
    
    res.json({
      success: true,
      data: empresa
    })
  } catch (error) {
    if (sendAuthorizationError(res, error)) return

    logger.error('Erro ao buscar empresa', { error, empresaId: id })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar empresa' 
    })
  }
}

// Criar nova empresa
export async function criarEmpresa(req, res) {
  try {
    const {
      // Dados da empresa
      empresa_nome,
      empresa_contato,
      observacoes,
      contato_agente,
      
      // Endereço
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      uf,
      
      // Configurações
      anteced_minutos,
      interv_minutos,
      buffer_pre_minutos,
      buffer_pos_minutos,
      timezone,
      
      // Usuário admin
      admin_nome,
      admin_email,
      admin_senha,
      
      // Opcionais
      criar_instancia,
      criar_contrato,
      contrato_valor,
      contrato_nome
    } = req.body

    // Validações
    if (!empresa_nome || !empresa_contato || !cep) {
      return res.status(400).json({ 
        success: false,
        message: 'Nome da empresa, contato e CEP são obrigatórios' 
      })
    }

    if (!admin_email || !admin_senha) {
      return res.status(400).json({ 
        success: false,
        message: 'Email e senha do administrador são obrigatórios' 
      })
    }

    // Gerar hash da senha
    const admin_senha_hash = await bcrypt.hash(admin_senha, 10)

    // Criar empresa (registrando quem criou)
    const result = await empresaModel.create({
      empresa_nome,
      empresa_contato,
      observacoes,
      contato_agente,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      uf,
      anteced_minutos,
      interv_minutos,
      buffer_pre_minutos,
      buffer_pos_minutos,
      timezone,
      admin_nome,
      admin_email,
      admin_senha_hash,
      criar_instancia: criar_instancia !== false, // true por padrão
      criar_contrato: criar_contrato !== false, // true por padrão
      contrato_valor,
      contrato_nome,
      criado_por: req.user.login_id // Registrar quem criou
    })

    res.status(201).json({
      success: true,
      message: 'Empresa criada com sucesso',
      data: {
        empresa_id: result.empresaId,
        credenciais: {
          email: admin_email,
          senha: admin_senha // Retornar senha apenas na criação
        }
      }
    })
  } catch (error) {
    logger.error('Erro ao criar empresa', { error, actorLoginId: req.user?.login_id })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao criar empresa'
    })
  }
}

// Atualizar empresa
export async function atualizarEmpresa(req, res) {
  try {
    const { id } = req.params
    const empresaData = req.body
    await requireEmpresaAccess(req.user, id)

    const empresa = await empresaModel.update(id, empresaData)
    
    if (!empresa) {
      return res.status(404).json({ 
        success: false,
        message: 'Empresa não encontrada' 
      })
    }

    res.json({
      success: true,
      message: 'Empresa atualizada com sucesso',
      data: empresa
    })
  } catch (error) {
    if (sendAuthorizationError(res, error)) return

    logger.error('Erro ao atualizar empresa', { error, empresaId: id })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao atualizar empresa' 
    })
  }
}

// Ativar/Desativar empresa
export async function alterarStatusEmpresa(req, res) {
  try {
    const { id } = req.params
    const { status } = req.body
    await requireEmpresaAccess(req.user, id)

    if (!['ativa', 'inativa'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Status inválido. Use "ativa" ou "inativa"' 
      })
    }

    const empresa = await empresaModel.updateStatus(id, status)
    
    if (!empresa) {
      return res.status(404).json({ 
        success: false,
        message: 'Empresa não encontrada' 
      })
    }

    res.json({
      success: true,
      message: `Empresa ${status === 'ativa' ? 'ativada' : 'desativada'} com sucesso`,
      data: empresa
    })
  } catch (error) {
    if (sendAuthorizationError(res, error)) return

    logger.error('Erro ao alterar status da empresa', { error, empresaId: id })
    res.status(500).json({ 
      success: false,
      message: 'Erro ao alterar status da empresa' 
    })
  }
}
