import pool from '../config/database.js'
import { isEmpresaStatusActive } from '../utils/authAccess.js'

const USUARIO_UPDATE_COLUMNS = {
  nome: 'nome',
  login: 'login',
  email: 'email',
  nivel_acesso_id: 'nivel_acesso_id',
}

async function assertHorarioFExclusiveToEmpresa(client, horarioFId, empresaId) {
  const result = await client.query(`
    SELECT DISTINCT p.empresa_id
    FROM profissional_horario ph
    JOIN profissional p ON p.profissional_id = ph.profissional_id
    WHERE ph.horario_f_id = $1
  `, [horarioFId])

  const otherEmpresa = result.rows.find(row => String(row.empresa_id) !== String(empresaId))
  if (otherEmpresa) {
    throw new Error('Horário compartilhado com outra empresa não pode ser alterado')
  }
}

export const wizardModel = {
  // Status completo usado pelo frontend para decidir se o setup inicial deve abrir.
  // "completed" continua representando o wizard completo; "requiresSetup" só deve
  // acionar o wizard quando o tenant estiver realmente sem configuração inicial.
  async getWizardStatus(empresaId) {
    if (!empresaId) {
      return {
        completed: false,
        requiresSetup: false,
        accessState: 'usuario_sem_empresa',
        empresaExiste: false,
        configuracaoExiste: false,
        empresaAtiva: false,
        empresaStatus: null,
        profissionais: 0,
        vinculos: 0,
        horariosVinculados: 0,
      }
    }

    const result = await pool.query(`
      SELECT
        EXISTS (
          SELECT 1
          FROM empresa
          WHERE empresa_id = $1
        ) AS empresa_existe,
        (
          SELECT COALESCE(status, 'ativa')
          FROM empresa
          WHERE empresa_id = $1
          LIMIT 1
        ) AS empresa_status,
        EXISTS (
          SELECT 1
          FROM empresa
          WHERE empresa_id = $1
            AND empresa_cfg_id IS NOT NULL
        ) AS configuracao_existe,
        (
          SELECT COUNT(*)::int
          FROM profissional
          WHERE empresa_id = $1
            AND COALESCE(status, 'ativo') <> 'inativo'
        ) AS profissionais,
        (
          SELECT COUNT(*)::int
          FROM profissional_servico ps
          JOIN profissional p ON ps.profissional_id = p.profissional_id
          WHERE p.empresa_id = $1
            AND COALESCE(p.status, 'ativo') <> 'inativo'
        ) AS vinculos,
        (
          SELECT COUNT(*)::int
          FROM profissional_horario ph
          JOIN profissional p ON ph.profissional_id = p.profissional_id
          WHERE p.empresa_id = $1
            AND COALESCE(p.status, 'ativo') <> 'inativo'
        ) AS horarios_vinculados
    `, [empresaId])

    const data = result.rows[0] || {}
    const profissionais = Number(data.profissionais || 0)
    const vinculos = Number(data.vinculos || 0)
    const horariosVinculados = Number(data.horarios_vinculados || 0)
    const empresaExiste = Boolean(data.empresa_existe)
    const configuracaoExiste = Boolean(data.configuracao_existe)
    const empresaStatus = data.empresa_status || null
    const empresaAtiva = empresaExiste && isEmpresaStatusActive(empresaStatus)
    const hasAnySetup = profissionais > 0 || vinculos > 0 || horariosVinculados > 0
    const requiresSetup = empresaAtiva && (!configuracaoExiste || !hasAnySetup)

    return {
      completed: profissionais > 0 && vinculos > 0 && horariosVinculados > 0,
      requiresSetup,
      accessState: !empresaExiste
        ? 'empresa_inexistente'
        : !empresaAtiva
          ? 'empresa_inativa'
          : requiresSetup
            ? 'setup_inicial'
            : 'empresa_ativa',
      empresaExiste,
      configuracaoExiste,
      empresaAtiva,
      empresaStatus,
      profissionais,
      vinculos,
      horariosVinculados,
    }
  },

  // Verificar se a empresa já completou o wizard
  async checkWizardCompleted(empresaId) {
    const status = await this.getWizardStatus(empresaId)
    return status.completed
  },

  // Salvar horários de funcionamento
  // Retorna o horario_f_id criado para vincular aos profissionais depois
  async saveHorarios(empresaId, horarios) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      
      // 1. Criar turno padrão (sem empresa_id)
      const newHorarioF = await client.query(`
        INSERT INTO horario_f (horario_f_turno)
        VALUES ('Padrão')
        RETURNING horario_f_id
      `)
      const horarioFId = newHorarioF.rows[0].horario_f_id
      
      // 2. Inserir horários do turno
      for (const horario of horarios) {
        if (horario.ativo) {
          await client.query(`
            INSERT INTO horario_det (
              horario_f_id,
              horario_def,
              horario_def_nome,
              horario_det_inicio,
              horario_det_fim
            ) VALUES ($1, $2, $3, $4, $5)
          `, [
            horarioFId,
            horario.dia_semana,
            horario.dia_nome,
            horario.hora_inicio,
            horario.hora_fim
          ])
        }
      }
      
      await client.query('COMMIT')
      return { success: true, horario_f_id: horarioFId }
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },
  
  // Vincular horário ao profissional
  async vincularHorarioProfissional(profissionalId, horarioFId) {
    await pool.query(`
      INSERT INTO profissional_horario (profissional_id, horario_f_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [profissionalId, horarioFId])
  },

  // Atualizar configurações de agendamento
  async saveConfiguracoes(empresaId, config) {
    const result = await pool.query(`
      UPDATE empresa_cfg 
      SET 
        empresa_cfg_anteced_minutos = $1,
        empresa_cfg_interv_minutos = $2,
        empresa_cfg_buffer_pre_minutos = $3,
        empresa_cfg_buffer_pos_minutos = $4
      WHERE empresa_cfg_id = (
        SELECT empresa_cfg_id FROM empresa WHERE empresa_id = $5
      )
      RETURNING *
    `, [
      config.anteced_minutos,
      config.interv_minutos,
      config.buffer_pre_minutos,
      config.buffer_pos_minutos,
      empresaId
    ])
    return result.rows[0]
  },

  // Criar profissional (usando endereço da empresa)
  async createProfissional(empresaId, profissional) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      
      // Buscar endereço da empresa
      const empresaResult = await client.query(`
        SELECT endereco_id, cep FROM empresa WHERE empresa_id = $1
      `, [empresaId])
      
      if (empresaResult.rows.length === 0) {
        throw new Error('Empresa não encontrada')
      }
      
      const { endereco_id, cep } = empresaResult.rows[0]
      
      // Criar profissional
      const result = await client.query(`
        INSERT INTO profissional (
          empresa_id,
          endereco_id,
          cep,
          profissional_nome,
          profissional_contato,
          especialidade,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, 'ativo')
        RETURNING *
      `, [
        empresaId,
        endereco_id,
        cep,
        profissional.nome,
        profissional.contato,
        profissional.especialidade || ''
      ])
      
      await client.query('COMMIT')
      return result.rows[0]
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },

  // Criar serviço (serviços são compartilhados, sem empresa_id)
  async createServico(servico) {
    const result = await pool.query(`
      INSERT INTO servicos (
        servicos_nome,
        servicos_duracao,
        servicos_valor,
        servicos_descricao,
        status
      ) VALUES ($1, $2::interval, $3, $4, 'ativo')
      RETURNING *
    `, [
      servico.servicos_nome || servico.nome,
      `${servico.servicos_duracao_minutos || servico.duracao_minutos} minutes`,
      servico.servicos_valor || servico.valor,
      servico.servicos_descricao || servico.descricao || ''
    ])
    return result.rows[0]
  },

  // Vincular serviço ao profissional
  async vincularServicoProfissional(profissionalId, servicoId, personalizacao) {
    const result = await pool.query(`
      INSERT INTO profissional_servico (
        profissional_id,
        servicos_id,
        valor_personalizado,
        duracao_personalizada,
        observacoes
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (profissional_id, servicos_id) 
      DO UPDATE SET
        valor_personalizado = EXCLUDED.valor_personalizado,
        duracao_personalizada = EXCLUDED.duracao_personalizada,
        observacoes = EXCLUDED.observacoes
      RETURNING *
    `, [
      profissionalId,
      servicoId,
      personalizacao.valor_personalizado || null,
      personalizacao.duracao_personalizada ? `${personalizacao.duracao_personalizada} minutes` : null,
      personalizacao.observacoes || ''
    ])
    return result.rows[0]
  },

  // Atualizar instância WhatsApp (UPSERT)
  async updateInstancia(empresaId, instanciaData) {
    // Sempre verificar se a empresa JÁ tem uma instância
    const existenteEmpresa = await pool.query(`
      SELECT * FROM instancia 
      WHERE empresa_id = $1 
      ORDER BY instancia_dt_atualizacao DESC
      LIMIT 1
    `, [empresaId])
    
    if (existenteEmpresa.rows.length > 0) {
      const instanciaAtual = existenteEmpresa.rows[0]
      
      // Verificar se o UUID mudou
      if (instanciaAtual.instancia_id === instanciaData.instancia_id) {
        // UUID não mudou, apenas atualizar nome e observação
        const result = await pool.query(`
          UPDATE instancia 
          SET 
            instancia_nome = $1,
            instancia_observacao = $2,
            instancia_dt_atualizacao = NOW()
          WHERE empresa_id = $3
          RETURNING *
        `, [
          instanciaData.nome,
          instanciaData.observacao || '',
          empresaId
        ])
        return result.rows[0]
      } else {
        // UUID mudou, deletar instâncias antigas e criar nova
        // Deletar TODAS as instâncias antigas da empresa
        await pool.query(`
          DELETE FROM instancia WHERE empresa_id = $1
        `, [empresaId])
        
        // Criar nova instância com o novo UUID
        const result = await pool.query(`
          INSERT INTO instancia (
            instancia_id,
            empresa_id,
            instancia_nome,
            instancia_observacao
          ) VALUES ($1, $2, $3, $4)
          RETURNING *
        `, [
          instanciaData.instancia_id,
          empresaId,
          instanciaData.nome,
          instanciaData.observacao || ''
        ])
        return result.rows[0]
      }
    } else {
      // EMPRESA NÃO TEM INSTÂNCIA: criar nova
      const result = await pool.query(`
        INSERT INTO instancia (
          instancia_id,
          empresa_id,
          instancia_nome,
          instancia_observacao
        ) VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [
        instanciaData.instancia_id,
        empresaId,
        instanciaData.nome,
        instanciaData.observacao || ''
      ])
      
      return result.rows[0]
    }
  },

  // Marcar wizard como completo
  async markWizardCompleted(empresaId) {
    await pool.query(`
      UPDATE empresa 
      SET observacoes = COALESCE(observacoes, '') || ' | Wizard concluído em ' || NOW()
      WHERE empresa_id = $1
    `, [empresaId])
  },

  // Buscar todos os dados da empresa para a tela de configurações
  async getEmpresaCompleta(empresaId) {
    // 1. Dados da empresa
    const empresa = await pool.query(`
      SELECT 
        e.*,
        en.logradouro,
        en.numero,
        en.complemento,
        en.bairro,
        en.cidade,
        en.uf,
        en.cep,
        cfg.empresa_cfg_anteced_minutos,
        cfg.empresa_cfg_interv_minutos,
        cfg.prompt_key,
        cfg.prompt_version
      FROM empresa e
      LEFT JOIN endereco en ON e.endereco_id = en.endereco_id
      LEFT JOIN empresa_cfg cfg ON e.empresa_cfg_id = cfg.empresa_cfg_id
      WHERE e.empresa_id = $1
    `, [empresaId])

    // 2. Instância WhatsApp (pegar a mais recente)
    const instancia = await pool.query(`
      SELECT * FROM instancia 
      WHERE empresa_id = $1
      ORDER BY instancia_dt_atualizacao DESC
      LIMIT 1
    `, [empresaId])

    // 3. Profissionais
    const profissionais = await pool.query(`
      SELECT 
        p.*,
        e.logradouro,
        e.numero,
        e.complemento,
        e.bairro,
        e.cidade,
        e.uf,
        e.cep,
        gc.gcalendar_id,
        gc.gcalendar_email
      FROM profissional p
      LEFT JOIN endereco e ON p.endereco_id = e.endereco_id
      LEFT JOIN gcalendar gc ON gc.profissional_id = p.profissional_id
      WHERE p.empresa_id = $1
      AND p.status = 'ativo'
      ORDER BY p.profissional_nome
    `, [empresaId])

    // 4. Serviços vinculados aos profissionais
    const servicos = await pool.query(`
      SELECT DISTINCT
        s.servicos_id,
        s.servicos_nome,
        s.servicos_valor,
        s.servicos_duracao::text as servicos_duracao,
        EXTRACT(EPOCH FROM s.servicos_duracao)/60 as servicos_duracao_minutos,
        ARRAY_AGG(DISTINCT ps.profissional_id) as profissionais_ids
      FROM servicos s
      JOIN profissional_servico ps ON s.servicos_id = ps.servicos_id
      JOIN profissional p ON ps.profissional_id = p.profissional_id
      WHERE p.empresa_id = $1
      AND s.status = 'ativo'
      AND p.status = 'ativo'
      GROUP BY s.servicos_id, s.servicos_nome, s.servicos_valor, s.servicos_duracao
      ORDER BY s.servicos_nome
    `, [empresaId])

    // 5. Horários de funcionamento
    const horarios = await pool.query(`
      SELECT DISTINCT
        hd.*,
        hf.horario_f_turno
      FROM horario_det hd
      JOIN horario_f hf ON hd.horario_f_id = hf.horario_f_id
      JOIN profissional_horario ph ON hf.horario_f_id = ph.horario_f_id
      JOIN profissional p ON ph.profissional_id = p.profissional_id
      WHERE p.empresa_id = $1
      ORDER BY hd.horario_def
    `, [empresaId])

    return {
      empresa: empresa.rows[0] || null,
      instancia: instancia.rows[0] || null,
      profissionais: profissionais.rows,
      servicos: servicos.rows,
      horarios: horarios.rows,
      configuracoes: empresa.rows[0] ? {
        empresa_cfg_anteced_minutos: empresa.rows[0].empresa_cfg_anteced_minutos,
        empresa_cfg_interv_minutos: empresa.rows[0].empresa_cfg_interv_minutos,
        prompt_key: empresa.rows[0].prompt_key,
        prompt_version: empresa.rows[0].prompt_version
      } : null
    }
  },

  // Atualizar dados da empresa
  async updateEmpresaData(empresaId, data) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // 1. Atualizar dados da empresa
      await client.query(`
        UPDATE empresa
        SET 
          empresa_nome = $1,
          empresa_contato = $2,
          empresa_contato_agente = $3,
          cep = $4,
          observacoes = $5,
          empresa_dt_atualizacao = CURRENT_TIMESTAMP
        WHERE empresa_id = $6
      `, [
        data.empresa_nome,
        data.empresa_contato,
        data.empresa_contato_agente || null,
        data.cep,
        data.observacoes || null,
        empresaId
      ])

      // 2. Atualizar endereço
      await client.query(`
        UPDATE endereco
        SET 
          logradouro = $1,
          numero = $2,
          complemento = $3,
          bairro = $4,
          cidade = $5,
          uf = $6,
          cep = $7
        WHERE endereco_id = (SELECT endereco_id FROM empresa WHERE empresa_id = $8)
      `, [
        data.logradouro,
        data.numero,
        data.complemento || null,
        data.bairro,
        data.cidade,
        data.uf,
        data.cep,
        empresaId
      ])

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },

  // Atualizar dados do serviço
  async updateServicoData(servicoId, data, empresaId = null) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Converter duração de minutos para INTERVAL
      let duracaoInterval = null
      if (data.servicos_duracao_minutos) {
        duracaoInterval = `${data.servicos_duracao_minutos} minutes`
      }

      // Processar valor: se tiver valor_formatado, desformatar; senão usar o valor direto
      let valorFinal = data.servicos_valor || data.valor || 0
      if (data.servicos_valor_formatado) {
        // Desformatar: remover pontos e trocar vírgula por ponto
        const valorString = data.servicos_valor_formatado.replace(/\./g, '').replace(',', '.')
        valorFinal = parseFloat(valorString) || 0
      }

      // Atualizar dados do serviço
      const updateResult = await client.query(`
        UPDATE servicos
        SET 
          servicos_nome = $1,
          servicos_valor = $2,
          servicos_duracao = $3::interval
        WHERE servicos_id = $4
        RETURNING *
      `, [
        data.servicos_nome || data.nome,
        valorFinal,
        duracaoInterval,
        servicoId
      ])

      // Se profissionais_ids foi fornecido, atualizar vinculações
      if (data.profissionais_ids && Array.isArray(data.profissionais_ids)) {
        // Buscar vinculações existentes
        const existingLinks = await client.query(`
          SELECT ps.profissional_id
          FROM profissional_servico ps
          JOIN profissional p ON p.profissional_id = ps.profissional_id
          WHERE ps.servicos_id = $1
            AND ($2::uuid IS NULL OR p.empresa_id = $2)
        `, [servicoId, empresaId])
        
        const existingIds = existingLinks.rows.map(row => row.profissional_id)
        const newIds = data.profissionais_ids
        
        // Identificar quais vínculos adicionar (estão em newIds mas não em existingIds)
        const toAdd = newIds.filter(id => !existingIds.includes(id))
        
        // Identificar quais vínculos remover (estão em existingIds mas não em newIds)
        const toRemove = existingIds.filter(id => !newIds.includes(id))
        
        // Adicionar novos vínculos
        for (const profissionalId of toAdd) {
          await client.query(`
            INSERT INTO profissional_servico (profissional_id, servicos_id, observacoes)
            VALUES ($1, $2, $3)
            ON CONFLICT (profissional_id, servicos_id) DO NOTHING
          `, [profissionalId, servicoId, ''])
        }
        
        // Remover vínculos antigos APENAS se não houver agendamentos associados
        for (const profissionalId of toRemove) {
          // Verificar se há agendamentos usando este vínculo
          const hasAgendamentos = await client.query(`
            SELECT COUNT(*) as count
            FROM agendamento_servico
            WHERE servicos_id = $1 AND profissional_id = $2
          `, [servicoId, profissionalId])
          
          if (parseInt(hasAgendamentos.rows[0].count) === 0) {
            // Não há agendamentos, pode deletar
            await client.query(`
              DELETE FROM profissional_servico
              WHERE servicos_id = $1 AND profissional_id = $2
            `, [servicoId, profissionalId])
          }
        }
      }

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },

  // Atualizar dados do profissional
  async updateProfissionalData(profissionalId, data) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      
      // 1. Atualizar dados do profissional
      await client.query(`
        UPDATE profissional
        SET 
          profissional_nome = $1,
          especialidade = $2,
          profissional_contato = $3
        WHERE profissional_id = $4
      `, [
        data.profissional_nome,
        data.especialidade || data.profissional_especialidade || null,
        data.profissional_contato || null,
        profissionalId
      ])
      
      // 2. Gerenciar Google Calendar
      if (data.gcalendar_id) {
        // Se tem gcalendar_id, inserir ou atualizar
        await client.query(`
          INSERT INTO gcalendar (profissional_id, gcalendar_id, gcalendar_email)
          VALUES ($1, $2, $2)
          ON CONFLICT (gcalendar_id) 
          DO UPDATE SET 
            profissional_id = EXCLUDED.profissional_id,
            gcalendar_email = EXCLUDED.gcalendar_email
        `, [profissionalId, data.gcalendar_id])
      } else {
        // Se não tem gcalendar_id, remover vínculo existente
        await client.query(`
          DELETE FROM gcalendar WHERE profissional_id = $1
        `, [profissionalId])
      }
      
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },

  // Atualizar horários de funcionamento
  async updateHorariosData(empresaId, horarios) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // 1. Buscar ou criar horario_f para a empresa
      let horarioFId
      const horarioFExistente = await client.query(`
        SELECT hf.horario_f_id
        FROM horario_f hf
        JOIN profissional_horario ph ON hf.horario_f_id = ph.horario_f_id
        JOIN profissional p ON ph.profissional_id = p.profissional_id
        WHERE p.empresa_id = $1
        LIMIT 1
      `, [empresaId])

      if (horarioFExistente.rows.length > 0) {
        horarioFId = horarioFExistente.rows[0].horario_f_id
      } else {
        // Criar novo horario_f
        const newHorarioF = await client.query(`
          INSERT INTO horario_f (horario_f_turno)
          VALUES ('Padrão')
          RETURNING horario_f_id
        `)
        horarioFId = newHorarioF.rows[0].horario_f_id

        // Vincular aos profissionais da empresa
        await client.query(`
          INSERT INTO profissional_horario (profissional_id, horario_f_id)
          SELECT profissional_id, $1
          FROM profissional
          WHERE empresa_id = $2
        `, [horarioFId, empresaId])
      }

      await assertHorarioFExclusiveToEmpresa(client, horarioFId, empresaId)

      // 2. Buscar horários existentes no banco
      const horariosExistentes = await client.query(`
        SELECT horario_det_id, horario_def, horario_det_inicio, horario_det_fim
        FROM horario_det
        WHERE horario_f_id = $1
        ORDER BY horario_def, horario_det_inicio
      `, [horarioFId])

      const horariosExistentesMap = new Map()
      horariosExistentes.rows.forEach(h => {
        horariosExistentesMap.set(h.horario_det_id, h)
      })

      // 3. Processar horários recebidos
      const diasNomes = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
      const horariosProcessados = new Set()
      
      for (const horario of horarios) {
        if (horario.horario_det_inicio && horario.horario_det_fim) {
          
          if (horario.horario_det_id && horariosExistentesMap.has(horario.horario_det_id)) {
            // Horário já existe, fazer UPDATE
            await client.query(`
              UPDATE horario_det
              SET horario_det_inicio = $1,
                  horario_det_fim = $2,
                  horario_def_nome = $3
              WHERE horario_det_id = $4
            `, [
              horario.horario_det_inicio,
              horario.horario_det_fim,
              diasNomes[horario.horario_def],
              horario.horario_det_id
            ])
            horariosProcessados.add(horario.horario_det_id)
          } else {
            // Horário novo, fazer INSERT
            await client.query(`
              INSERT INTO horario_det (
                horario_f_id,
                horario_def,
                horario_def_nome,
                horario_det_inicio,
                horario_det_fim
              ) VALUES ($1, $2, $3, $4, $5)
            `, [
              horarioFId,
              horario.horario_def,
              diasNomes[horario.horario_def],
              horario.horario_det_inicio,
              horario.horario_det_fim
            ])
          }
        }
      }

      // 4. Deletar horários que não estão mais presentes
      for (const [horarioDetId, horarioExistente] of horariosExistentesMap.entries()) {
        if (!horariosProcessados.has(horarioDetId)) {
          await client.query(`
            DELETE FROM horario_det WHERE horario_det_id = $1
          `, [horarioDetId])
        }
      }

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },

  // Excluir serviço (soft delete)
  async deleteServicoData(servicoId) {
    await pool.query(`
      UPDATE servicos
      SET status = 'inativo'
      WHERE servicos_id = $1
    `, [servicoId])
  },

  // Excluir profissional (soft delete com validações)
  async deleteProfissionalData(profissionalId) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // 1. Verificar se há serviços ativos vinculados
      const servicosAtivos = await client.query(`
        SELECT COUNT(*) as total
        FROM profissional_servico ps
        JOIN servicos s ON ps.servicos_id = s.servicos_id
        WHERE ps.profissional_id = $1
        AND s.status = 'ativo'
      `, [profissionalId])

      if (parseInt(servicosAtivos.rows[0].total) > 0) {
        throw new Error('Não é possível excluir este profissional pois há serviços ativos vinculados a ele. Desative os serviços primeiro.')
      }

      // 2. Verificar se há agendamentos (histórico)
      const agendamentos = await client.query(`
        SELECT COUNT(*) as total
        FROM agendamento
        WHERE profissional_id = $1
      `, [profissionalId])

      if (parseInt(agendamentos.rows[0].total) > 0) {
        throw new Error('Não é possível excluir este profissional pois há agendamentos históricos vinculados a ele. Os dados precisam ser preservados para relatórios.')
      }

      // 3. Se passou nas validações, fazer soft delete
      await client.query(`
        UPDATE profissional
        SET status = 'inativo'
        WHERE profissional_id = $1
      `, [profissionalId])

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },

  // Buscar todos os prompts disponíveis
  async getAllPrompts() {
    const result = await pool.query(`
      SELECT DISTINCT key as prompt_key
      FROM ai_prompt_templates
      ORDER BY key
    `)
    return result.rows
  },

  // Buscar versões de um prompt específico
  async getPromptVersions(promptKey) {
    const result = await pool.query(`
      SELECT version as prompt_version
      FROM ai_prompt_templates
      WHERE key = $1
      ORDER BY version DESC
    `, [promptKey])
    return result.rows
  },

  // Atualizar prompt e versão da empresa
  async updateEmpresaPrompt(empresaId, promptKey, promptVersion) {
    await pool.query(`
      UPDATE empresa_cfg
      SET 
        prompt_key = $1,
        prompt_version = $2
      WHERE empresa_cfg_id = (
        SELECT empresa_cfg_id 
        FROM empresa 
        WHERE empresa_id = $3
      )
    `, [promptKey, promptVersion, empresaId])
  },

  // Buscar usuários de uma empresa
  async getUsuariosByEmpresa(empresaId) {
    const result = await pool.query(`
      SELECT 
        l.login_id,
        l.nome,
        l.login,
        l.email,
        l.nivel_acesso_id,
        l.created,
        na.nivel_acesso_ as nivel_acesso_nome
      FROM login l
      LEFT JOIN nivel_acesso na ON l.nivel_acesso_id = na.nivel_acesso_id
      WHERE l.empresa_id = $1
      ORDER BY l.nome
    `, [empresaId])
    return result.rows
  },

  // Buscar níveis de acesso disponíveis
  async getNiveisAcesso() {
    const result = await pool.query(`
      SELECT 
        nivel_acesso_id,
        nivel_acesso_
      FROM nivel_acesso
      ORDER BY nivel_acesso_
    `)
    return result.rows
  },

  // Criar novo usuário
  async createUsuario(empresaId, userData) {
    const result = await pool.query(`
      INSERT INTO login (
        login_id,
        empresa_id,
        nivel_acesso_id,
        nome,
        login,
        email,
        senha
      ) VALUES (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        $4,
        $5,
        $6
      )
      RETURNING login_id, nome, login, email, nivel_acesso_id, created
    `, [
      empresaId,
      userData.nivel_acesso_id,
      userData.nome,
      userData.login,
      userData.email,
      userData.senha
    ])
    return result.rows[0]
  },

  // Atualizar usuário
  async updateUsuario(loginId, userData) {
    const entries = Object.entries(USUARIO_UPDATE_COLUMNS)
      .filter(([field]) => Object.prototype.hasOwnProperty.call(userData || {}, field))

    if (entries.length === 0) {
      return null
    }

    const setClauses = entries.map(([, column], index) => `${column} = $${index + 1}`)
    const values = entries.map(([field]) => userData[field])
    values.push(loginId)

    const result = await pool.query(`
      UPDATE login
      SET ${setClauses.join(', ')}
      WHERE login_id = $${values.length}
      RETURNING login_id, nome, login, email, nivel_acesso_id, created
    `, values)
    return result.rows[0]
  },

  // Atualizar senha do usuário
  async updateSenhaUsuario(loginId, novaSenha) {
    await pool.query(`
      UPDATE login
      SET senha = $1
      WHERE login_id = $2
    `, [novaSenha, loginId])
  },

  // Excluir usuário
  async deleteUsuario(loginId) {
    await pool.query(`
      DELETE FROM login
      WHERE login_id = $1
    `, [loginId])
  }
}
