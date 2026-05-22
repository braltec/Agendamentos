import { organizacaoRevendaModel } from '../models/organizacao-revenda.model.js'
import bcrypt from 'bcrypt'
import pool from '../config/database.js'

const SUPER_ADMIN_ID = '550e8400-e29b-41d4-a716-446655440012'
const REVENDA_ID = '550e8400-e29b-41d4-a716-446655440020'

// Listar todas as organizações (apenas Super Admin)
export async function listarOrganizacoes(req, res) {
  try {
    if (req.user.nivel_acesso_id !== SUPER_ADMIN_ID) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas Super Admin pode visualizar organizações.'
      })
    }

    const organizacoes = await organizacaoRevendaModel.findAll()
    
    res.json({
      success: true,
      data: organizacoes
    })
  } catch (error) {
    console.error('Erro ao listar organizações:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar organizações'
    })
  }
}

// Buscar organização por ID
export async function buscarOrganizacao(req, res) {
  try {
    const { id } = req.params
    const isSuperAdmin = req.user.nivel_acesso_id === SUPER_ADMIN_ID
    const isGestorRevenda = req.user.nivel_acesso_id === REVENDA_ID && req.user.is_gestor_revenda
    const userOrgId = req.user.org_revenda_id
    
    // Super Admin pode ver qualquer organização
    // Gestor só pode ver sua própria organização
    if (!isSuperAdmin && (!isGestorRevenda || userOrgId !== id)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Você só pode acessar sua própria organização.'
      })
    }

    const organizacao = await organizacaoRevendaModel.findById(id)
    
    if (!organizacao) {
      return res.status(404).json({
        success: false,
        message: 'Organização não encontrada'
      })
    }
    
    res.json({
      success: true,
      data: organizacao
    })
  } catch (error) {
    console.error('Erro ao buscar organização:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar organização'
    })
  }
}

// Criar nova organização (apenas Super Admin)
export async function criarOrganizacao(req, res) {
  try {
    if (req.user.nivel_acesso_id !== SUPER_ADMIN_ID) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas Super Admin pode criar organizações.'
      })
    }

    const organizacao = await organizacaoRevendaModel.create(req.body)
    
    res.status(201).json({
      success: true,
      data: organizacao,
      message: 'Organização criada com sucesso!'
    })
  } catch (error) {
    console.error('Erro ao criar organização:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao criar organização'
    })
  }
}

// Atualizar organização (apenas Super Admin)
export async function atualizarOrganizacao(req, res) {
  try {
    const { id } = req.params
    
    if (req.user.nivel_acesso_id !== SUPER_ADMIN_ID) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado.'
      })
    }

    const organizacao = await organizacaoRevendaModel.update(id, req.body)
    
    if (!organizacao) {
      return res.status(404).json({
        success: false,
        message: 'Organização não encontrada'
      })
    }
    
    res.json({
      success: true,
      data: organizacao,
      message: 'Organização atualizada com sucesso!'
    })
  } catch (error) {
    console.error('Erro ao atualizar organização:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar organização'
    })
  }
}

// Alterar status da organização
export async function alterarStatusOrganizacao(req, res) {
  try {
    const { id } = req.params
    const { status } = req.body
    
    if (req.user.nivel_acesso_id !== SUPER_ADMIN_ID) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado.'
      })
    }

    const organizacao = await organizacaoRevendaModel.updateStatus(id, status)
    
    if (!organizacao) {
      return res.status(404).json({
        success: false,
        message: 'Organização não encontrada'
      })
    }
    
    res.json({
      success: true,
      data: organizacao,
      message: `Organização ${status === 'ativa' ? 'ativada' : 'desativada'} com sucesso!`
    })
  } catch (error) {
    console.error('Erro ao alterar status:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao alterar status da organização'
    })
  }
}

// Listar usuários de uma organização
export async function listarUsuariosOrganizacao(req, res) {
  try {
    const { id } = req.params
    
    // Super Admin pode ver qualquer organização
    // Gestor/Vendedor só pode ver sua própria organização
    if (req.user.nivel_acesso_id !== SUPER_ADMIN_ID) {
      if (req.user.org_revenda_id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado.'
        })
      }
    }

    const usuarios = await organizacaoRevendaModel.findUsuarios(id)
    
    res.json({
      success: true,
      data: usuarios
    })
  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar usuários da organização'
    })
  }
}

// Listar empresas de uma organização
export async function listarEmpresasOrganizacao(req, res) {
  try {
    const { id } = req.params
    
    // Super Admin pode ver qualquer organização
    // Gestor/Vendedor só pode ver sua própria organização
    if (req.user.nivel_acesso_id !== SUPER_ADMIN_ID) {
      if (req.user.org_revenda_id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado.'
        })
      }
    }

    const empresas = await organizacaoRevendaModel.findEmpresas(id)
    
    res.json({
      success: true,
      data: empresas
    })
  } catch (error) {
    console.error('Erro ao listar empresas:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao listar empresas da organização'
    })
  }
}

// Criar vendedor na organização (apenas Gestor da organização ou Super Admin)
export async function criarVendedor(req, res) {
  try {
    const { id: orgId } = req.params
    const { nome, login, email, senha, is_gestor_revenda } = req.body
    
    // Verificar permissões
    const isSuperAdmin = req.user.nivel_acesso_id === SUPER_ADMIN_ID
    const isGestor = req.user.is_gestor_revenda && req.user.org_revenda_id === orgId
    
    if (!isSuperAdmin && !isGestor) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas gestores da organização podem criar vendedores.'
      })
    }

    // Verificar se login já existe
    const checkLogin = await pool.query('SELECT login_id FROM login WHERE login = $1', [login])
    if (checkLogin.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Login já existe no sistema'
      })
    }

    // Verificar se email já existe
    const checkEmail = await pool.query('SELECT login_id FROM login WHERE email = $1', [email])
    if (checkEmail.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email já existe no sistema'
      })
    }

    // Verificar se a organização existe
    const org = await organizacaoRevendaModel.findById(orgId)
    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organização não encontrada'
      })
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10)

    // Criar usuário
    // O usuário revenda vai estar vinculado à primeira empresa do sistema como placeholder
    // (ou podemos criar uma empresa fictícia para a organização)
    const empresaPlaceholder = await pool.query('SELECT empresa_id FROM empresa LIMIT 1')
    
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
      login,
      email,
      hashedPassword,
      nome,
      orgId,
      is_gestor_revenda || false
    ])

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: `${is_gestor_revenda ? 'Gestor' : 'Vendedor'} criado com sucesso!`
    })
  } catch (error) {
    console.error('Erro ao criar vendedor:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao criar vendedor'
    })
  }
}

// Atualizar vendedor (apenas Gestor da organização ou Super Admin)
export async function atualizarVendedor(req, res) {
  try {
    const { id: orgId, vendedorId } = req.params
    const { nome, email, is_gestor_revenda } = req.body
    
    // Verificar permissões
    const isSuperAdmin = req.user.nivel_acesso_id === SUPER_ADMIN_ID
    const isGestor = req.user.is_gestor_revenda && req.user.org_revenda_id === orgId
    
    if (!isSuperAdmin && !isGestor) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado.'
      })
    }

    // Verificar se o vendedor pertence a esta organização
    const checkVendedor = await pool.query(`
      SELECT login_id FROM login 
      WHERE login_id = $1 AND org_revenda_id = $2
    `, [vendedorId, orgId])
    
    if (checkVendedor.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendedor não encontrado nesta organização'
      })
    }

    // Atualizar vendedor
    const result = await pool.query(`
      UPDATE login
      SET
        nome = COALESCE($2, nome),
        email = COALESCE($3, email),
        is_gestor_revenda = COALESCE($4, is_gestor_revenda)
      WHERE login_id = $1
      RETURNING login_id, nome, login, email, org_revenda_id, is_gestor_revenda
    `, [vendedorId, nome, email, is_gestor_revenda])

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Vendedor atualizado com sucesso!'
    })
  } catch (error) {
    console.error('Erro ao atualizar vendedor:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar vendedor'
    })
  }
}

// Remover vendedor da organização (apenas Gestor ou Super Admin)
export async function removerVendedor(req, res) {
  try {
    const { id: orgId, vendedorId } = req.params
    
    // Verificar permissões
    const isSuperAdmin = req.user.nivel_acesso_id === SUPER_ADMIN_ID
    const isGestor = req.user.is_gestor_revenda && req.user.org_revenda_id === orgId
    
    if (!isSuperAdmin && !isGestor) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado.'
      })
    }

    // Verificar se há empresas cadastradas por este vendedor
    const checkEmpresas = await pool.query(`
      SELECT COUNT(*) as count FROM empresa WHERE criado_por = $1
    `, [vendedorId])
    
    if (parseInt(checkEmpresas.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível remover vendedor que cadastrou empresas. Transfira as empresas primeiro.'
      })
    }

    // Remover vendedor
    const result = await pool.query(`
      DELETE FROM login
      WHERE login_id = $1 AND org_revenda_id = $2
      RETURNING login_id, nome
    `, [vendedorId, orgId])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendedor não encontrado'
      })
    }

    res.json({
      success: true,
      message: 'Vendedor removido com sucesso!'
    })
  } catch (error) {
    console.error('Erro ao remover vendedor:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao remover vendedor'
    })
  }
}

