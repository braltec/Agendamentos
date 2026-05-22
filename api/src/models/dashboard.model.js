import pool from '../config/database.js'

const TIMEZONE = 'America/Sao_Paulo'

function scopedAnd(alias, isSuperAdmin) {
  return isSuperAdmin ? '' : `AND ${alias}.empresa_id = $1`
}

function scopedParams(empresaId, isSuperAdmin) {
  return isSuperAdmin ? [] : [empresaId]
}

function baseCtes(isSuperAdmin) {
  return `
    WITH periodo AS (
      SELECT
        (CURRENT_TIMESTAMP AT TIME ZONE '${TIMEZONE}')::date AS hoje,
        CURRENT_TIMESTAMP AS agora,
        date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE '${TIMEZONE}')::date AS inicio_mes,
        (date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE '${TIMEZONE}') + INTERVAL '1 month')::date AS fim_mes
    ),
    status_classificado AS (
      SELECT
        status_agend_id,
        status_agend_nome,
        LOWER(status_agend_nome) LIKE '%cancel%' AS cancelado
      FROM status_agend
    ),
    agendamentos_mes AS (
      SELECT
        a.agend_id,
        a.empresa_id,
        a.profissional_id,
        a.clientes_id,
        a.agend_data,
        a.agend_created_at,
        a.agend_inicio,
        a.agend_fim,
        a.agend_valor,
        sc.status_agend_nome,
        sc.cancelado
      FROM agendamento a
      JOIN periodo p ON true
      JOIN status_classificado sc ON sc.status_agend_id = a.status_agend_id
      WHERE a.agend_data >= p.inicio_mes
        AND a.agend_data < p.fim_mes
        ${scopedAnd('a', isSuperAdmin)}
    ),
    receita_servicos AS (
      SELECT
        ags.agend_id,
        SUM(ags.valor_aplicado)::numeric AS valor_servicos
      FROM agendamento_servico ags
      JOIN agendamentos_mes a ON a.agend_id = ags.agend_id
      GROUP BY ags.agend_id
    ),
    valores_agendamento AS (
      SELECT
        a.agend_id,
        a.empresa_id,
        a.profissional_id,
        a.clientes_id,
        a.agend_data,
        a.agend_created_at,
        a.agend_inicio,
        a.agend_fim,
        a.status_agend_nome,
        a.cancelado,
        NOT a.cancelado AS ativo,
        (NOT a.cancelado AND a.agend_inicio <= (SELECT agora FROM periodo)) AS realizado,
        (NOT a.cancelado AND a.agend_inicio > (SELECT agora FROM periodo)) AS previsto,
        COALESCE(rs.valor_servicos, a.agend_valor, 0)::numeric AS valor_total,
        GREATEST(
          COALESCE(EXTRACT(EPOCH FROM (a.agend_fim - a.agend_inicio)) / 3600.0, 0),
          0
        )::numeric AS horas_agendadas
      FROM agendamentos_mes a
      LEFT JOIN receita_servicos rs ON rs.agend_id = a.agend_id
    )
  `
}

function toInt(value) {
  return parseInt(value || 0, 10)
}

function toNumber(value) {
  return Number(value || 0)
}

function toNullableNumber(value) {
  return value === null || value === undefined ? null : Number(value)
}

function toDateString(value) {
  if (!value) return null
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

function toTimestamp(value) {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  return value
}

async function getResumo(empresaId, isSuperAdmin) {
  const result = await pool.query(`
    ${baseCtes(isSuperAdmin)},
    contagens AS (
      SELECT
        COUNT(DISTINCT agend_id) AS agendamentos_mes_total,
        COUNT(DISTINCT agend_id) FILTER (WHERE ativo) AS agendamentos_mes_ativos,
        COUNT(DISTINCT agend_id) FILTER (WHERE cancelado) AS agendamentos_mes_cancelados,
        COUNT(DISTINCT agend_id) FILTER (WHERE realizado) AS agendamentos_mes_realizados,
        COUNT(DISTINCT agend_id) FILTER (WHERE previsto) AS agendamentos_mes_previstos,
        COUNT(DISTINCT agend_id) FILTER (WHERE agend_data = (SELECT hoje FROM periodo) AND ativo) AS agendamentos_hoje,
        COALESCE(SUM(valor_total) FILTER (WHERE previsto), 0) AS receita_prevista_mes,
        COALESCE(SUM(valor_total) FILTER (WHERE realizado), 0) AS receita_realizada_mes,
        COALESCE(SUM(horas_agendadas) FILTER (WHERE NOT cancelado), 0) AS horas_agendadas_mes
      FROM valores_agendamento
    ),
    clientes_novos AS (
      SELECT COUNT(*) AS total
      FROM clientes c
      JOIN periodo p ON true
      WHERE (c.clientes_dt_criacao AT TIME ZONE '${TIMEZONE}')::date >= p.inicio_mes
        AND (c.clientes_dt_criacao AT TIME ZONE '${TIMEZONE}')::date < p.fim_mes
        ${scopedAnd('c', isSuperAdmin)}
    ),
    clientes_recorrentes AS (
      SELECT COUNT(*) AS total
      FROM (
        SELECT clientes_id
        FROM valores_agendamento
        WHERE NOT cancelado
        GROUP BY clientes_id
        HAVING COUNT(DISTINCT agend_id) >= 2
      ) recorrentes
    ),
    servicos_realizados AS (
      SELECT COUNT(*) AS total
      FROM agendamento_servico ags
      JOIN valores_agendamento v ON v.agend_id = ags.agend_id
      WHERE v.realizado
    ),
    dias_mes AS (
      SELECT generate_series(
        (SELECT inicio_mes FROM periodo),
        (SELECT fim_mes FROM periodo) - INTERVAL '1 day',
        INTERVAL '1 day'
      )::date AS dia
    ),
    horas_disponiveis AS (
      SELECT COALESCE(
        SUM(EXTRACT(EPOCH FROM (hd.horario_det_fim - hd.horario_det_inicio)) / 3600.0),
        0
      ) AS total
      FROM dias_mes d
      JOIN profissional prof
        ON prof.status = 'ativo'
        ${scopedAnd('prof', isSuperAdmin)}
      JOIN profissional_horario ph ON ph.profissional_id = prof.profissional_id
      JOIN horario_det hd ON hd.horario_f_id = ph.horario_f_id
      WHERE hd.horario_def = EXTRACT(DOW FROM d.dia)::int
        OR (hd.horario_def = 7 AND EXTRACT(DOW FROM d.dia)::int = 0)
    )
    SELECT
      (SELECT hoje FROM periodo) AS hoje,
      (SELECT inicio_mes FROM periodo) AS inicio_mes,
      (SELECT fim_mes FROM periodo) AS fim_mes,
      '${TIMEZONE}' AS timezone,
      true AS receita_realizada_disponivel,
      true AS servicos_realizados_disponivel,
      c.agendamentos_hoje,
      c.agendamentos_mes_total,
      c.agendamentos_mes_ativos,
      c.agendamentos_mes_cancelados,
      c.agendamentos_mes_realizados,
      c.agendamentos_mes_previstos,
      c.receita_prevista_mes,
      c.receita_realizada_mes,
      CASE
        WHEN c.agendamentos_mes_realizados > 0
          THEN ROUND(c.receita_realizada_mes / c.agendamentos_mes_realizados, 2)
        WHEN c.agendamentos_mes_previstos > 0
          THEN ROUND(c.receita_prevista_mes / c.agendamentos_mes_previstos, 2)
        ELSE 0
      END AS ticket_medio,
      CASE
        WHEN c.agendamentos_mes_realizados > 0 THEN 'realizada'
        ELSE 'prevista'
      END AS ticket_medio_base,
      cn.total AS clientes_novos_mes,
      cr.total AS clientes_recorrentes_mes,
      CASE
        WHEN c.agendamentos_mes_total > 0
          THEN ROUND((c.agendamentos_mes_cancelados::numeric / c.agendamentos_mes_total::numeric) * 100, 1)
        ELSE 0
      END AS taxa_cancelamento_mes,
      CASE
        WHEN hd.total > 0
          THEN ROUND((c.horas_agendadas_mes / hd.total) * 100, 1)
        ELSE NULL
      END AS taxa_ocupacao_estimada,
      hd.total > 0 AS ocupacao_calculavel,
      sr.total AS servicos_realizados_mes
    FROM contagens c
    CROSS JOIN clientes_novos cn
    CROSS JOIN clientes_recorrentes cr
    CROSS JOIN servicos_realizados sr
    CROSS JOIN horas_disponiveis hd
  `, scopedParams(empresaId, isSuperAdmin))

  const row = result.rows[0] || {}

  return {
    periodo: {
      hoje: toDateString(row.hoje),
      inicioMes: toDateString(row.inicio_mes),
      fimMes: toDateString(row.fim_mes),
      timezone: row.timezone || TIMEZONE,
    },
    cards: {
      agendamentosHoje: toInt(row.agendamentos_hoje),
      agendamentosMes: toInt(row.agendamentos_mes_total),
      agendamentosMesAtivos: toInt(row.agendamentos_mes_ativos),
      agendamentosMesCancelados: toInt(row.agendamentos_mes_cancelados),
      agendamentosMesRealizados: toInt(row.agendamentos_mes_realizados),
      agendamentosMesPrevistos: toInt(row.agendamentos_mes_previstos),
      receitaPrevistaMes: toNumber(row.receita_prevista_mes),
      receitaRealizadaMes: toNumber(row.receita_realizada_mes),
      receitaRealizadaDisponivel: Boolean(row.receita_realizada_disponivel),
      ticketMedio: toNumber(row.ticket_medio),
      ticketMedioBase: row.ticket_medio_base || 'prevista',
      clientesNovosMes: toInt(row.clientes_novos_mes),
      clientesRecorrentesMes: toInt(row.clientes_recorrentes_mes),
      taxaCancelamentoMes: toNumber(row.taxa_cancelamento_mes),
      taxaOcupacaoEstimada: toNullableNumber(row.taxa_ocupacao_estimada),
      ocupacaoCalculavel: Boolean(row.ocupacao_calculavel),
      servicosRealizadosMes: toInt(row.servicos_realizados_mes),
      servicosRealizadosDisponivel: Boolean(row.servicos_realizados_disponivel),
    },
  }
}

async function getEvolucaoDiaria(empresaId, isSuperAdmin) {
  const result = await pool.query(`
    ${baseCtes(isSuperAdmin)},
    status_flags AS (
      SELECT EXISTS (
        SELECT 1
        FROM status_agend
        WHERE LOWER(status_agend_nome) LIKE '%agend%'
          OR LOWER(status_agend_nome) LIKE '%confirm%'
          OR LOWER(status_agend_nome) LIKE '%avis%'
      ) AS has_status_ativo_agenda
    ),
    evolucao_base AS (
      SELECT
        v.*,
        (
          NOT v.cancelado
          AND (
            LOWER(v.status_agend_nome) LIKE '%agend%'
            OR LOWER(v.status_agend_nome) LIKE '%confirm%'
            OR LOWER(v.status_agend_nome) LIKE '%avis%'
            OR NOT (SELECT has_status_ativo_agenda FROM status_flags)
          )
        ) AS status_ativo_agenda,
        (
          NOT v.cancelado
          AND (
            LOWER(v.status_agend_nome) LIKE '%conclu%'
            OR LOWER(v.status_agend_nome) LIKE '%realiz%'
            OR LOWER(v.status_agend_nome) LIKE '%finaliz%'
            OR LOWER(v.status_agend_nome) LIKE '%pago%'
            OR LOWER(v.status_agend_nome) LIKE '%recebid%'
          )
        ) AS status_recebido
      FROM valores_agendamento v
    )
    SELECT
      d.dia::date AS data,
      EXTRACT(DAY FROM d.dia)::int AS dia,
      COALESCE(COUNT(DISTINCT v.agend_id) FILTER (WHERE v.status_ativo_agenda), 0) AS agendamentos,
      COALESCE(COUNT(DISTINCT v.agend_id) FILTER (WHERE v.cancelado), 0) AS cancelamentos,
      -- Valores recebidos dependem de status financeiro/de conclusão confiável.
      -- Se não houver status como Concluído, Realizado, Finalizado ou Pago,
      -- a métrica permanece zerada para não inventar recebimento.
      COALESCE(SUM(v.valor_total) FILTER (WHERE v.status_recebido), 0) AS valor_recebido,
      COALESCE(SUM(v.valor_total) FILTER (WHERE v.status_ativo_agenda), 0) AS valor_a_receber
    FROM generate_series(
      (SELECT inicio_mes FROM periodo),
      (SELECT fim_mes FROM periodo) - INTERVAL '1 day',
      INTERVAL '1 day'
    ) d(dia)
    LEFT JOIN evolucao_base v ON v.agend_data = d.dia::date
    GROUP BY d.dia
    ORDER BY d.dia
  `, scopedParams(empresaId, isSuperAdmin))

  return result.rows.map((row) => ({
    data: toDateString(row.data),
    dia: toInt(row.dia),
    agendamentos: toInt(row.agendamentos),
    cancelamentos: toInt(row.cancelamentos),
    valorRecebido: toNumber(row.valor_recebido),
    valorAReceber: toNumber(row.valor_a_receber),
    receitaRealizada: toNumber(row.valor_recebido),
    receitaPrevista: toNumber(row.valor_a_receber),
  }))
}

async function getServicosResumo(empresaId, isSuperAdmin) {
  const result = await pool.query(`
    ${baseCtes(isSuperAdmin)},
    servicos_mes AS (
      SELECT
        srv.servicos_id,
        srv.servicos_nome,
        v.cancelado,
        v.ativo,
        v.realizado,
        v.previsto,
        COALESCE(ags.valor_aplicado, 0)::numeric AS valor_aplicado
      FROM valores_agendamento v
      JOIN agendamento_servico ags ON ags.agend_id = v.agend_id
      JOIN servicos srv ON srv.servicos_id = ags.servicos_id
    )
    SELECT
      servicos_id,
      servicos_nome,
      COUNT(*) FILTER (WHERE realizado) AS quantidade_realizada,
      COUNT(*) FILTER (WHERE previsto) AS quantidade_agendada,
      COUNT(*) FILTER (WHERE NOT cancelado) AS quantidade_nao_cancelada,
      COALESCE(SUM(valor_aplicado) FILTER (WHERE realizado), 0) AS receita_realizada,
      COALESCE(SUM(valor_aplicado) FILTER (WHERE previsto), 0) AS receita_prevista,
      COALESCE(SUM(valor_aplicado) FILTER (WHERE NOT cancelado), 0) AS receita_nao_cancelada
    FROM servicos_mes
    GROUP BY servicos_id, servicos_nome
  `, scopedParams(empresaId, isSuperAdmin))

  return result.rows.map((row) => ({
    servicosId: row.servicos_id,
    servicosNome: row.servicos_nome,
    quantidadeRealizada: toInt(row.quantidade_realizada),
    quantidadeAgendada: toInt(row.quantidade_agendada),
    quantidadeNaoCancelada: toInt(row.quantidade_nao_cancelada),
    receitaRealizada: toNumber(row.receita_realizada),
    receitaPrevista: toNumber(row.receita_prevista),
    receitaNaoCancelada: toNumber(row.receita_nao_cancelada),
  }))
}

async function getAgendamentosPorDiaSemana(empresaId, isSuperAdmin) {
  const result = await pool.query(`
    ${baseCtes(isSuperAdmin)},
    dias_semana(dia, nome, nome_curto, ordem) AS (
      VALUES
        (0, 'Domingo', 'Dom', 7),
        (1, 'Segunda-feira', 'Seg', 1),
        (2, 'Terça-feira', 'Ter', 2),
        (3, 'Quarta-feira', 'Qua', 3),
        (4, 'Quinta-feira', 'Qui', 4),
        (5, 'Sexta-feira', 'Sex', 5),
        (6, 'Sábado', 'Sáb', 6)
    )
    SELECT
      d.nome,
      d.nome_curto,
      d.ordem,
      COALESCE(COUNT(DISTINCT v.agend_id) FILTER (WHERE NOT v.cancelado), 0) AS quantidade
    FROM dias_semana d
    LEFT JOIN valores_agendamento v ON EXTRACT(DOW FROM v.agend_data)::int = d.dia
    GROUP BY d.nome, d.nome_curto, d.ordem
    ORDER BY d.ordem
  `, scopedParams(empresaId, isSuperAdmin))

  return result.rows.map((row) => ({
    nome: row.nome,
    nomeCurto: row.nome_curto,
    ordem: toInt(row.ordem),
    quantidade: toInt(row.quantidade),
  }))
}

async function getAgendamentosPorFaixaHorario(empresaId, isSuperAdmin) {
  const result = await pool.query(`
    ${baseCtes(isSuperAdmin)},
    faixas(faixa, ordem) AS (
      VALUES
        ('Madrugada', 1),
        ('Manhã', 2),
        ('Tarde', 3),
        ('Noite', 4)
    ),
    agendamentos_faixa AS (
      SELECT
        agend_id,
        CASE
          WHEN EXTRACT(HOUR FROM agend_inicio AT TIME ZONE '${TIMEZONE}') BETWEEN 6 AND 11 THEN 'Manhã'
          WHEN EXTRACT(HOUR FROM agend_inicio AT TIME ZONE '${TIMEZONE}') BETWEEN 12 AND 17 THEN 'Tarde'
          WHEN EXTRACT(HOUR FROM agend_inicio AT TIME ZONE '${TIMEZONE}') BETWEEN 18 AND 23 THEN 'Noite'
          ELSE 'Madrugada'
        END AS faixa
      FROM valores_agendamento
      WHERE NOT cancelado
    )
    SELECT
      f.faixa,
      f.ordem,
      COALESCE(COUNT(DISTINCT a.agend_id), 0) AS quantidade
    FROM faixas f
    LEFT JOIN agendamentos_faixa a ON a.faixa = f.faixa
    GROUP BY f.faixa, f.ordem
    ORDER BY f.ordem
  `, scopedParams(empresaId, isSuperAdmin))

  return result.rows.map((row) => ({
    faixa: row.faixa,
    ordem: toInt(row.ordem),
    quantidade: toInt(row.quantidade),
  }))
}

async function getProximosAgendamentos(empresaId, isSuperAdmin) {
  const result = await pool.query(`
    WITH status_classificado AS (
      SELECT
        status_agend_id,
        status_agend_nome,
        LOWER(status_agend_nome) LIKE '%cancel%' AS cancelado
      FROM status_agend
    )
    SELECT
      a.agend_id,
      a.agend_data,
      a.agend_inicio,
      a.agend_fim,
      a.agend_valor,
      c.clientes_nome,
      p.profissional_nome,
      e.empresa_nome,
      sc.status_agend_nome,
      COALESCE(STRING_AGG(srv.servicos_nome, ', ' ORDER BY ags.ordem), 'Serviço não informado') AS servicos
    FROM agendamento a
    JOIN clientes c ON c.clientes_id = a.clientes_id
    JOIN profissional p ON p.profissional_id = a.profissional_id
    JOIN empresa e ON e.empresa_id = a.empresa_id
    JOIN status_classificado sc ON sc.status_agend_id = a.status_agend_id
    LEFT JOIN agendamento_servico ags ON ags.agend_id = a.agend_id
    LEFT JOIN servicos srv ON srv.servicos_id = ags.servicos_id
    WHERE a.agend_inicio >= CURRENT_TIMESTAMP
      AND NOT sc.cancelado
      ${scopedAnd('a', isSuperAdmin)}
    GROUP BY
      a.agend_id,
      a.agend_data,
      a.agend_inicio,
      a.agend_fim,
      a.agend_valor,
      c.clientes_nome,
      p.profissional_nome,
      e.empresa_nome,
      sc.status_agend_nome
    ORDER BY a.agend_inicio
    LIMIT 10
  `, scopedParams(empresaId, isSuperAdmin))

  return result.rows.map((row) => ({
    agendId: row.agend_id,
    agendData: toDateString(row.agend_data),
    agendInicio: toTimestamp(row.agend_inicio),
    agendFim: toTimestamp(row.agend_fim),
    agendValor: toNumber(row.agend_valor),
    clientesNome: row.clientes_nome,
    profissionalNome: row.profissional_nome,
    empresaNome: row.empresa_nome,
    statusAgendNome: row.status_agend_nome,
    servicos: row.servicos,
  }))
}

async function getProfissionaisComAgendaHoje(empresaId, isSuperAdmin) {
  const result = await pool.query(`
    WITH periodo AS (
      SELECT (CURRENT_TIMESTAMP AT TIME ZONE '${TIMEZONE}')::date AS hoje
    ),
    status_classificado AS (
      SELECT
        status_agend_id,
        LOWER(status_agend_nome) LIKE '%cancel%' AS cancelado
      FROM status_agend
    )
    SELECT
      p.profissional_id,
      p.profissional_nome,
      p.especialidade AS profissional_especialidade,
      e.empresa_nome,
      COUNT(DISTINCT a.agend_id) FILTER (WHERE NOT sc.cancelado) AS agendamentos_hoje,
      MIN(a.agend_inicio) FILTER (WHERE NOT sc.cancelado) AS primeiro_horario,
      MAX(a.agend_inicio) FILTER (WHERE NOT sc.cancelado) AS ultimo_horario
    FROM profissional p
    JOIN empresa e ON e.empresa_id = p.empresa_id
    LEFT JOIN agendamento a
      ON a.profissional_id = p.profissional_id
      AND a.agend_data = (SELECT hoje FROM periodo)
    LEFT JOIN status_classificado sc ON sc.status_agend_id = a.status_agend_id
    WHERE p.status = 'ativo'
      ${scopedAnd('p', isSuperAdmin)}
    GROUP BY
      p.profissional_id,
      p.profissional_nome,
      p.especialidade,
      e.empresa_nome
    HAVING COUNT(DISTINCT a.agend_id) FILTER (WHERE NOT sc.cancelado) > 0
    ORDER BY agendamentos_hoje DESC, p.profissional_nome
    LIMIT 10
  `, scopedParams(empresaId, isSuperAdmin))

  return result.rows.map((row) => ({
    profissionalId: row.profissional_id,
    profissionalNome: row.profissional_nome,
    profissionalEspecialidade: row.profissional_especialidade,
    empresaNome: row.empresa_nome,
    agendamentosHoje: toInt(row.agendamentos_hoje),
    primeiroHorario: toTimestamp(row.primeiro_horario),
    ultimoHorario: toTimestamp(row.ultimo_horario),
  }))
}

async function getEmpresasResumo(isSuperAdmin) {
  if (!isSuperAdmin) {
    return {
      empresasMaiorMovimento: [],
      empresasSemMovimento: [],
    }
  }

  const [maiorMovimento, semMovimento] = await Promise.all([
    pool.query(`
      ${baseCtes(true)}
      SELECT
        e.empresa_id,
        e.empresa_nome,
        COUNT(DISTINCT v.agend_id) FILTER (WHERE NOT v.cancelado) AS agendamentos_mes,
        COUNT(DISTINCT v.agend_id) FILTER (WHERE v.cancelado) AS cancelamentos_mes,
        COALESCE(SUM(v.valor_total) FILTER (WHERE v.realizado), 0) AS receita_realizada,
        COALESCE(SUM(v.valor_total) FILTER (WHERE v.previsto), 0) AS receita_prevista
      FROM valores_agendamento v
      JOIN empresa e ON e.empresa_id = v.empresa_id
      GROUP BY e.empresa_id, e.empresa_nome
      HAVING COUNT(DISTINCT v.agend_id) FILTER (WHERE NOT v.cancelado) > 0
      ORDER BY agendamentos_mes DESC, receita_realizada DESC, receita_prevista DESC, e.empresa_nome
      LIMIT 8
    `),
    pool.query(`
      WITH periodo AS (
        SELECT
          date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE '${TIMEZONE}')::date AS inicio_mes,
          (date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE '${TIMEZONE}') + INTERVAL '1 month')::date AS fim_mes
      ),
      status_classificado AS (
        SELECT
          status_agend_id,
          LOWER(status_agend_nome) LIKE '%cancel%' AS cancelado
        FROM status_agend
      ),
      movimento AS (
        SELECT
          a.empresa_id,
          COUNT(DISTINCT a.agend_id) FILTER (WHERE NOT sc.cancelado) AS total
        FROM agendamento a
        JOIN periodo p ON true
        JOIN status_classificado sc ON sc.status_agend_id = a.status_agend_id
        WHERE a.agend_data >= p.inicio_mes
          AND a.agend_data < p.fim_mes
        GROUP BY a.empresa_id
      )
      SELECT
        e.empresa_id,
        e.empresa_nome,
        e.status
      FROM empresa e
      LEFT JOIN movimento m ON m.empresa_id = e.empresa_id
      WHERE e.status = 'ativa'
        AND COALESCE(m.total, 0) = 0
      ORDER BY e.empresa_nome
      LIMIT 8
    `),
  ])

  return {
    empresasMaiorMovimento: maiorMovimento.rows.map((row) => ({
      empresaId: row.empresa_id,
      empresaNome: row.empresa_nome,
      agendamentosMes: toInt(row.agendamentos_mes),
      cancelamentosMes: toInt(row.cancelamentos_mes),
      receitaRealizada: toNumber(row.receita_realizada),
      receitaPrevista: toNumber(row.receita_prevista),
    })),
    empresasSemMovimento: semMovimento.rows.map((row) => ({
      empresaId: row.empresa_id,
      empresaNome: row.empresa_nome,
      status: row.status,
    })),
  }
}

function montarGraficos(servicosResumo, resumo, outrosGraficos) {
  const receitaRealizadaDisponivel = resumo.cards.receitaRealizadaDisponivel
  const servicosRealizadosDisponivel = resumo.cards.servicosRealizadosDisponivel

  const servicosMaisRealizados = servicosRealizadosDisponivel
    ? [...servicosResumo]
      .filter((servico) => servico.quantidadeRealizada > 0)
      .sort((a, b) => b.quantidadeRealizada - a.quantidadeRealizada)
      .slice(0, 8)
      .map((servico) => ({
        servicosId: servico.servicosId,
        servicosNome: servico.servicosNome,
        quantidade: servico.quantidadeRealizada,
      }))
    : []

  const receitaPorServico = [...servicosResumo]
    .map((servico) => ({
      servicosId: servico.servicosId,
      servicosNome: servico.servicosNome,
      receita: receitaRealizadaDisponivel ? servico.receitaRealizada : servico.receitaPrevista,
      tipoReceita: receitaRealizadaDisponivel ? 'realizada' : 'prevista',
    }))
    .filter((servico) => servico.receita > 0)
    .sort((a, b) => b.receita - a.receita)
    .slice(0, 8)

  return {
    evolucaoDiaria: outrosGraficos.evolucaoDiaria,
    servicosMaisRealizados,
    receitaPorServico,
    agendamentosPorDiaSemana: outrosGraficos.agendamentosPorDiaSemana,
    agendamentosPorFaixaHorario: outrosGraficos.agendamentosPorFaixaHorario,
  }
}

function montarTabelas(servicosResumo, resumo, outrasTabelas) {
  const receitaRealizadaDisponivel = resumo.cards.receitaRealizadaDisponivel

  const servicosMaiorFaturamento = [...servicosResumo]
    .map((servico) => ({
      servicosId: servico.servicosId,
      servicosNome: servico.servicosNome,
      quantidade: receitaRealizadaDisponivel
        ? servico.quantidadeRealizada
        : servico.quantidadeAgendada,
      receita: receitaRealizadaDisponivel ? servico.receitaRealizada : servico.receitaPrevista,
      tipoReceita: receitaRealizadaDisponivel ? 'realizada' : 'prevista',
    }))
    .filter((servico) => servico.receita > 0)
    .sort((a, b) => b.receita - a.receita)
    .slice(0, 8)

  return {
    proximosAgendamentos: outrasTabelas.proximosAgendamentos,
    empresasMaiorMovimento: outrasTabelas.empresasMaiorMovimento,
    empresasSemMovimento: outrasTabelas.empresasSemMovimento,
    profissionaisComAgendaHoje: outrasTabelas.profissionaisComAgendaHoje,
    servicosMaiorFaturamento,
  }
}

export const dashboardModel = {
  async getVisaoGeral({ empresaId, isSuperAdmin }) {
    // TODO futuro: no-show exige status "Não compareceu" ou campo explícito de presença.
    // TODO futuro: desempenho de IA deve vir de uma tabela de eventos do agente
    // com empresa_id, session_id, cliente_id, canal, intent, action, status, erro,
    // tempo_resposta_ms, tokens_input, tokens_output, custo_estimado e created_at.
    const resumo = await getResumo(empresaId, isSuperAdmin)

    const [
      evolucaoDiaria,
      servicosResumo,
      agendamentosPorDiaSemana,
      agendamentosPorFaixaHorario,
      proximosAgendamentos,
      profissionaisComAgendaHoje,
      empresasResumo,
    ] = await Promise.all([
      getEvolucaoDiaria(empresaId, isSuperAdmin),
      getServicosResumo(empresaId, isSuperAdmin),
      getAgendamentosPorDiaSemana(empresaId, isSuperAdmin),
      getAgendamentosPorFaixaHorario(empresaId, isSuperAdmin),
      getProximosAgendamentos(empresaId, isSuperAdmin),
      getProfissionaisComAgendaHoje(empresaId, isSuperAdmin),
      getEmpresasResumo(isSuperAdmin),
    ])

    const graficos = montarGraficos(servicosResumo, resumo, {
      evolucaoDiaria,
      agendamentosPorDiaSemana,
      agendamentosPorFaixaHorario,
    })

    const tabelas = montarTabelas(servicosResumo, resumo, {
      proximosAgendamentos,
      profissionaisComAgendaHoje,
      ...empresasResumo,
    })

    return {
      periodo: resumo.periodo,
      cards: resumo.cards,
      graficos,
      tabelas,
    }
  },
}
