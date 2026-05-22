import pool from '../config/database.js'

export const empresaModel = {
  // Listar todas as empresas
  async findAll() {
    const result = await pool.query(`
      SELECT 
        e.empresa_id,
        e.empresa_nome,
        e.empresa_contato,
        e.status,
        e.empresa_dt_criacao,
        e.empresa_dt_atualizacao,
        en.logradouro,
        en.numero,
        en.bairro,
        en.cidade,
        en.uf,
        en.cep,
        ec.empresa_cfg_timezone,
        ec.empresa_cfg_anteced_minutos,
        ec.empresa_cfg_interv_minutos,
        (SELECT COUNT(*) FROM login l WHERE l.empresa_id = e.empresa_id) as total_usuarios,
        (SELECT COUNT(*) FROM profissional p WHERE p.empresa_id = e.empresa_id) as total_profissionais,
        (SELECT COUNT(*) FROM agendamento a WHERE a.empresa_id = e.empresa_id) as total_agendamentos
      FROM empresa e
      LEFT JOIN endereco en ON en.endereco_id = e.endereco_id
      LEFT JOIN empresa_cfg ec ON ec.empresa_cfg_id = e.empresa_cfg_id
      ORDER BY e.empresa_dt_criacao DESC
    `)
    return result.rows
  },

  // Buscar empresa por ID
  async findById(empresaId) {
    const result = await pool.query(`
      SELECT 
        e.*,
        en.*,
        ec.*
      FROM empresa e
      LEFT JOIN endereco en ON en.endereco_id = e.endereco_id
      LEFT JOIN empresa_cfg ec ON ec.empresa_cfg_id = e.empresa_cfg_id
      WHERE e.empresa_id = $1
    `, [empresaId])
    return result.rows[0]
  },

  // Buscar empresas por empresa_id (para usuários não-admin)
  async findByEmpresaId(empresaId) {
    const result = await pool.query(`
      SELECT 
        e.empresa_id,
        e.empresa_nome,
        e.empresa_contato,
        e.status,
        e.empresa_dt_criacao,
        e.empresa_dt_atualizacao,
        en.logradouro,
        en.numero,
        en.bairro,
        en.cidade,
        en.uf,
        en.cep,
        ec.empresa_cfg_timezone,
        ec.empresa_cfg_anteced_minutos,
        ec.empresa_cfg_interv_minutos,
        (SELECT COUNT(*) FROM login l WHERE l.empresa_id = e.empresa_id) as total_usuarios,
        (SELECT COUNT(*) FROM profissional p WHERE p.empresa_id = e.empresa_id) as total_profissionais,
        (SELECT COUNT(*) FROM agendamento a WHERE a.empresa_id = e.empresa_id) as total_agendamentos
      FROM empresa e
      LEFT JOIN endereco en ON en.endereco_id = e.endereco_id
      LEFT JOIN empresa_cfg ec ON ec.empresa_cfg_id = e.empresa_cfg_id
      WHERE e.empresa_id = $1
      ORDER BY e.empresa_dt_criacao DESC
    `, [empresaId])
    return result.rows
  },

  // Buscar empresas de uma organização (gestor vê todas da org)
  async findByOrganizacao(orgRevendaId) {
    const result = await pool.query(`
      SELECT 
        e.empresa_id,
        e.empresa_nome,
        e.empresa_contato,
        e.status,
        e.empresa_dt_criacao,
        e.empresa_dt_atualizacao,
        e.data_cadastro,
        e.criado_por,
        en.logradouro,
        en.numero,
        en.bairro,
        en.cidade,
        en.uf,
        en.cep,
        ec.empresa_cfg_timezone,
        ec.empresa_cfg_anteced_minutos,
        ec.empresa_cfg_interv_minutos,
        l.nome as criador_nome,
        l.login as criador_login,
        (SELECT COUNT(*) FROM login WHERE empresa_id = e.empresa_id) as total_usuarios,
        (SELECT COUNT(*) FROM profissional p WHERE p.empresa_id = e.empresa_id) as total_profissionais,
        (SELECT COUNT(*) FROM agendamento a WHERE a.empresa_id = e.empresa_id) as total_agendamentos
      FROM empresa e
      LEFT JOIN endereco en ON en.endereco_id = e.endereco_id
      LEFT JOIN empresa_cfg ec ON ec.empresa_cfg_id = e.empresa_cfg_id
      LEFT JOIN login l ON l.login_id = e.criado_por
      WHERE l.org_revenda_id = $1
      ORDER BY e.data_cadastro DESC, e.empresa_dt_criacao DESC
    `, [orgRevendaId])
    return result.rows
  },

  // Buscar empresas criadas por um usuário específico (para Vendedor)
  async findByCreator(loginId) {
    const result = await pool.query(`
      SELECT 
        e.empresa_id,
        e.empresa_nome,
        e.empresa_contato,
        e.status,
        e.empresa_dt_criacao,
        e.empresa_dt_atualizacao,
        e.data_cadastro,
        en.logradouro,
        en.numero,
        en.bairro,
        en.cidade,
        en.uf,
        en.cep,
        ec.empresa_cfg_timezone,
        ec.empresa_cfg_anteced_minutos,
        ec.empresa_cfg_interv_minutos,
        (SELECT COUNT(*) FROM login l WHERE l.empresa_id = e.empresa_id) as total_usuarios,
        (SELECT COUNT(*) FROM profissional p WHERE p.empresa_id = e.empresa_id) as total_profissionais,
        (SELECT COUNT(*) FROM agendamento a WHERE a.empresa_id = e.empresa_id) as total_agendamentos
      FROM empresa e
      LEFT JOIN endereco en ON en.endereco_id = e.endereco_id
      LEFT JOIN empresa_cfg ec ON ec.empresa_cfg_id = e.empresa_cfg_id
      WHERE e.criado_por = $1
      ORDER BY e.data_cadastro DESC, e.empresa_dt_criacao DESC
    `, [loginId])
    return result.rows
  },

  // Criar empresa completa (com endereço, config, usuário admin)
  async create(empresaData) {
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')

      // 1. Criar endereço
      const enderecoResult = await client.query(`
        INSERT INTO endereco (
          cep, logradouro, numero, complemento, bairro, cidade, uf
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING endereco_id
      `, [
        empresaData.cep,
        empresaData.logradouro,
        empresaData.numero,
        empresaData.complemento || '',
        empresaData.bairro,
        empresaData.cidade,
        empresaData.uf
      ])
      const enderecoId = enderecoResult.rows[0].endereco_id

      // 2. Criar configuração da empresa
      const configResult = await client.query(`
        INSERT INTO empresa_cfg (
          empresa_cfg_anteced_minutos,
          empresa_cfg_interv_minutos,
          empresa_cfg_buffer_pre_minutos,
          empresa_cfg_buffer_pos_minutos,
          empresa_cfg_timezone,
          empresa_cfg_nome
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING empresa_cfg_id
      `, [
        empresaData.anteced_minutos || 30,
        empresaData.interv_minutos || 15,
        empresaData.buffer_pre_minutos || 5,
        empresaData.buffer_pos_minutos || 5,
        empresaData.timezone || 'America/Sao_Paulo',
        `Configuração ${empresaData.empresa_nome}`
      ])
      const configId = configResult.rows[0].empresa_cfg_id

      // 3. Criar empresa
      const empresaResult = await client.query(`
        INSERT INTO empresa (
          endereco_id,
          empresa_cfg_id,
          cep,
          empresa_nome,
          empresa_contato,
          status,
          endereco,
          observacoes,
          empresa_contato_agente,
          criado_por
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING empresa_id
      `, [
        enderecoId,
        configId,
        empresaData.cep,
        empresaData.empresa_nome,
        empresaData.empresa_contato,
        'ativa',
        `${empresaData.logradouro}, ${empresaData.numero} - ${empresaData.bairro}, ${empresaData.cidade}/${empresaData.uf}`,
        empresaData.observacoes || 'Criado via sistema',
        empresaData.contato_agente || '',
        empresaData.criado_por || null
      ])
      const empresaId = empresaResult.rows[0].empresa_id

      // 4. Buscar nível de acesso admin
      const nivelResult = await client.query(`
        SELECT nivel_acesso_id 
        FROM nivel_acesso 
        WHERE LOWER(nivel_acesso_) LIKE '%admin%'
        LIMIT 1
      `)
      const nivelAcessoId = nivelResult.rows[0] ? nivelResult.rows[0].nivel_acesso_id : null

      // 5. Criar usuário admin da empresa
      if (empresaData.admin_email && empresaData.admin_senha_hash) {
        await client.query(`
          INSERT INTO login (
            login_id,
            nivel_acesso_id,
            empresa_id,
            login,
            email,
            senha,
            nome
          ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
        `, [
          nivelAcessoId,
          empresaId,
          empresaData.admin_email.split('@')[0],
          empresaData.admin_email,
          empresaData.admin_senha_hash,
          empresaData.admin_nome || 'Administrador'
        ])
      }

      // 6. Criar instância WhatsApp
      if (empresaData.criar_instancia) {
        await client.query(`
          INSERT INTO instancia (
            instancia_id,
            empresa_id,
            instancia_nome,
            instancia_observacao
          ) VALUES (gen_random_uuid(), $1, $2, $3)
        `, [
          empresaId,
          `Instância ${empresaData.empresa_nome}`,
          'Criada automaticamente'
        ])
      }

      // 7. Criar contrato (opcional)
      if (empresaData.criar_contrato) {
        await client.query(`
          INSERT INTO contrato (
            empresa_id,
            contrato_status,
            contrato_valor,
            contrato_nome,
            created_at,
            contrato_periodicidade,
            contrato_vigencia_inicio,
            contrato_proxima_cobranca
          ) VALUES ($1, $2, $3, $4, NOW(), $5, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month')
        `, [
          empresaId,
          'Ativo',
          empresaData.contrato_valor || 59.90,
          empresaData.contrato_nome || 'Básico',
          'Mensal'
        ])
      }

      await client.query('COMMIT')
      
      return { empresaId, enderecoId, configId }
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },

  // Atualizar empresa
  async update(empresaId, empresaData) {
    const result = await pool.query(`
      UPDATE empresa 
      SET 
        empresa_nome = COALESCE($1, empresa_nome),
        empresa_contato = COALESCE($2, empresa_contato),
        status = COALESCE($3, status),
        observacoes = COALESCE($4, observacoes),
        empresa_dt_atualizacao = NOW()
      WHERE empresa_id = $5
      RETURNING *
    `, [
      empresaData.empresa_nome,
      empresaData.empresa_contato,
      empresaData.status,
      empresaData.observacoes,
      empresaId
    ])
    return result.rows[0]
  },

  // Ativar/Desativar empresa
  async updateStatus(empresaId, status) {
    const result = await pool.query(`
      UPDATE empresa 
      SET status = $1, empresa_dt_atualizacao = NOW()
      WHERE empresa_id = $2
      RETURNING *
    `, [status, empresaId])
    return result.rows[0]
  }
}

