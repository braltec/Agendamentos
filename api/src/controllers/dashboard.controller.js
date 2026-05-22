import pool from '../config/database.js'
import { dashboardModel } from '../models/dashboard.model.js'

const SUPER_ADMIN_ID = '550e8400-e29b-41d4-a716-446655440012'

// Buscar dados executivos da aba Visão Geral
export async function getVisaoGeral(req, res) {
  try {
    const empresaId = req.user.empresa_id
    const nivelAcessoId = req.user.nivel_acesso_id
    const isSuperAdmin = nivelAcessoId === SUPER_ADMIN_ID

    const data = await dashboardModel.getVisaoGeral({
      empresaId,
      isSuperAdmin,
    })

    res.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Erro ao buscar visão geral do dashboard:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar visão geral do dashboard',
    })
  }
}

// Buscar cards operacionais da aba Gestão de Agenda
export async function getGestaoAgenda(req, res) {
  try {
    const empresaId = req.user.empresa_id
    const nivelAcessoId = req.user.nivel_acesso_id
    const isSuperAdmin = nivelAcessoId === SUPER_ADMIN_ID

    const data = await dashboardModel.getGestaoAgenda({
      empresaId,
      isSuperAdmin,
    })

    res.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Erro ao buscar gestão de agenda do dashboard:', error)
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar gestão de agenda do dashboard',
    })
  }
}

// Buscar estatísticas do dashboard
export async function getDashboardStats(req, res) {
  try {
    const empresaId = req.user.empresa_id
    const nivelAcessoId = req.user.nivel_acesso_id
    const isSuperAdmin = nivelAcessoId === SUPER_ADMIN_ID
    const hoje = new Date().toISOString().split('T')[0]
    
    console.log('📊 getDashboardStats:')
    console.log('   empresa_id:', empresaId)
    console.log('   nivel_acesso_id:', nivelAcessoId)
    console.log('   isSuperAdmin:', isSuperAdmin)
    console.log('   hoje:', hoje)
    
    // Construir condição WHERE baseado no tipo de usuário
    const whereClause = isSuperAdmin ? '' : 'WHERE empresa_id = $1'
    const whereClauseAnd = isSuperAdmin ? 'WHERE' : 'AND'
    const params = isSuperAdmin ? [hoje] : [empresaId, hoje]
    const paramsWithoutDate = isSuperAdmin ? [] : [empresaId]
    
    // 1. Agendamentos de hoje
    let agendamentosHoje
    if (isSuperAdmin) {
      agendamentosHoje = await pool.query(`
        SELECT COUNT(*) as total
        FROM agendamento
        WHERE agend_data = $1
      `, [hoje])
    } else {
      agendamentosHoje = await pool.query(`
        SELECT COUNT(*) as total
        FROM agendamento
        WHERE empresa_id = $1
        AND agend_data = $2
      `, [empresaId, hoje])
    }
    
    // 2. Clientes ativos (que fizeram agendamento nos últimos 90 dias)
    let clientesAtivos
    if (isSuperAdmin) {
      clientesAtivos = await pool.query(`
        SELECT COUNT(DISTINCT clientes_id) as total
        FROM agendamento
        WHERE agend_data >= CURRENT_DATE - INTERVAL '90 days'
      `)
    } else {
      clientesAtivos = await pool.query(`
        SELECT COUNT(DISTINCT clientes_id) as total
        FROM agendamento
        WHERE empresa_id = $1
        AND agend_data >= CURRENT_DATE - INTERVAL '90 days'
      `, [empresaId])
    }
    
    // 3. Serviços realizados este mês (excluindo cancelados)
    let servicosRealizados
    if (isSuperAdmin) {
      servicosRealizados = await pool.query(`
        SELECT COUNT(*) as total
        FROM agendamento
        WHERE EXTRACT(MONTH FROM agend_data) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM agend_data) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND status_agend_id NOT IN (
          SELECT status_agend_id FROM status_agend 
          WHERE LOWER(status_agend_nome) LIKE '%cancelado%'
        )
      `)
    } else {
      servicosRealizados = await pool.query(`
        SELECT COUNT(*) as total
        FROM agendamento
        WHERE empresa_id = $1
        AND EXTRACT(MONTH FROM agend_data) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM agend_data) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND status_agend_id NOT IN (
          SELECT status_agend_id FROM status_agend 
          WHERE LOWER(status_agend_nome) LIKE '%cancelado%'
        )
      `, [empresaId])
    }
    
    // 4. Receita do mês (excluindo cancelados)
    let receitaMes
    if (isSuperAdmin) {
      receitaMes = await pool.query(`
        SELECT COALESCE(SUM(agend_valor), 0) as total
        FROM agendamento
        WHERE EXTRACT(MONTH FROM agend_data) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM agend_data) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND status_agend_id NOT IN (
          SELECT status_agend_id FROM status_agend 
          WHERE LOWER(status_agend_nome) LIKE '%cancelado%'
        )
      `)
    } else {
      receitaMes = await pool.query(`
        SELECT COALESCE(SUM(agend_valor), 0) as total
        FROM agendamento
        WHERE empresa_id = $1
        AND EXTRACT(MONTH FROM agend_data) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM agend_data) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND status_agend_id NOT IN (
          SELECT status_agend_id FROM status_agend 
          WHERE LOWER(status_agend_nome) LIKE '%cancelado%'
        )
      `, [empresaId])
    }
    
    res.json({
      success: true,
      data: {
        agendamentosHoje: parseInt(agendamentosHoje.rows[0].total),
        clientesAtivos: parseInt(clientesAtivos.rows[0].total),
        servicosRealizados: parseInt(servicosRealizados.rows[0].total),
        receitaMes: parseFloat(receitaMes.rows[0].total)
      }
    })
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error.message)
    console.error('   Stack:', error.stack)
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar estatísticas do dashboard',
      error: error.message
    })
  }
}

// Buscar próximos agendamentos
export async function getProximosAgendamentos(req, res) {
  try {
    const empresaId = req.user.empresa_id
    const nivelAcessoId = req.user.nivel_acesso_id
    const isSuperAdmin = nivelAcessoId === SUPER_ADMIN_ID
    
    let agendamentos
    if (isSuperAdmin) {
      agendamentos = await pool.query(`
        SELECT 
          a.agend_id,
          a.agend_data,
          a.agend_inicio,
          c.clientes_nome,
          p.profissional_nome,
          e.empresa_nome,
          s.status_agend_nome,
          STRING_AGG(srv.servicos_nome, ', ') as servicos
        FROM agendamento a
        JOIN clientes c ON a.clientes_id = c.clientes_id
        JOIN profissional p ON a.profissional_id = p.profissional_id
        JOIN empresa e ON a.empresa_id = e.empresa_id
        JOIN status_agend s ON a.status_agend_id = s.status_agend_id
        LEFT JOIN agendamento_servico ags ON a.agend_id = ags.agend_id
        LEFT JOIN servicos srv ON ags.servicos_id = srv.servicos_id
        WHERE a.agend_data >= CURRENT_DATE
        AND a.agend_inicio >= NOW()
        GROUP BY a.agend_id, a.agend_data, a.agend_inicio, c.clientes_nome, 
                 p.profissional_nome, e.empresa_nome, s.status_agend_nome
        ORDER BY a.agend_inicio
        LIMIT 10
      `)
    } else {
      agendamentos = await pool.query(`
        SELECT 
          a.agend_id,
          a.agend_data,
          a.agend_inicio,
          c.clientes_nome,
          p.profissional_nome,
          e.empresa_nome,
          s.status_agend_nome,
          STRING_AGG(srv.servicos_nome, ', ') as servicos
        FROM agendamento a
        JOIN clientes c ON a.clientes_id = c.clientes_id
        JOIN profissional p ON a.profissional_id = p.profissional_id
        JOIN empresa e ON a.empresa_id = e.empresa_id
        JOIN status_agend s ON a.status_agend_id = s.status_agend_id
        LEFT JOIN agendamento_servico ags ON a.agend_id = ags.agend_id
        LEFT JOIN servicos srv ON ags.servicos_id = srv.servicos_id
        WHERE a.empresa_id = $1
        AND a.agend_data >= CURRENT_DATE
        AND a.agend_inicio >= NOW()
        GROUP BY a.agend_id, a.agend_data, a.agend_inicio, c.clientes_nome, 
                 p.profissional_nome, e.empresa_nome, s.status_agend_nome
        ORDER BY a.agend_inicio
        LIMIT 5
      `, [empresaId])
    }
    
    res.json({
      success: true,
      data: agendamentos.rows
    })
  } catch (error) {
    console.error('❌ Erro ao buscar agendamentos:', error.message)
    console.error('   Stack:', error.stack)
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar próximos agendamentos',
      error: error.message
    })
  }
}

// Buscar profissionais e seus agendamentos de hoje
export async function getProfissionaisHoje(req, res) {
  try {
    const empresaId = req.user.empresa_id
    const nivelAcessoId = req.user.nivel_acesso_id
    const isSuperAdmin = nivelAcessoId === SUPER_ADMIN_ID
    const hoje = new Date().toISOString().split('T')[0]
    
    console.log('👥 getProfissionaisHoje:')
    console.log('   empresa_id:', empresaId)
    console.log('   nivel_acesso_id:', nivelAcessoId)
    console.log('   isSuperAdmin:', isSuperAdmin)
    console.log('   hoje:', hoje)
    
    let profissionais
    if (isSuperAdmin) {
      profissionais = await pool.query(`
        SELECT 
          p.profissional_id,
          p.profissional_nome,
          p.especialidade as profissional_especialidade,
          e.empresa_nome,
          COUNT(a.agend_id) as agendamentos_hoje
        FROM profissional p
        JOIN empresa e ON p.empresa_id = e.empresa_id
        LEFT JOIN agendamento a ON p.profissional_id = a.profissional_id 
          AND a.agend_data = $1
        WHERE p.status = 'ativo'
        GROUP BY p.profissional_id, p.profissional_nome, p.especialidade, e.empresa_nome
        ORDER BY agendamentos_hoje DESC, p.profissional_nome
        LIMIT 10
      `, [hoje])
    } else {
      profissionais = await pool.query(`
        SELECT 
          p.profissional_id,
          p.profissional_nome,
          p.especialidade as profissional_especialidade,
          e.empresa_nome,
          COUNT(a.agend_id) as agendamentos_hoje
        FROM profissional p
        JOIN empresa e ON p.empresa_id = e.empresa_id
        LEFT JOIN agendamento a ON p.profissional_id = a.profissional_id 
          AND a.agend_data = $2
        WHERE p.empresa_id = $1
        AND p.status = 'ativo'
        GROUP BY p.profissional_id, p.profissional_nome, p.especialidade, e.empresa_nome
        ORDER BY agendamentos_hoje DESC, p.profissional_nome
        LIMIT 5
      `, [empresaId, hoje])
    }
    
    res.json({
      success: true,
      data: profissionais.rows
    })
  } catch (error) {
    console.error('❌ Erro ao buscar profissionais:', error.message)
    console.error('   Stack:', error.stack)
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar profissionais',
      error: error.message
    })
  }
}

// Buscar dados do gráfico de agendamentos vs cancelamentos por dia
export async function getGraficoAgendamentos(req, res) {
  try {
    const empresaId = req.user.empresa_id
    const nivelAcessoId = req.user.nivel_acesso_id
    const isSuperAdmin = nivelAcessoId === SUPER_ADMIN_ID
    
    let resultado
    if (isSuperAdmin) {
      resultado = await pool.query(`
        SELECT 
          agend_data,
          COUNT(CASE WHEN status_agend_id NOT IN (
            SELECT status_agend_id FROM status_agend 
            WHERE LOWER(status_agend_nome) LIKE '%cancelado%'
          ) THEN 1 END) as agendamentos,
          COUNT(CASE WHEN status_agend_id IN (
            SELECT status_agend_id FROM status_agend 
            WHERE LOWER(status_agend_nome) LIKE '%cancelado%'
          ) THEN 1 END) as cancelamentos
        FROM agendamento
        WHERE EXTRACT(MONTH FROM agend_data) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM agend_data) = EXTRACT(YEAR FROM CURRENT_DATE)
        GROUP BY agend_data
        ORDER BY agend_data
      `)
    } else {
      resultado = await pool.query(`
        SELECT 
          agend_data,
          COUNT(CASE WHEN status_agend_id NOT IN (
            SELECT status_agend_id FROM status_agend 
            WHERE LOWER(status_agend_nome) LIKE '%cancelado%'
          ) THEN 1 END) as agendamentos,
          COUNT(CASE WHEN status_agend_id IN (
            SELECT status_agend_id FROM status_agend 
            WHERE LOWER(status_agend_nome) LIKE '%cancelado%'
          ) THEN 1 END) as cancelamentos
        FROM agendamento
        WHERE empresa_id = $1
        AND EXTRACT(MONTH FROM agend_data) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM agend_data) = EXTRACT(YEAR FROM CURRENT_DATE)
        GROUP BY agend_data
        ORDER BY agend_data
      `, [empresaId])
    }
    
    // Formatar dados para o gráfico
    const dados = resultado.rows.map(row => ({
      data: row.agend_data,
      dia: new Date(row.agend_data).getDate(),
      agendamentos: parseInt(row.agendamentos),
      cancelamentos: parseInt(row.cancelamentos)
    }))
    
    res.json({
      success: true,
      data: dados
    })
  } catch (error) {
    console.error('❌ Erro ao buscar dados do gráfico:', error.message)
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar dados do gráfico',
      error: error.message
    })
  }
}

// Buscar estatísticas por empresa (apenas para Super Admin)
export async function getEstatisticasPorEmpresa(req, res) {
  try {
    const nivelAcessoId = req.user.nivel_acesso_id
    const isSuperAdmin = nivelAcessoId === SUPER_ADMIN_ID
    
    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas Super Admin pode acessar esta funcionalidade.'
      })
    }
    
    const estatisticas = await pool.query(`
      SELECT 
        e.empresa_id,
        e.empresa_nome,
        COUNT(DISTINCT CASE WHEN a.agend_data = CURRENT_DATE THEN a.agend_id END) as agendamentos_hoje,
        COUNT(DISTINCT CASE WHEN a.agend_data >= CURRENT_DATE - INTERVAL '90 days' THEN a.clientes_id END) as clientes_ativos,
        COUNT(DISTINCT CASE 
          WHEN EXTRACT(MONTH FROM a.agend_data) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM a.agend_data) = EXTRACT(YEAR FROM CURRENT_DATE)
          AND a.status_agend_id NOT IN (
            SELECT status_agend_id FROM status_agend 
            WHERE LOWER(status_agend_nome) LIKE '%cancelado%'
          )
          THEN a.agend_id 
        END) as servicos_realizados_mes,
        COALESCE(SUM(CASE 
          WHEN EXTRACT(MONTH FROM a.agend_data) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM a.agend_data) = EXTRACT(YEAR FROM CURRENT_DATE)
          AND a.status_agend_id NOT IN (
            SELECT status_agend_id FROM status_agend 
            WHERE LOWER(status_agend_nome) LIKE '%cancelado%'
          )
          THEN a.agend_valor 
          ELSE 0
        END), 0) as receita_mes,
        COUNT(DISTINCT p.profissional_id) as total_profissionais
      FROM empresa e
      LEFT JOIN agendamento a ON e.empresa_id = a.empresa_id
      LEFT JOIN profissional p ON e.empresa_id = p.empresa_id AND p.status = 'ativo'
      GROUP BY e.empresa_id, e.empresa_nome
      ORDER BY receita_mes DESC, e.empresa_nome
    `)
    
    res.json({
      success: true,
      data: estatisticas.rows
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas por empresa:', error)
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar estatísticas por empresa' 
    })
  }
}
