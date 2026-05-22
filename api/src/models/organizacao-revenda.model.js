import pool from '../config/database.js'

export const organizacaoRevendaModel = {
  // Criar nova organização
  async create(orgData) {
    const result = await pool.query(`
      INSERT INTO organizacao_revenda (
        org_nome,
        org_razao_social,
        org_cnpj,
        org_contato,
        org_email,
        org_endereco,
        org_status,
        org_observacoes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      orgData.org_nome,
      orgData.org_razao_social || null,
      orgData.org_cnpj || null,
      orgData.org_contato || null,
      orgData.org_email || null,
      orgData.org_endereco || null,
      orgData.org_status || 'ativa',
      orgData.org_observacoes || null
    ])
    return result.rows[0]
  },

  // Buscar todas as organizações
  async findAll() {
    const result = await pool.query(`
      SELECT 
        o.*,
        COUNT(DISTINCT l.login_id) as total_usuarios,
        COUNT(DISTINCT l.login_id) FILTER (WHERE l.is_gestor_revenda = true) as total_gestores,
        COUNT(DISTINCT l.login_id) FILTER (WHERE l.is_gestor_revenda = false) as total_vendedores,
        COUNT(DISTINCT e.empresa_id) as total_empresas
      FROM organizacao_revenda o
      LEFT JOIN login l ON l.org_revenda_id = o.org_revenda_id AND l.nivel_acesso_id = '550e8400-e29b-41d4-a716-446655440020'
      LEFT JOIN empresa e ON e.criado_por = l.login_id
      GROUP BY o.org_revenda_id
      ORDER BY o.org_criado_em DESC
    `)
    return result.rows
  },

  // Buscar organização por ID
  async findById(orgId) {
    const result = await pool.query(`
      SELECT 
        o.*,
        COUNT(DISTINCT l.login_id) as total_usuarios,
        COUNT(DISTINCT l.login_id) FILTER (WHERE l.is_gestor_revenda = true) as total_gestores,
        COUNT(DISTINCT l.login_id) FILTER (WHERE l.is_gestor_revenda = false) as total_vendedores,
        COUNT(DISTINCT e.empresa_id) as total_empresas
      FROM organizacao_revenda o
      LEFT JOIN login l ON l.org_revenda_id = o.org_revenda_id AND l.nivel_acesso_id = '550e8400-e29b-41d4-a716-446655440020'
      LEFT JOIN empresa e ON e.criado_por = l.login_id
      WHERE o.org_revenda_id = $1
      GROUP BY o.org_revenda_id
    `, [orgId])
    return result.rows[0]
  },

  // Atualizar organização
  async update(orgId, orgData) {
    const result = await pool.query(`
      UPDATE organizacao_revenda
      SET
        org_nome = COALESCE($2, org_nome),
        org_razao_social = COALESCE($3, org_razao_social),
        org_cnpj = COALESCE($4, org_cnpj),
        org_contato = COALESCE($5, org_contato),
        org_email = COALESCE($6, org_email),
        org_endereco = COALESCE($7, org_endereco),
        org_status = COALESCE($8, org_status),
        org_observacoes = COALESCE($9, org_observacoes)
      WHERE org_revenda_id = $1
      RETURNING *
    `, [
      orgId,
      orgData.org_nome,
      orgData.org_razao_social,
      orgData.org_cnpj,
      orgData.org_contato,
      orgData.org_email,
      orgData.org_endereco,
      orgData.org_status,
      orgData.org_observacoes
    ])
    return result.rows[0]
  },

  // Alterar status da organização
  async updateStatus(orgId, status) {
    const result = await pool.query(`
      UPDATE organizacao_revenda
      SET org_status = $2
      WHERE org_revenda_id = $1
      RETURNING *
    `, [orgId, status])
    return result.rows[0]
  },

  // Buscar usuários (gestores e vendedores) de uma organização
  async findUsuarios(orgId) {
    const result = await pool.query(`
      SELECT 
        l.login_id,
        l.nome,
        l.login,
        l.email,
        l.is_gestor_revenda,
        l.empresa_id,
        l.created,
        e.empresa_nome,
        COUNT(DISTINCT emp.empresa_id) as total_empresas_cadastradas
      FROM login l
      LEFT JOIN empresa e ON e.empresa_id = l.empresa_id
      LEFT JOIN empresa emp ON emp.criado_por = l.login_id
      WHERE l.org_revenda_id = $1
        AND l.nivel_acesso_id = '550e8400-e29b-41d4-a716-446655440020'
      GROUP BY l.login_id, l.nome, l.login, l.email, l.is_gestor_revenda, l.empresa_id, l.created, e.empresa_nome
      ORDER BY l.is_gestor_revenda DESC, l.created DESC
    `, [orgId])
    return result.rows
  },

  // Buscar empresas de uma organização (todas as empresas cadastradas por gestores e vendedores)
  async findEmpresas(orgId) {
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
        l.is_gestor_revenda as criador_is_gestor,
        (SELECT COUNT(*) FROM login WHERE empresa_id = e.empresa_id) as total_usuarios,
        (SELECT COUNT(*) FROM profissional WHERE empresa_id = e.empresa_id) as total_profissionais,
        (SELECT COUNT(*) FROM agendamento WHERE empresa_id = e.empresa_id) as total_agendamentos
      FROM empresa e
      INNER JOIN login l ON l.login_id = e.criado_por
      WHERE l.org_revenda_id = $1
      ORDER BY e.data_cadastro DESC, e.empresa_dt_criacao DESC
    `, [orgId])
    return result.rows
  },

  // Deletar organização (apenas se não tiver usuários)
  async delete(orgId) {
    // Verificar se há usuários vinculados
    const checkResult = await pool.query(`
      SELECT COUNT(*) as count FROM login WHERE org_revenda_id = $1
    `, [orgId])
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      throw new Error('Não é possível excluir organização com usuários vinculados')
    }
    
    const result = await pool.query(`
      DELETE FROM organizacao_revenda
      WHERE org_revenda_id = $1
      RETURNING *
    `, [orgId])
    return result.rows[0]
  }
}



