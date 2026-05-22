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

async function getGestaoAgendaCards(empresaId, isSuperAdmin) {
  const result = await pool.query(`
    WITH periodo AS (
      SELECT
        (CURRENT_TIMESTAMP AT TIME ZONE '${TIMEZONE}')::date AS hoje,
        CURRENT_TIMESTAMP AS agora,
        date_trunc('week', CURRENT_TIMESTAMP AT TIME ZONE '${TIMEZONE}')::date AS inicio_semana,
        (date_trunc('week', CURRENT_TIMESTAMP AT TIME ZONE '${TIMEZONE}') + INTERVAL '7 days')::date AS fim_semana,
        date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE '${TIMEZONE}')::date AS inicio_mes,
        (date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE '${TIMEZONE}') + INTERVAL '1 month')::date AS fim_mes,
        ((CURRENT_TIMESTAMP AT TIME ZONE '${TIMEZONE}')::date + INTERVAL '7 days')::date AS fim_proximos
    ),
    status_flags AS (
      SELECT EXISTS (
        SELECT 1
        FROM status_agend
        WHERE LOWER(status_agend_nome) LIKE '%agend%'
          OR LOWER(status_agend_nome) LIKE '%confirm%'
          OR LOWER(status_agend_nome) LIKE '%avis%'
      ) AS has_status_ativo_agenda
    ),
    status_classificado AS (
      SELECT
        status_agend_id,
        status_agend_nome,
        LOWER(status_agend_nome) LIKE '%cancel%' AS cancelado,
        (
          LOWER(status_agend_nome) LIKE '%agend%'
          OR LOWER(status_agend_nome) LIKE '%confirm%'
          OR LOWER(status_agend_nome) LIKE '%avis%'
        ) AS ativo_agenda_nome
      FROM status_agend
    ),
    profissionais_ativos AS (
      SELECT
        prof.profissional_id,
        prof.profissional_nome,
        prof.empresa_id,
        e.empresa_nome,
        COALESCE(ec.empresa_cfg_interv_minutos, 30) AS intervalo_min
      FROM profissional prof
      JOIN empresa e ON e.empresa_id = prof.empresa_id
      LEFT JOIN empresa_cfg ec ON ec.empresa_cfg_id = e.empresa_cfg_id
      WHERE prof.status = 'ativo'
        ${scopedAnd('prof', isSuperAdmin)}
    ),
    dias_semana AS (
      SELECT generate_series(
        (SELECT inicio_semana FROM periodo),
        (SELECT fim_semana FROM periodo) - INTERVAL '1 day',
        INTERVAL '1 day'
      )::date AS dia
    ),
    dias_proximos AS (
      SELECT generate_series(
        (SELECT hoje FROM periodo),
        (SELECT fim_proximos FROM periodo) - INTERVAL '1 day',
        INTERVAL '1 day'
      )::date AS dia
    ),
    dias_mes AS (
      SELECT generate_series(
        (SELECT inicio_mes FROM periodo),
        (SELECT fim_mes FROM periodo) - INTERVAL '1 day',
        INTERVAL '1 day'
      )::date AS dia
    ),
    expediente_profissional AS (
      SELECT
        d.dia,
        pa.profissional_id,
        pa.profissional_nome,
        pa.empresa_id,
        pa.empresa_nome,
        pa.intervalo_min,
        hd.horario_det_id,
        ((d.dia + hd.horario_det_inicio) AT TIME ZONE '${TIMEZONE}') AS inicio_expediente,
        ((d.dia + hd.horario_det_fim) AT TIME ZONE '${TIMEZONE}') AS fim_expediente,
        GREATEST(
          EXTRACT(EPOCH FROM (hd.horario_det_fim - hd.horario_det_inicio)) / 60.0,
          0
        )::numeric AS minutos_disponiveis
      FROM dias_semana d
      JOIN profissionais_ativos pa ON true
      JOIN profissional_horario ph ON ph.profissional_id = pa.profissional_id
      JOIN horario_det hd ON hd.horario_f_id = ph.horario_f_id
      WHERE hd.horario_def = EXTRACT(DOW FROM d.dia)::int
        OR (hd.horario_def = 7 AND EXTRACT(DOW FROM d.dia)::int = 0)
    ),
    expediente_proximos AS (
      SELECT
        d.dia,
        pa.profissional_id,
        pa.profissional_nome,
        pa.empresa_id,
        pa.empresa_nome,
        pa.intervalo_min,
        hd.horario_det_id,
        ((d.dia + hd.horario_det_inicio) AT TIME ZONE '${TIMEZONE}') AS inicio_expediente,
        ((d.dia + hd.horario_det_fim) AT TIME ZONE '${TIMEZONE}') AS fim_expediente,
        GREATEST(
          EXTRACT(EPOCH FROM (hd.horario_det_fim - hd.horario_det_inicio)) / 60.0,
          0
        )::numeric AS minutos_disponiveis
      FROM dias_proximos d
      JOIN profissionais_ativos pa ON true
      JOIN profissional_horario ph ON ph.profissional_id = pa.profissional_id
      JOIN horario_det hd ON hd.horario_f_id = ph.horario_f_id
      WHERE hd.horario_def = EXTRACT(DOW FROM d.dia)::int
        OR (hd.horario_def = 7 AND EXTRACT(DOW FROM d.dia)::int = 0)
    ),
    expediente_profissional_mes AS (
      SELECT
        d.dia,
        pa.profissional_id,
        pa.profissional_nome,
        pa.empresa_id,
        pa.empresa_nome,
        pa.intervalo_min,
        hd.horario_det_id,
        ((d.dia + hd.horario_det_inicio) AT TIME ZONE '${TIMEZONE}') AS inicio_expediente,
        ((d.dia + hd.horario_det_fim) AT TIME ZONE '${TIMEZONE}') AS fim_expediente,
        GREATEST(
          EXTRACT(EPOCH FROM (hd.horario_det_fim - hd.horario_det_inicio)) / 60.0,
          0
        )::numeric AS minutos_disponiveis
      FROM dias_mes d
      JOIN profissionais_ativos pa ON true
      JOIN profissional_horario ph ON ph.profissional_id = pa.profissional_id
      JOIN horario_det hd ON hd.horario_f_id = ph.horario_f_id
      WHERE hd.horario_def = EXTRACT(DOW FROM d.dia)::int
        OR (hd.horario_def = 7 AND EXTRACT(DOW FROM d.dia)::int = 0)
    ),
    agendamentos_semana AS (
      SELECT
        a.agend_id,
        a.empresa_id,
        a.profissional_id,
        a.clientes_id,
        a.agend_data,
        a.agend_inicio,
        a.agend_fim,
        sc.status_agend_nome,
        sc.cancelado,
        (
          NOT sc.cancelado
          AND (
            sc.ativo_agenda_nome
            OR NOT (SELECT has_status_ativo_agenda FROM status_flags)
          )
        ) AS ativo_agenda,
        GREATEST(
          COALESCE(EXTRACT(EPOCH FROM (a.agend_fim - a.agend_inicio)) / 60.0, 0),
          0
        )::numeric AS minutos_agendados
      FROM agendamento a
      JOIN periodo p ON true
      JOIN status_classificado sc ON sc.status_agend_id = a.status_agend_id
      WHERE a.agend_data >= p.inicio_semana
        AND a.agend_data < p.fim_semana
        ${scopedAnd('a', isSuperAdmin)}
    ),
    agendamentos_mes AS (
      SELECT
        a.agend_id,
        a.empresa_id,
        a.profissional_id,
        a.agend_data,
        a.agend_inicio,
        a.agend_fim,
        sc.status_agend_nome,
        sc.cancelado,
        (
          NOT sc.cancelado
          AND (
            sc.ativo_agenda_nome
            OR NOT (SELECT has_status_ativo_agenda FROM status_flags)
          )
        ) AS ativo_agenda,
        GREATEST(
          COALESCE(EXTRACT(EPOCH FROM (a.agend_fim - a.agend_inicio)) / 60.0, 0),
          0
        )::numeric AS minutos_agendados
      FROM agendamento a
      JOIN periodo p ON true
      JOIN status_classificado sc ON sc.status_agend_id = a.status_agend_id
      WHERE a.agend_data >= p.inicio_mes
        AND a.agend_data < p.fim_mes
        ${scopedAnd('a', isSuperAdmin)}
    ),
    agendamentos_proximos AS (
      SELECT
        a.agend_id,
        a.empresa_id,
        a.profissional_id,
        a.agend_data,
        a.agend_inicio,
        a.agend_fim,
        sc.status_agend_nome,
        sc.cancelado,
        (
          NOT sc.cancelado
          AND (
            sc.ativo_agenda_nome
            OR NOT (SELECT has_status_ativo_agenda FROM status_flags)
          )
        ) AS ativo_agenda,
        GREATEST(
          COALESCE(EXTRACT(EPOCH FROM (a.agend_fim - a.agend_inicio)) / 60.0, 0),
          0
        )::numeric AS minutos_agendados
      FROM agendamento a
      JOIN periodo p ON true
      JOIN status_classificado sc ON sc.status_agend_id = a.status_agend_id
      WHERE a.agend_data >= p.hoje
        AND a.agend_data < p.fim_proximos
        ${scopedAnd('a', isSuperAdmin)}
    ),
    servicos_por_agendamento AS (
      SELECT
        ags.agend_id,
        COALESCE(STRING_AGG(srv.servicos_nome, ', ' ORDER BY ags.ordem, srv.servicos_nome), 'Serviço não informado') AS servicos
      FROM agendamento_servico ags
      JOIN agendamentos_semana a ON a.agend_id = ags.agend_id
      LEFT JOIN servicos srv ON srv.servicos_id = ags.servicos_id
      GROUP BY ags.agend_id
    ),
    capacidade AS (
      SELECT
        COALESCE(SUM(minutos_disponiveis) FILTER (WHERE dia = (SELECT hoje FROM periodo)), 0) AS minutos_disponiveis_hoje,
        COALESCE(SUM(minutos_disponiveis), 0) AS minutos_disponiveis_semana,
        COUNT(DISTINCT profissional_id) FILTER (WHERE dia = (SELECT hoje FROM periodo)) AS profissionais_ativos_hoje
      FROM expediente_profissional
    ),
    ocupacao AS (
      SELECT
        COALESCE(SUM(minutos_agendados) FILTER (
          WHERE agend_data = (SELECT hoje FROM periodo)
            AND ativo_agenda
        ), 0) AS minutos_ocupados_hoje,
        COALESCE(SUM(minutos_agendados) FILTER (WHERE ativo_agenda), 0) AS minutos_ocupados_semana,
        COUNT(DISTINCT agend_id) FILTER (
          WHERE agend_data = (SELECT hoje FROM periodo)
            AND ativo_agenda
            AND agend_inicio >= (SELECT agora FROM periodo)
        ) AS agendamentos_restantes_hoje,
        -- O schema atual não possui data de cancelamento; por isso a aproximação
        -- usa a data do próprio agendamento para "cancelamentos hoje".
        COUNT(DISTINCT agend_id) FILTER (
          WHERE agend_data = (SELECT hoje FROM periodo)
            AND cancelado
        ) AS cancelamentos_hoje
      FROM agendamentos_semana
    ),
    capacidade_por_dia AS (
      SELECT
        d.dia,
        COALESCE(SUM(ep.minutos_disponiveis), 0)::numeric AS minutos_disponiveis
      FROM dias_semana d
      LEFT JOIN expediente_profissional ep ON ep.dia = d.dia
      GROUP BY d.dia
    ),
    ocupacao_por_dia_base AS (
      SELECT
        agend_data AS dia,
        COALESCE(SUM(minutos_agendados) FILTER (WHERE ativo_agenda), 0)::numeric AS minutos_ocupados,
        COUNT(DISTINCT agend_id) FILTER (WHERE ativo_agenda) AS total_agendamentos
      FROM agendamentos_semana
      GROUP BY agend_data
    ),
    ocupacao_por_dia AS (
      SELECT
        cpd.dia,
        CASE EXTRACT(ISODOW FROM cpd.dia)::int
          WHEN 1 THEN 'Segunda'
          WHEN 2 THEN 'Terça'
          WHEN 3 THEN 'Quarta'
          WHEN 4 THEN 'Quinta'
          WHEN 5 THEN 'Sexta'
          WHEN 6 THEN 'Sábado'
          ELSE 'Domingo'
        END AS nome_dia,
        cpd.minutos_disponiveis,
        COALESCE(opdb.minutos_ocupados, 0)::numeric AS minutos_ocupados,
        COALESCE(opdb.total_agendamentos, 0) AS total_agendamentos,
        CASE
          WHEN cpd.minutos_disponiveis > 0
            THEN ROUND((COALESCE(opdb.minutos_ocupados, 0) / cpd.minutos_disponiveis) * 100, 1)
          ELSE NULL
        END AS ocupacao_percentual
      FROM capacidade_por_dia cpd
      LEFT JOIN ocupacao_por_dia_base opdb ON opdb.dia = cpd.dia
    ),
    capacidade_por_profissional AS (
      SELECT
        pa.profissional_id,
        pa.profissional_nome,
        pa.empresa_nome,
        COALESCE(SUM(ep.minutos_disponiveis), 0)::numeric AS minutos_disponiveis
      FROM profissionais_ativos pa
      LEFT JOIN expediente_profissional ep ON ep.profissional_id = pa.profissional_id
      GROUP BY pa.profissional_id, pa.profissional_nome, pa.empresa_nome
    ),
    ocupacao_por_profissional_base AS (
      SELECT
        profissional_id,
        COALESCE(SUM(minutos_agendados) FILTER (WHERE ativo_agenda), 0)::numeric AS minutos_ocupados,
        COUNT(DISTINCT agend_id) FILTER (WHERE ativo_agenda) AS total_agendamentos
      FROM agendamentos_semana
      GROUP BY profissional_id
    ),
    ocupacao_por_profissional AS (
      SELECT
        cpp.profissional_id,
        cpp.profissional_nome,
        cpp.empresa_nome,
        cpp.minutos_disponiveis,
        COALESCE(oppb.minutos_ocupados, 0)::numeric AS minutos_ocupados,
        COALESCE(oppb.total_agendamentos, 0) AS total_agendamentos,
        CASE
          WHEN cpp.minutos_disponiveis > 0
            THEN ROUND((COALESCE(oppb.minutos_ocupados, 0) / cpp.minutos_disponiveis) * 100, 1)
          ELSE NULL
        END AS ocupacao_percentual
      FROM capacidade_por_profissional cpp
      LEFT JOIN ocupacao_por_profissional_base oppb
        ON oppb.profissional_id = cpp.profissional_id
    ),
    faixas_horario(ordem, faixa, hora_inicio, hora_fim) AS (
      VALUES
        (1, '06:00-08:00', 6, 8),
        (2, '08:00-10:00', 8, 10),
        (3, '10:00-12:00', 10, 12),
        (4, '12:00-14:00', 12, 14),
        (5, '14:00-16:00', 14, 16),
        (6, '16:00-18:00', 16, 18),
        (7, '18:00-20:00', 18, 20),
        (8, '20:00-22:00', 20, 22)
    ),
    agendamentos_mes_horario AS (
      SELECT
        *,
        EXTRACT(HOUR FROM agend_inicio AT TIME ZONE '${TIMEZONE}')::int AS hora_inicio_local,
        to_char(agend_inicio AT TIME ZONE '${TIMEZONE}', 'HH24:MI') AS horario_inicio_local
      FROM agendamentos_mes
    ),
    agendamentos_por_faixa AS (
      SELECT
        fh.ordem,
        fh.faixa,
        COUNT(DISTINCT amh.agend_id) FILTER (WHERE amh.ativo_agenda) AS agendamentos,
        COUNT(DISTINCT amh.agend_id) FILTER (WHERE amh.cancelado) AS cancelamentos
      FROM faixas_horario fh
      LEFT JOIN agendamentos_mes_horario amh
        ON amh.hora_inicio_local >= fh.hora_inicio
        AND amh.hora_inicio_local < fh.hora_fim
      GROUP BY fh.ordem, fh.faixa
    ),
    horarios_mais_procurados AS (
      SELECT
        horario_inicio_local AS horario,
        COUNT(DISTINCT agend_id) FILTER (WHERE ativo_agenda) AS quantidade,
        COUNT(DISTINCT agend_id) FILTER (WHERE cancelado) AS cancelamentos,
        CASE
          WHEN COUNT(DISTINCT agend_id) FILTER (WHERE ativo_agenda OR cancelado) > 0
            THEN ROUND(
              (
                COUNT(DISTINCT agend_id) FILTER (WHERE cancelado)
              )::numeric
              / (
                COUNT(DISTINCT agend_id) FILTER (WHERE ativo_agenda OR cancelado)
              )::numeric * 100,
              1
            )
          ELSE 0
        END AS percentual_cancelamento
      FROM agendamentos_mes_horario
      WHERE horario_inicio_local IS NOT NULL
      GROUP BY horario_inicio_local
      HAVING COUNT(DISTINCT agend_id) FILTER (WHERE ativo_agenda OR cancelado) > 0
      ORDER BY
        COUNT(DISTINCT agend_id) FILTER (WHERE ativo_agenda OR cancelado) DESC,
        horario_inicio_local
      LIMIT 10
    ),
    expediente_hoje AS (
      SELECT ep.*
      FROM expediente_profissional ep
      JOIN periodo p ON true
      WHERE ep.dia = p.hoje
        AND ep.fim_expediente > p.agora
    ),
    agendamentos_hoje_ativos AS (
      SELECT *
      FROM agendamentos_semana
      WHERE agend_data = (SELECT hoje FROM periodo)
        AND ativo_agenda
    ),
    ocupados_hoje AS (
      SELECT
        eh.horario_det_id,
        eh.profissional_id,
        eh.profissional_nome,
        eh.empresa_nome,
        eh.intervalo_min,
        eh.inicio_expediente,
        eh.fim_expediente,
        GREATEST(a.agend_inicio, eh.inicio_expediente) AS ocup_inicio,
        LEAST(a.agend_fim, eh.fim_expediente) AS ocup_fim
      FROM expediente_hoje eh
      JOIN agendamentos_hoje_ativos a
        ON a.profissional_id = eh.profissional_id
        AND a.agend_inicio < eh.fim_expediente
        AND a.agend_fim > eh.inicio_expediente
    ),
    expediente_hoje_base AS (
      SELECT
        eh.horario_det_id,
        eh.profissional_id,
        eh.profissional_nome,
        eh.empresa_nome,
        eh.intervalo_min,
        eh.inicio_expediente,
        eh.fim_expediente,
        GREATEST(
          eh.inicio_expediente,
          p.agora,
          COALESCE(MAX(o.ocup_fim), eh.inicio_expediente)
        ) AS inicio_busca
      FROM expediente_hoje eh
      CROSS JOIN periodo p
      LEFT JOIN ocupados_hoje o
        ON o.horario_det_id = eh.horario_det_id
        AND o.ocup_inicio <= p.agora
        AND o.ocup_fim > p.agora
      GROUP BY
        eh.horario_det_id,
        eh.profissional_id,
        eh.profissional_nome,
        eh.empresa_nome,
        eh.intervalo_min,
        eh.inicio_expediente,
        eh.fim_expediente,
        p.agora
    ),
    janelas_iniciais AS (
      SELECT
        eh.profissional_id,
        eh.profissional_nome,
        eh.empresa_nome,
        eh.intervalo_min,
        eh.inicio_busca AS janela_inicio,
        COALESCE(MIN(o.ocup_inicio), eh.fim_expediente) AS janela_fim
      FROM expediente_hoje_base eh
      LEFT JOIN ocupados_hoje o
        ON o.horario_det_id = eh.horario_det_id
        AND o.ocup_inicio >= eh.inicio_busca
      GROUP BY
        eh.profissional_id,
        eh.profissional_nome,
        eh.empresa_nome,
        eh.intervalo_min,
        eh.inicio_busca,
        eh.fim_expediente
    ),
    janelas_apos_agendamentos AS (
      SELECT
        o.profissional_id,
        o.profissional_nome,
        o.empresa_nome,
        o.intervalo_min,
        GREATEST(o.ocup_fim, p.agora) AS janela_inicio,
        COALESCE(MIN(o2.ocup_inicio), o.fim_expediente) AS janela_fim
      FROM ocupados_hoje o
      CROSS JOIN periodo p
      LEFT JOIN ocupados_hoje o2
        ON o2.horario_det_id = o.horario_det_id
        AND o2.ocup_inicio >= o.ocup_fim
      WHERE o.ocup_fim >= p.agora
      GROUP BY
        o.profissional_id,
        o.profissional_nome,
        o.empresa_nome,
        o.intervalo_min,
        o.ocup_fim,
        o.fim_expediente,
        p.agora
    ),
    janelas_livres AS (
      SELECT * FROM janelas_iniciais
      UNION ALL
      SELECT * FROM janelas_apos_agendamentos
    ),
    proximas_janelas AS (
      SELECT
        profissional_id,
        profissional_nome,
        empresa_nome,
        janela_inicio,
        janela_fim,
        EXTRACT(EPOCH FROM (janela_fim - janela_inicio)) / 60.0 AS duracao_min
      FROM janelas_livres
      WHERE janela_fim > janela_inicio
        AND EXTRACT(EPOCH FROM (janela_fim - janela_inicio)) / 60.0 >= intervalo_min
    ),
    agenda_hoje AS (
      SELECT
        ah.agend_id,
        to_char(ah.agend_inicio AT TIME ZONE '${TIMEZONE}', 'HH24:MI') AS inicio,
        to_char(ah.agend_fim AT TIME ZONE '${TIMEZONE}', 'HH24:MI') AS fim,
        c.clientes_nome AS cliente,
        COALESCE(spa.servicos, 'Serviço não informado') AS servico,
        prof.profissional_nome AS profissional,
        ah.status_agend_nome AS status,
        ah.cancelado,
        CASE WHEN ${isSuperAdmin ? 'true' : 'false'} THEN e.empresa_nome ELSE NULL END AS empresa
      FROM agendamentos_semana ah
      JOIN clientes c ON c.clientes_id = ah.clientes_id
      JOIN profissional prof ON prof.profissional_id = ah.profissional_id
      JOIN empresa e ON e.empresa_id = ah.empresa_id
      LEFT JOIN servicos_por_agendamento spa ON spa.agend_id = ah.agend_id
      WHERE ah.agend_data = (SELECT hoje FROM periodo)
    ),
    expediente_hoje_texto AS (
      SELECT
        ep.profissional_id,
        STRING_AGG(
          to_char(ep.inicio_expediente AT TIME ZONE '${TIMEZONE}', 'HH24:MI')
            || '-' ||
          to_char(ep.fim_expediente AT TIME ZONE '${TIMEZONE}', 'HH24:MI'),
          ' / '
          ORDER BY ep.inicio_expediente
        ) AS expediente
      FROM expediente_proximos ep
      WHERE ep.dia = (SELECT hoje FROM periodo)
      GROUP BY ep.profissional_id
    ),
    ocupados_proximos AS (
      SELECT
        ep.dia,
        ep.horario_det_id,
        ep.profissional_id,
        ep.profissional_nome,
        ep.empresa_nome,
        ep.intervalo_min,
        ep.inicio_expediente,
        ep.fim_expediente,
        GREATEST(a.agend_inicio, ep.inicio_expediente) AS ocup_inicio,
        LEAST(a.agend_fim, ep.fim_expediente) AS ocup_fim
      FROM expediente_proximos ep
      JOIN agendamentos_proximos a
        ON a.profissional_id = ep.profissional_id
        AND a.ativo_agenda
        AND a.agend_inicio < ep.fim_expediente
        AND a.agend_fim > ep.inicio_expediente
    ),
    expediente_proximos_base AS (
      SELECT
        ep.dia,
        ep.horario_det_id,
        ep.profissional_id,
        ep.profissional_nome,
        ep.empresa_nome,
        ep.intervalo_min,
        ep.inicio_expediente,
        ep.fim_expediente,
        GREATEST(
          ep.inicio_expediente,
          p.agora,
          COALESCE(MAX(o.ocup_fim), ep.inicio_expediente)
        ) AS inicio_busca
      FROM expediente_proximos ep
      CROSS JOIN periodo p
      LEFT JOIN ocupados_proximos o
        ON o.dia = ep.dia
        AND o.horario_det_id = ep.horario_det_id
        AND o.profissional_id = ep.profissional_id
        AND o.ocup_inicio <= p.agora
        AND o.ocup_fim > p.agora
      WHERE ep.fim_expediente > p.agora
      GROUP BY
        ep.dia,
        ep.horario_det_id,
        ep.profissional_id,
        ep.profissional_nome,
        ep.empresa_nome,
        ep.intervalo_min,
        ep.inicio_expediente,
        ep.fim_expediente,
        p.agora
    ),
    janelas_iniciais_proximos AS (
      SELECT
        ep.dia,
        ep.profissional_id,
        ep.profissional_nome,
        ep.empresa_nome,
        ep.intervalo_min,
        ep.inicio_busca AS janela_inicio,
        COALESCE(MIN(o.ocup_inicio), ep.fim_expediente) AS janela_fim
      FROM expediente_proximos_base ep
      LEFT JOIN ocupados_proximos o
        ON o.dia = ep.dia
        AND o.horario_det_id = ep.horario_det_id
        AND o.profissional_id = ep.profissional_id
        AND o.ocup_inicio >= ep.inicio_busca
      GROUP BY
        ep.dia,
        ep.profissional_id,
        ep.profissional_nome,
        ep.empresa_nome,
        ep.intervalo_min,
        ep.inicio_busca,
        ep.fim_expediente
    ),
    janelas_apos_agendamentos_proximos AS (
      SELECT
        o.dia,
        o.profissional_id,
        o.profissional_nome,
        o.empresa_nome,
        o.intervalo_min,
        GREATEST(o.ocup_fim, p.agora) AS janela_inicio,
        COALESCE(MIN(o2.ocup_inicio), o.fim_expediente) AS janela_fim
      FROM ocupados_proximos o
      CROSS JOIN periodo p
      LEFT JOIN ocupados_proximos o2
        ON o2.dia = o.dia
        AND o2.horario_det_id = o.horario_det_id
        AND o2.profissional_id = o.profissional_id
        AND o2.ocup_inicio >= o.ocup_fim
      WHERE o.ocup_fim >= p.agora
      GROUP BY
        o.dia,
        o.profissional_id,
        o.profissional_nome,
        o.empresa_nome,
        o.intervalo_min,
        o.ocup_fim,
        o.fim_expediente,
        p.agora
    ),
    janelas_livres_proximos AS (
      SELECT * FROM janelas_iniciais_proximos
      UNION ALL
      SELECT * FROM janelas_apos_agendamentos_proximos
    ),
    janelas_livres_filtradas AS (
      SELECT
        dia,
        profissional_id,
        profissional_nome,
        empresa_nome,
        janela_inicio,
        janela_fim,
        ROUND(EXTRACT(EPOCH FROM (janela_fim - janela_inicio)) / 60.0)::int AS duracao_min
      FROM janelas_livres_proximos
      WHERE janela_fim > janela_inicio
        AND EXTRACT(EPOCH FROM (janela_fim - janela_inicio)) / 60.0 >= GREATEST(intervalo_min, 30)
    ),
    proximos_horarios_livres AS (
      SELECT *
      FROM janelas_livres_filtradas
      ORDER BY janela_inicio, profissional_nome
      LIMIT 10
    ),
    janelas_ociosas_hoje AS (
      SELECT *
      FROM janelas_livres_filtradas
      WHERE dia = (SELECT hoje FROM periodo)
      ORDER BY duracao_min DESC, janela_inicio, profissional_nome
      LIMIT 10
    ),
    profissionais_sem_agendamento_hoje AS (
      SELECT
        pa.profissional_id,
        pa.profissional_nome AS profissional,
        CASE WHEN ${isSuperAdmin ? 'true' : 'false'} THEN pa.empresa_nome ELSE NULL END AS empresa,
        COALESCE(eht.expediente, 'Expediente não configurado') AS expediente,
        'Sem agendamentos hoje' AS status
      FROM profissionais_ativos pa
      LEFT JOIN expediente_hoje_texto eht ON eht.profissional_id = pa.profissional_id
      WHERE NOT EXISTS (
        SELECT 1
        FROM agendamentos_semana a
        WHERE a.profissional_id = pa.profissional_id
          AND a.agend_data = (SELECT hoje FROM periodo)
          AND a.ativo_agenda
      )
      ORDER BY pa.profissional_nome
    ),
    capacidade_por_dia_mes AS (
      SELECT
        d.dia,
        COALESCE(SUM(epm.minutos_disponiveis), 0)::numeric AS minutos_disponiveis
      FROM dias_mes d
      LEFT JOIN expediente_profissional_mes epm ON epm.dia = d.dia
      GROUP BY d.dia
    ),
    ocupacao_por_dia_mes_base AS (
      SELECT
        agend_data AS dia,
        COALESCE(SUM(minutos_agendados) FILTER (WHERE ativo_agenda), 0)::numeric AS minutos_ocupados,
        COUNT(DISTINCT agend_id) FILTER (WHERE ativo_agenda) AS total_agendamentos
      FROM agendamentos_mes
      GROUP BY agend_data
    ),
    ocupacao_por_dia_mes AS (
      SELECT
        cpdm.dia,
        CASE EXTRACT(ISODOW FROM cpdm.dia)::int
          WHEN 1 THEN 'Segunda'
          WHEN 2 THEN 'Terça'
          WHEN 3 THEN 'Quarta'
          WHEN 4 THEN 'Quinta'
          WHEN 5 THEN 'Sexta'
          WHEN 6 THEN 'Sábado'
          ELSE 'Domingo'
        END AS dia_semana,
        cpdm.minutos_disponiveis,
        COALESCE(opdmb.minutos_ocupados, 0)::numeric AS minutos_ocupados,
        COALESCE(opdmb.total_agendamentos, 0) AS total_agendamentos,
        CASE
          WHEN cpdm.minutos_disponiveis > 0
            THEN ROUND((COALESCE(opdmb.minutos_ocupados, 0) / cpdm.minutos_disponiveis) * 100, 1)
          ELSE NULL
        END AS ocupacao_percentual
      FROM capacidade_por_dia_mes cpdm
      LEFT JOIN ocupacao_por_dia_mes_base opdmb ON opdmb.dia = cpdm.dia
    ),
    dias_maior_ocupacao AS (
      SELECT *
      FROM ocupacao_por_dia_mes
      WHERE minutos_disponiveis > 0
      ORDER BY ocupacao_percentual DESC NULLS LAST, minutos_ocupados DESC, dia
      LIMIT 5
    ),
    dias_menor_ocupacao AS (
      SELECT *
      FROM ocupacao_por_dia_mes
      WHERE minutos_disponiveis > 0
      ORDER BY ocupacao_percentual ASC NULLS LAST, minutos_ocupados ASC, dia
      LIMIT 5
    )
    SELECT
      CASE
        WHEN cap.minutos_disponiveis_hoje > 0
          THEN ROUND((oc.minutos_ocupados_hoje / cap.minutos_disponiveis_hoje) * 100, 1)
        ELSE NULL
      END AS ocupacao_hoje,
      CASE
        WHEN cap.minutos_disponiveis_semana > 0
          THEN ROUND((oc.minutos_ocupados_semana / cap.minutos_disponiveis_semana) * 100, 1)
        ELSE NULL
      END AS ocupacao_semana,
      CASE
        WHEN cap.minutos_disponiveis_hoje > 0
          THEN ROUND(GREATEST(cap.minutos_disponiveis_hoje - oc.minutos_ocupados_hoje, 0) / 60.0, 2)
        ELSE NULL
      END AS horas_disponiveis_hoje,
      ROUND(oc.minutos_ocupados_hoje / 60.0, 2) AS horas_ocupadas_hoje,
      cap.minutos_disponiveis_hoje > 0 AS disponibilidade_calculavel_hoje,
      cap.minutos_disponiveis_semana > 0 AS disponibilidade_calculavel_semana,
      cap.profissionais_ativos_hoje,
      oc.agendamentos_restantes_hoje,
      oc.cancelamentos_hoje,
      to_char(pj.janela_inicio AT TIME ZONE '${TIMEZONE}', 'HH24:MI') AS proximo_horario_livre_hora,
      pj.profissional_nome AS proximo_horario_livre_profissional,
      pj.empresa_nome AS proximo_horario_livre_empresa,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'dia', opd.nome_dia,
            'data', opd.dia,
            'minutosDisponiveis', opd.minutos_disponiveis,
            'minutosOcupados', opd.minutos_ocupados,
            'ocupacaoPercentual', opd.ocupacao_percentual,
            'totalAgendamentos', opd.total_agendamentos
          )
          ORDER BY opd.dia
        )
        FROM ocupacao_por_dia opd
      ), '[]'::json) AS ocupacao_por_dia_semana,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'profissionalId', opp.profissional_id,
            'profissionalNome', opp.profissional_nome,
            'empresaNome', ${isSuperAdmin ? 'opp.empresa_nome' : 'NULL'},
            'minutosDisponiveis', opp.minutos_disponiveis,
            'minutosOcupados', opp.minutos_ocupados,
            'ocupacaoPercentual', opp.ocupacao_percentual,
            'totalAgendamentos', opp.total_agendamentos
          )
          ORDER BY opp.ocupacao_percentual DESC NULLS LAST, opp.profissional_nome
        )
        FROM ocupacao_por_profissional opp
      ), '[]'::json) AS ocupacao_por_profissional,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'faixa', apf.faixa,
            'agendamentos', apf.agendamentos,
            'cancelamentos', apf.cancelamentos
          )
          ORDER BY apf.ordem
        )
        FROM agendamentos_por_faixa apf
      ), '[]'::json) AS agendamentos_por_faixa_horario,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'horario', hmp.horario,
            'quantidade', hmp.quantidade,
            'cancelamentos', hmp.cancelamentos,
            'percentualCancelamento', hmp.percentual_cancelamento
          )
          ORDER BY (hmp.quantidade + hmp.cancelamentos) DESC, hmp.horario
        )
        FROM horarios_mais_procurados hmp
      ), '[]'::json) AS horarios_mais_procurados,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'agendId', ah.agend_id,
            'inicio', ah.inicio,
            'fim', ah.fim,
            'cliente', ah.cliente,
            'servico', ah.servico,
            'profissional', ah.profissional,
            'status', ah.status,
            'cancelado', ah.cancelado,
            'empresa', ah.empresa
          )
          ORDER BY ah.inicio, ah.profissional, ah.cliente
        )
        FROM agenda_hoje ah
      ), '[]'::json) AS agenda_hoje,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'data', (phl.janela_inicio AT TIME ZONE '${TIMEZONE}')::date,
            'inicio', to_char(phl.janela_inicio AT TIME ZONE '${TIMEZONE}', 'HH24:MI'),
            'fim', to_char(phl.janela_fim AT TIME ZONE '${TIMEZONE}', 'HH24:MI'),
            'duracaoMin', phl.duracao_min,
            'profissional', phl.profissional_nome,
            'empresa', ${isSuperAdmin ? 'phl.empresa_nome' : 'NULL'}
          )
          ORDER BY phl.janela_inicio, phl.profissional_nome
        )
        FROM proximos_horarios_livres phl
      ), '[]'::json) AS proximos_horarios_livres,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'inicio', to_char(joh.janela_inicio AT TIME ZONE '${TIMEZONE}', 'HH24:MI'),
            'fim', to_char(joh.janela_fim AT TIME ZONE '${TIMEZONE}', 'HH24:MI'),
            'duracaoMin', joh.duracao_min,
            'profissional', joh.profissional_nome,
            'empresa', ${isSuperAdmin ? 'joh.empresa_nome' : 'NULL'}
          )
          ORDER BY joh.duracao_min DESC, joh.janela_inicio, joh.profissional_nome
        )
        FROM janelas_ociosas_hoje joh
      ), '[]'::json) AS janelas_ociosas_hoje,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'profissional', psah.profissional,
            'empresa', psah.empresa,
            'expediente', psah.expediente,
            'status', psah.status
          )
          ORDER BY psah.profissional
        )
        FROM profissionais_sem_agendamento_hoje psah
      ), '[]'::json) AS profissionais_sem_agendamento_hoje,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'data', dmo.dia,
            'diaSemana', dmo.dia_semana,
            'ocupacaoPercentual', dmo.ocupacao_percentual,
            'minutosOcupados', dmo.minutos_ocupados,
            'minutosDisponiveis', dmo.minutos_disponiveis,
            'totalAgendamentos', dmo.total_agendamentos
          )
          ORDER BY dmo.ocupacao_percentual DESC NULLS LAST, dmo.minutos_ocupados DESC, dmo.dia
        )
        FROM dias_maior_ocupacao dmo
      ), '[]'::json) AS dias_maior_ocupacao,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'data', dmo.dia,
            'diaSemana', dmo.dia_semana,
            'ocupacaoPercentual', dmo.ocupacao_percentual,
            'minutosOcupados', dmo.minutos_ocupados,
            'minutosDisponiveis', dmo.minutos_disponiveis,
            'totalAgendamentos', dmo.total_agendamentos
          )
          ORDER BY dmo.ocupacao_percentual ASC NULLS LAST, dmo.minutos_ocupados ASC, dmo.dia
        )
        FROM dias_menor_ocupacao dmo
      ), '[]'::json) AS dias_menor_ocupacao
    FROM capacidade cap
    CROSS JOIN ocupacao oc
    LEFT JOIN LATERAL (
      SELECT *
      FROM proximas_janelas
      ORDER BY janela_inicio, profissional_nome
      LIMIT 1
    ) pj ON true
  `, scopedParams(empresaId, isSuperAdmin))

  const row = result.rows[0] || {}
  const proximoHorarioLivre = row.proximo_horario_livre_hora
    ? {
      hora: row.proximo_horario_livre_hora,
      profissional: row.proximo_horario_livre_profissional,
      empresa: row.proximo_horario_livre_empresa,
    }
    : null

  return {
    cards: {
      ocupacaoHoje: toNullableNumber(row.ocupacao_hoje),
      ocupacaoSemana: toNullableNumber(row.ocupacao_semana),
      horasDisponiveisHoje: toNullableNumber(row.horas_disponiveis_hoje),
      horasOcupadasHoje: toNumber(row.horas_ocupadas_hoje),
      proximoHorarioLivre,
      profissionaisAtivosHoje: toInt(row.profissionais_ativos_hoje),
      agendamentosRestantesHoje: toInt(row.agendamentos_restantes_hoje),
      cancelamentosHoje: toInt(row.cancelamentos_hoje),
      disponibilidadeCalculavelHoje: Boolean(row.disponibilidade_calculavel_hoje),
      disponibilidadeCalculavelSemana: Boolean(row.disponibilidade_calculavel_semana),
    },
    graficos: {
      ocupacaoPorDiaSemana: row.ocupacao_por_dia_semana || [],
      ocupacaoPorProfissional: row.ocupacao_por_profissional || [],
      agendamentosPorFaixaHorario: row.agendamentos_por_faixa_horario || [],
      horariosMaisProcurados: row.horarios_mais_procurados || [],
    },
    tabelas: {
      agendaHoje: row.agenda_hoje || [],
      proximosHorariosLivres: row.proximos_horarios_livres || [],
      janelasOciosasHoje: row.janelas_ociosas_hoje || [],
      profissionaisSemAgendamentoHoje: row.profissionais_sem_agendamento_hoje || [],
      diasMaiorOcupacao: row.dias_maior_ocupacao || [],
      diasMenorOcupacao: row.dias_menor_ocupacao || [],
    },
  }
}

async function getClientesCards(empresaId, isSuperAdmin) {
  const result = await pool.query(`
    WITH periodo AS (
      SELECT
        (CURRENT_TIMESTAMP AT TIME ZONE '${TIMEZONE}')::date AS hoje,
        CURRENT_TIMESTAMP AS agora,
        date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE '${TIMEZONE}')::date AS inicio_mes,
        (date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE '${TIMEZONE}') + INTERVAL '1 month')::date AS fim_mes,
        (date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE '${TIMEZONE}') - INTERVAL '11 months')::date AS inicio_12_meses,
        ((CURRENT_TIMESTAMP AT TIME ZONE '${TIMEZONE}')::date - INTERVAL '30 days')::date AS inicio_30_dias,
        ((CURRENT_TIMESTAMP AT TIME ZONE '${TIMEZONE}')::date - INTERVAL '60 days')::date AS limite_inativo,
        ((CURRENT_TIMESTAMP AT TIME ZONE '${TIMEZONE}')::date - INTERVAL '365 days')::date AS limite_base_antiga,
        ((CURRENT_TIMESTAMP AT TIME ZONE '${TIMEZONE}')::date + INTERVAL '7 days')::date AS fim_retorno
    ),
    meses_periodo AS (
      SELECT generate_series(
        (SELECT inicio_12_meses FROM periodo),
        (SELECT inicio_mes FROM periodo),
        INTERVAL '1 month'
      )::date AS mes_inicio
    ),
    meses_rotulados AS (
      SELECT
        mes_inicio,
        (mes_inicio + INTERVAL '1 month')::date AS mes_fim,
        to_char(mes_inicio, 'YYYY-MM') AS mes,
        CASE EXTRACT(MONTH FROM mes_inicio)::int
          WHEN 1 THEN 'Jan'
          WHEN 2 THEN 'Fev'
          WHEN 3 THEN 'Mar'
          WHEN 4 THEN 'Abr'
          WHEN 5 THEN 'Mai'
          WHEN 6 THEN 'Jun'
          WHEN 7 THEN 'Jul'
          WHEN 8 THEN 'Ago'
          WHEN 9 THEN 'Set'
          WHEN 10 THEN 'Out'
          WHEN 11 THEN 'Nov'
          ELSE 'Dez'
        END || '/' || EXTRACT(YEAR FROM mes_inicio)::int AS label
      FROM meses_periodo
    ),
    status_classificado AS (
      SELECT
        status_agend_id,
        status_agend_nome,
        LOWER(status_agend_nome) LIKE '%cancel%' AS cancelado
      FROM status_agend
    ),
    clientes_base AS (
      SELECT
        c.clientes_id,
        c.empresa_id,
        c.clientes_nome,
        c.clientes_telefone,
        c.clientes_dt_criacao
      FROM clientes c
      WHERE true
        ${scopedAnd('c', isSuperAdmin)}
    ),
    agendamentos_base AS (
      SELECT
        a.agend_id,
        a.empresa_id,
        a.clientes_id,
        a.agend_data,
        a.agend_inicio,
        a.agend_valor,
        sc.status_agend_nome,
        sc.cancelado
      FROM agendamento a
      JOIN status_classificado sc ON sc.status_agend_id = a.status_agend_id
      WHERE true
        ${scopedAnd('a', isSuperAdmin)}
    ),
    receita_servicos AS (
      SELECT
        ags.agend_id,
        SUM(ags.valor_aplicado)::numeric AS valor_servicos
      FROM agendamento_servico ags
      JOIN agendamentos_base a ON a.agend_id = ags.agend_id
      GROUP BY ags.agend_id
    ),
    valores_agendamento AS (
      SELECT
        a.agend_id,
        a.empresa_id,
        a.clientes_id,
        a.agend_data,
        a.agend_inicio,
        a.cancelado,
        NOT a.cancelado AS atividade_real,
        COALESCE(rs.valor_servicos, a.agend_valor, 0)::numeric AS valor_total
      FROM agendamentos_base a
      LEFT JOIN receita_servicos rs ON rs.agend_id = a.agend_id
    ),
    agendamentos_validos AS (
      SELECT *
      FROM valores_agendamento
      WHERE atividade_real
    ),
    agendamentos_validos_passados AS (
      SELECT *
      FROM agendamentos_validos
      WHERE agend_inicio <= (SELECT agora FROM periodo)
    ),
    clientes_mes AS (
      SELECT
        clientes_id,
        COUNT(DISTINCT agend_id) AS total_agendamentos,
        COALESCE(SUM(valor_total), 0)::numeric AS receita_total
      FROM agendamentos_validos
      WHERE agend_data >= (SELECT inicio_mes FROM periodo)
        AND agend_data < (SELECT fim_mes FROM periodo)
      GROUP BY clientes_id
    ),
    clientes_recorrentes_mes AS (
      SELECT clientes_id
      FROM clientes_mes
      WHERE total_agendamentos >= 2
    ),
    clientes_ativos_30_dias AS (
      SELECT DISTINCT clientes_id
      FROM agendamentos_validos_passados
      WHERE agend_data >= (SELECT inicio_30_dias FROM periodo)
        AND agend_data <= (SELECT hoje FROM periodo)
    ),
    clientes_historico AS (
      SELECT
        cb.clientes_id,
        MAX(avp.agend_data) AS ultimo_agendamento,
        COUNT(DISTINCT avp.agend_id) AS total_agendamentos,
        COALESCE(SUM(avp.valor_total), 0)::numeric AS receita_historica,
        EXISTS (
          SELECT 1
          FROM agendamentos_validos avf
          WHERE avf.clientes_id = cb.clientes_id
            AND avf.agend_inicio > (SELECT agora FROM periodo)
        ) AS possui_agendamento_futuro
      FROM clientes_base cb
      LEFT JOIN agendamentos_validos_passados avp ON avp.clientes_id = cb.clientes_id
      GROUP BY cb.clientes_id
    ),
    clientes_inativos AS (
      SELECT *
      FROM clientes_historico
      WHERE total_agendamentos > 0
        AND NOT possui_agendamento_futuro
        -- Mantemos a métrica acionável: clientes muito antigos ficam fora
        -- para não inflar a leitura operacional de reativação.
        AND ultimo_agendamento < (SELECT limite_inativo FROM periodo)
        AND ultimo_agendamento >= (SELECT limite_base_antiga FROM periodo)
    ),
    intervalos_cliente AS (
      SELECT
        clientes_id,
        agend_data,
        LAG(agend_data) OVER (PARTITION BY clientes_id ORDER BY agend_data, agend_inicio) AS agend_data_anterior
      FROM agendamentos_validos_passados
    ),
    retorno_base AS (
      SELECT
        clientes_id,
        MAX(agend_data) AS ultimo_agendamento,
        ROUND(AVG(agend_data - agend_data_anterior) FILTER (
          WHERE agend_data_anterior IS NOT NULL
            AND agend_data > agend_data_anterior
        ))::int AS media_intervalo_dias
      FROM intervalos_cliente
      GROUP BY clientes_id
      HAVING COUNT(*) >= 2
        AND COUNT(*) FILTER (
          WHERE agend_data_anterior IS NOT NULL
            AND agend_data > agend_data_anterior
        ) > 0
    ),
    retorno_previsto AS (
      SELECT
        rb.clientes_id,
        rb.ultimo_agendamento,
        rb.media_intervalo_dias,
        (rb.ultimo_agendamento + rb.media_intervalo_dias) AS data_prevista
      FROM retorno_base rb
      WHERE rb.media_intervalo_dias IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM agendamentos_validos avf
          WHERE avf.clientes_id = rb.clientes_id
            AND avf.agend_inicio > (SELECT agora FROM periodo)
        )
    ),
    clientes_retorno_previsto AS (
      SELECT *
      FROM retorno_previsto
      WHERE data_prevista <= (SELECT fim_retorno FROM periodo)
    ),
    receita_recorrentes AS (
      SELECT COALESCE(SUM(av.valor_total), 0)::numeric AS total
      FROM agendamentos_validos av
      JOIN clientes_recorrentes_mes crm ON crm.clientes_id = av.clientes_id
      WHERE av.agend_data >= (SELECT inicio_mes FROM periodo)
        AND av.agend_data < (SELECT fim_mes FROM periodo)
    ),
    totais_mes AS (
      SELECT
        COUNT(DISTINCT agend_id) AS agendamentos_mes,
        COUNT(DISTINCT clientes_id) AS clientes_com_agendamento_mes,
        COALESCE(SUM(valor_total), 0)::numeric AS receita_mes
      FROM agendamentos_validos
      WHERE agend_data >= (SELECT inicio_mes FROM periodo)
        AND agend_data < (SELECT fim_mes FROM periodo)
    ),
    primeiro_agendamento_cliente AS (
      SELECT
        clientes_id,
        MIN(agend_data) AS primeiro_agendamento
      FROM agendamentos_validos
      GROUP BY clientes_id
    ),
    novos_clientes_por_mes AS (
      SELECT
        mr.mes,
        mr.label,
        COUNT(DISTINCT cb.clientes_id) AS clientes_novos
      FROM meses_rotulados mr
      LEFT JOIN clientes_base cb
        ON (cb.clientes_dt_criacao AT TIME ZONE '${TIMEZONE}')::date >= mr.mes_inicio
        AND (cb.clientes_dt_criacao AT TIME ZONE '${TIMEZONE}')::date < mr.mes_fim
      GROUP BY mr.mes, mr.label, mr.mes_inicio
      ORDER BY mr.mes_inicio
    ),
    clientes_ativos_por_mes AS (
      SELECT
        mr.mes_inicio,
        mr.mes,
        mr.label,
        av.clientes_id,
        COUNT(DISTINCT av.agend_id) AS agendamentos_mes,
        COALESCE(SUM(av.valor_total), 0)::numeric AS receita_mes
      FROM meses_rotulados mr
      LEFT JOIN agendamentos_validos av
        ON av.agend_data >= mr.mes_inicio
        AND av.agend_data < mr.mes_fim
      GROUP BY mr.mes_inicio, mr.mes, mr.label, av.clientes_id
    ),
    novos_vs_recorrentes AS (
      SELECT
        mr.mes,
        mr.label,
        (
          SELECT COUNT(DISTINCT cb.clientes_id)
          FROM clientes_base cb
          WHERE (cb.clientes_dt_criacao AT TIME ZONE '${TIMEZONE}')::date >= mr.mes_inicio
            AND (cb.clientes_dt_criacao AT TIME ZONE '${TIMEZONE}')::date < mr.mes_fim
        ) AS novos,
        (
          SELECT COUNT(DISTINCT av.clientes_id)
          FROM agendamentos_validos av
          WHERE av.agend_data >= mr.mes_inicio
            AND av.agend_data < mr.mes_fim
            AND EXISTS (
              SELECT 1
              FROM agendamentos_validos av_ant
              WHERE av_ant.clientes_id = av.clientes_id
                AND av_ant.agend_data < mr.mes_inicio
            )
        ) AS recorrentes
      FROM meses_rotulados mr
      ORDER BY mr.mes_inicio
    ),
    frequencia_cliente AS (
      SELECT
        cb.clientes_id,
        COUNT(DISTINCT av.agend_id) AS total_agendamentos
      FROM clientes_base cb
      JOIN agendamentos_validos av ON av.clientes_id = cb.clientes_id
      GROUP BY cb.clientes_id
    ),
    faixas_frequencia(ordem, faixa) AS (
      VALUES
        (1, '1 agendamento'),
        (2, '2 agendamentos'),
        (3, '3 a 5 agendamentos'),
        (4, '6 a 10 agendamentos'),
        (5, 'Mais de 10 agendamentos')
    ),
    clientes_por_frequencia AS (
      SELECT
        ff.ordem,
        ff.faixa,
        COUNT(fc.clientes_id) FILTER (
          WHERE CASE ff.ordem
            WHEN 1 THEN fc.total_agendamentos = 1
            WHEN 2 THEN fc.total_agendamentos = 2
            WHEN 3 THEN fc.total_agendamentos BETWEEN 3 AND 5
            WHEN 4 THEN fc.total_agendamentos BETWEEN 6 AND 10
            ELSE fc.total_agendamentos > 10
          END
        ) AS clientes
      FROM faixas_frequencia ff
      LEFT JOIN frequencia_cliente fc ON true
      GROUP BY ff.ordem, ff.faixa
      ORDER BY ff.ordem
    ),
    receita_por_perfil_cliente AS (
      SELECT
        perfil,
        COALESCE(SUM(receita), 0)::numeric AS receita,
        COUNT(DISTINCT clientes_id) AS clientes
      FROM (
        SELECT
          cm.clientes_id,
          CASE
            WHEN pac.primeiro_agendamento >= (SELECT inicio_mes FROM periodo)
              AND pac.primeiro_agendamento < (SELECT fim_mes FROM periodo)
              THEN 'Novo'
            ELSE 'Recorrente'
          END AS perfil,
          cm.receita_total AS receita
        FROM clientes_mes cm
        JOIN primeiro_agendamento_cliente pac ON pac.clientes_id = cm.clientes_id
      ) perfis
      GROUP BY perfil
    ),
    perfis_cliente(perfil, ordem) AS (
      VALUES
        ('Novo', 1),
        ('Recorrente', 2)
    ),
    receita_por_perfil_final AS (
      SELECT
        pc.perfil,
        COALESCE(rpp.receita, 0)::numeric AS receita,
        COALESCE(rpp.clientes, 0) AS clientes,
        pc.ordem
      FROM perfis_cliente pc
      LEFT JOIN receita_por_perfil_cliente rpp ON rpp.perfil = pc.perfil
      ORDER BY pc.ordem
    ),
    retencao_mensal AS (
      SELECT
        mr.mes,
        mr.label,
        COUNT(DISTINCT capm.clientes_id) FILTER (WHERE capm.clientes_id IS NOT NULL) AS clientes_ativos,
        COUNT(DISTINCT capm.clientes_id) FILTER (
          WHERE capm.clientes_id IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM agendamentos_validos av_ant
              WHERE av_ant.clientes_id = capm.clientes_id
                AND av_ant.agend_data < mr.mes_inicio
            )
        ) AS clientes_retornaram
      FROM meses_rotulados mr
      LEFT JOIN clientes_ativos_por_mes capm
        ON capm.mes_inicio = mr.mes_inicio
        AND capm.clientes_id IS NOT NULL
      GROUP BY mr.mes, mr.label, mr.mes_inicio
      ORDER BY mr.mes_inicio
    ),
    clientes_resumo_mes AS (
      SELECT
        cb.clientes_id,
        cb.clientes_nome,
        cb.clientes_telefone,
        CASE WHEN ${isSuperAdmin ? 'true' : 'false'} THEN e.empresa_nome ELSE NULL END AS empresa_nome,
        COUNT(DISTINCT av.agend_id) AS quantidade_agendamentos,
        COALESCE(SUM(av.valor_total), 0)::numeric AS receita_total,
        MAX(av.agend_data) AS ultimo_agendamento
      FROM clientes_base cb
      JOIN empresa e ON e.empresa_id = cb.empresa_id
      JOIN agendamentos_validos av ON av.clientes_id = cb.clientes_id
      WHERE av.agend_data >= (SELECT inicio_mes FROM periodo)
        AND av.agend_data < (SELECT fim_mes FROM periodo)
      GROUP BY
        cb.clientes_id,
        cb.clientes_nome,
        cb.clientes_telefone,
        e.empresa_nome
    ),
    top_clientes_receita AS (
      SELECT *
      FROM clientes_resumo_mes
      ORDER BY receita_total DESC, quantidade_agendamentos DESC, ultimo_agendamento DESC, clientes_nome
      LIMIT 10
    ),
    top_clientes_agendamentos AS (
      SELECT *
      FROM clientes_resumo_mes
      ORDER BY quantidade_agendamentos DESC, receita_total DESC, ultimo_agendamento DESC, clientes_nome
      LIMIT 10
    ),
    clientes_resumo_historico AS (
      SELECT
        cb.clientes_id,
        cb.clientes_nome,
        cb.clientes_telefone,
        cb.clientes_dt_criacao,
        CASE WHEN ${isSuperAdmin ? 'true' : 'false'} THEN e.empresa_nome ELSE NULL END AS empresa_nome,
        COUNT(DISTINCT avp.agend_id) AS total_agendamentos,
        COALESCE(SUM(avp.valor_total), 0)::numeric AS receita_historica,
        MIN(avp.agend_data) AS primeiro_agendamento,
        MAX(avp.agend_data) AS ultimo_agendamento
      FROM clientes_base cb
      JOIN empresa e ON e.empresa_id = cb.empresa_id
      LEFT JOIN agendamentos_validos_passados avp ON avp.clientes_id = cb.clientes_id
      GROUP BY
        cb.clientes_id,
        cb.clientes_nome,
        cb.clientes_telefone,
        cb.clientes_dt_criacao,
        e.empresa_nome
    ),
    clientes_inativos_tabela AS (
      SELECT
        crh.clientes_id,
        crh.clientes_nome,
        crh.clientes_telefone,
        crh.empresa_nome,
        ci.ultimo_agendamento,
        ((SELECT hoje FROM periodo) - ci.ultimo_agendamento)::int AS dias_sem_agendar,
        ci.total_agendamentos,
        ci.receita_historica
      FROM clientes_inativos ci
      JOIN clientes_resumo_historico crh ON crh.clientes_id = ci.clientes_id
      ORDER BY ci.receita_historica DESC, ((SELECT hoje FROM periodo) - ci.ultimo_agendamento)::int DESC, crh.clientes_nome
      LIMIT 20
    ),
    clientes_retorno_provavel_tabela AS (
      SELECT
        crh.clientes_id,
        crh.clientes_nome,
        crh.clientes_telefone,
        crh.empresa_nome,
        rp.ultimo_agendamento,
        rp.media_intervalo_dias,
        rp.data_prevista,
        CASE
          WHEN rp.data_prevista < (SELECT hoje FROM periodo) THEN 'Atrasado'
          ELSE 'Previsto'
        END AS status_retorno
      FROM clientes_retorno_previsto rp
      JOIN clientes_resumo_historico crh ON crh.clientes_id = rp.clientes_id
      ORDER BY
        CASE WHEN rp.data_prevista < (SELECT hoje FROM periodo) THEN 0 ELSE 1 END,
        rp.data_prevista,
        crh.clientes_nome
      LIMIT 20
    ),
    ultimos_clientes AS (
      SELECT
        crh.clientes_id,
        crh.clientes_nome,
        crh.clientes_telefone,
        crh.empresa_nome,
        (crh.clientes_dt_criacao AT TIME ZONE '${TIMEZONE}')::date AS data_cadastro,
        crh.primeiro_agendamento,
        crh.total_agendamentos
      FROM clientes_resumo_historico crh
      ORDER BY
        (crh.clientes_dt_criacao AT TIME ZONE '${TIMEZONE}')::date DESC NULLS LAST,
        crh.primeiro_agendamento DESC NULLS LAST,
        crh.clientes_nome
      LIMIT 20
    )
    SELECT
      COUNT(DISTINCT cb.clientes_id) FILTER (
        WHERE (cb.clientes_dt_criacao AT TIME ZONE '${TIMEZONE}')::date >= (SELECT inicio_mes FROM periodo)
          AND (cb.clientes_dt_criacao AT TIME ZONE '${TIMEZONE}')::date < (SELECT fim_mes FROM periodo)
      ) AS clientes_novos_mes,
      (SELECT COUNT(*) FROM clientes_recorrentes_mes) AS clientes_recorrentes_mes,
      (SELECT COUNT(*) FROM clientes_ativos_30_dias) AS clientes_ativos_30_dias,
      (SELECT COUNT(*) FROM clientes_inativos) AS clientes_inativos,
      CASE
        WHEN tm.clientes_com_agendamento_mes > 0
          THEN ROUND(tm.receita_mes / tm.clientes_com_agendamento_mes, 2)
        ELSE 0
      END AS ticket_medio_cliente,
      CASE
        WHEN tm.clientes_com_agendamento_mes > 0
          THEN ROUND(tm.agendamentos_mes::numeric / tm.clientes_com_agendamento_mes::numeric, 2)
        ELSE 0
      END AS agendamentos_medios_por_cliente,
      rr.total AS receita_clientes_recorrentes,
      (SELECT COUNT(*) FROM clientes_retorno_previsto) AS clientes_com_retorno_previsto,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'mes', ncpm.mes,
            'label', ncpm.label,
            'clientesNovos', ncpm.clientes_novos
          )
          ORDER BY ncpm.mes
        )
        FROM novos_clientes_por_mes ncpm
      ), '[]'::json) AS novos_clientes_por_mes,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'mes', nvr.mes,
            'label', nvr.label,
            'novos', nvr.novos,
            'recorrentes', nvr.recorrentes
          )
          ORDER BY nvr.mes
        )
        FROM novos_vs_recorrentes nvr
      ), '[]'::json) AS novos_vs_recorrentes,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'faixa', cpf.faixa,
            'clientes', cpf.clientes
          )
          ORDER BY cpf.ordem
        )
        FROM clientes_por_frequencia cpf
      ), '[]'::json) AS clientes_por_frequencia,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'perfil', rppf.perfil,
            'receita', rppf.receita,
            'clientes', rppf.clientes
          )
          ORDER BY rppf.ordem
        )
        FROM receita_por_perfil_final rppf
      ), '[]'::json) AS receita_por_perfil_cliente,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'mes', rm.mes,
            'label', rm.label,
            'clientesAtivos', rm.clientes_ativos,
            'clientesRetornaram', rm.clientes_retornaram,
            'taxaRetencao', CASE
              WHEN rm.clientes_ativos > 0
                THEN ROUND((rm.clientes_retornaram::numeric / rm.clientes_ativos::numeric) * 100, 1)
              ELSE NULL
            END
          )
          ORDER BY rm.mes
        )
        FROM retencao_mensal rm
      ), '[]'::json) AS retencao_mensal,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'clienteId', tcr.clientes_id,
            'cliente', tcr.clientes_nome,
            'telefone', tcr.clientes_telefone,
            'receitaTotal', tcr.receita_total,
            'quantidadeAgendamentos', tcr.quantidade_agendamentos,
            'ultimoAgendamento', tcr.ultimo_agendamento,
            'empresa', tcr.empresa_nome
          )
          ORDER BY tcr.receita_total DESC, tcr.quantidade_agendamentos DESC, tcr.ultimo_agendamento DESC
        )
        FROM top_clientes_receita tcr
      ), '[]'::json) AS top_clientes_receita,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'clienteId', tca.clientes_id,
            'cliente', tca.clientes_nome,
            'telefone', tca.clientes_telefone,
            'quantidadeAgendamentos', tca.quantidade_agendamentos,
            'receitaTotal', tca.receita_total,
            'ultimoAgendamento', tca.ultimo_agendamento,
            'empresa', tca.empresa_nome
          )
          ORDER BY tca.quantidade_agendamentos DESC, tca.receita_total DESC, tca.ultimo_agendamento DESC
        )
        FROM top_clientes_agendamentos tca
      ), '[]'::json) AS top_clientes_agendamentos,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'clienteId', cit.clientes_id,
            'cliente', cit.clientes_nome,
            'telefone', cit.clientes_telefone,
            'ultimoAgendamento', cit.ultimo_agendamento,
            'diasSemAgendar', cit.dias_sem_agendar,
            'totalAgendamentos', cit.total_agendamentos,
            'receitaHistorica', cit.receita_historica,
            'empresa', cit.empresa_nome
          )
          ORDER BY cit.receita_historica DESC, cit.dias_sem_agendar DESC
        )
        FROM clientes_inativos_tabela cit
      ), '[]'::json) AS clientes_inativos_tabela,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'clienteId', crpt.clientes_id,
            'cliente', crpt.clientes_nome,
            'telefone', crpt.clientes_telefone,
            'ultimoAgendamento', crpt.ultimo_agendamento,
            'mediaDiasEntreAgendamentos', crpt.media_intervalo_dias,
            'retornoPrevisto', crpt.data_prevista,
            'status', crpt.status_retorno,
            'empresa', crpt.empresa_nome
          )
          ORDER BY
            CASE WHEN crpt.status_retorno = 'Atrasado' THEN 0 ELSE 1 END,
            crpt.data_prevista
        )
        FROM clientes_retorno_provavel_tabela crpt
      ), '[]'::json) AS clientes_retorno_provavel,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'clienteId', uc.clientes_id,
            'cliente', uc.clientes_nome,
            'telefone', uc.clientes_telefone,
            'dataCadastro', uc.data_cadastro,
            'primeiroAgendamento', uc.primeiro_agendamento,
            'totalAgendamentos', uc.total_agendamentos,
            'empresa', uc.empresa_nome
          )
          ORDER BY uc.data_cadastro DESC NULLS LAST, uc.primeiro_agendamento DESC NULLS LAST
        )
        FROM ultimos_clientes uc
      ), '[]'::json) AS ultimos_clientes
    FROM clientes_base cb
    CROSS JOIN totais_mes tm
    CROSS JOIN receita_recorrentes rr
    GROUP BY
      tm.clientes_com_agendamento_mes,
      tm.receita_mes,
      tm.agendamentos_mes,
      rr.total
  `, scopedParams(empresaId, isSuperAdmin))

  const row = result.rows[0] || {}

  return {
    cards: {
      clientesNovosMes: toInt(row.clientes_novos_mes),
      clientesRecorrentesMes: toInt(row.clientes_recorrentes_mes),
      clientesAtivos30Dias: toInt(row.clientes_ativos_30_dias),
      clientesInativos: toInt(row.clientes_inativos),
      ticketMedioCliente: toNumber(row.ticket_medio_cliente),
      agendamentosMediosPorCliente: toNumber(row.agendamentos_medios_por_cliente),
      receitaClientesRecorrentes: toNumber(row.receita_clientes_recorrentes),
      clientesComRetornoPrevisto: toInt(row.clientes_com_retorno_previsto),
    },
    graficos: {
      novosClientesPorMes: row.novos_clientes_por_mes || [],
      novosVsRecorrentes: row.novos_vs_recorrentes || [],
      clientesPorFrequencia: row.clientes_por_frequencia || [],
      receitaPorPerfilCliente: row.receita_por_perfil_cliente || [],
      retencaoMensal: row.retencao_mensal || [],
    },
    tabelas: {
      topClientesReceita: row.top_clientes_receita || [],
      topClientesAgendamentos: row.top_clientes_agendamentos || [],
      clientesInativos: row.clientes_inativos_tabela || [],
      clientesRetornoProvavel: row.clientes_retorno_provavel || [],
      ultimosClientes: row.ultimos_clientes || [],
    },
  }
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
  async getClientes({ empresaId, isSuperAdmin }) {
    return getClientesCards(empresaId, isSuperAdmin)
  },

  async getGestaoAgenda({ empresaId, isSuperAdmin }) {
    return getGestaoAgendaCards(empresaId, isSuperAdmin)
  },

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
