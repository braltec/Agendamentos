import { useEffect, useState } from 'react'
import {
  Activity,
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Percent,
  Timer,
  Users,
  XCircle,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Card, { CardBody, CardHeader } from '../../components/ui/Card'
import dashboardService from '../../services/dashboard.service'

const EMPTY_DATA = {
  cards: {
    ocupacaoHoje: null,
    ocupacaoSemana: null,
    horasDisponiveisHoje: null,
    horasOcupadasHoje: 0,
    proximoHorarioLivre: null,
    profissionaisAtivosHoje: 0,
    agendamentosRestantesHoje: 0,
    cancelamentosHoje: 0,
    disponibilidadeCalculavelHoje: false,
    disponibilidadeCalculavelSemana: false,
  },
  graficos: {
    ocupacaoPorDiaSemana: [],
    ocupacaoPorProfissional: [],
    agendamentosPorFaixaHorario: [],
    horariosMaisProcurados: [],
  },
}

const chartColors = {
  blue: '#3B82F6',
  green: '#10B981',
  red: '#EF4444',
  orange: '#F59E0B',
  purple: '#8B5CF6',
  gray: '#6B7280',
}

function formatPercent(value) {
  if (value === null || value === undefined) return 'Sem dados'

  return `${Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}%`
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('pt-BR')
}

function formatDurationFromHours(value) {
  if (value === null || value === undefined) return 'Sem dados'

  const totalMinutes = Math.max(0, Math.round(Number(value || 0) * 60))
  return formatDurationFromMinutes(totalMinutes)
}

function formatDurationFromMinutes(value) {
  if (value === null || value === undefined) return 'Sem dados'

  const totalMinutes = Math.max(0, Math.round(Number(value || 0)))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0 && minutes > 0) return `${hours}h${String(minutes).padStart(2, '0')}`
  if (hours > 0) return `${hours}h`
  return `${minutes}min`
}

function truncateLabel(value, maxLength = 18) {
  const label = String(value || '')
  if (label.length <= maxLength) return label
  return `${label.slice(0, maxLength - 1)}...`
}

function AgendaMetricCard({ title, value, helper, icon: Icon, tone = 'blue', muted = false }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
    gray: 'bg-gray-100 text-gray-600',
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardBody className="h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className={`${muted ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 break-words`}>
              {value}
            </p>
            {helper && <p className="text-xs text-gray-500 mt-1">{helper}</p>}
          </div>
          <div className={`p-3 rounded-lg shrink-0 ${tones[tone] || tones.blue}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

function LoadingState() {
  return <div className="text-center py-10 text-gray-500">Carregando...</div>
}

function EmptyState({ icon: Icon = AlertCircle, children }) {
  return (
    <div className="text-center py-10 text-gray-500">
      <Icon className="w-11 h-11 mx-auto mb-3 text-gray-400" />
      <p>{children}</p>
    </div>
  )
}

function ChartCard({ title, description, loading, isEmpty, emptyMessage, emptyIcon: EmptyIcon, children }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
      </CardHeader>
      <CardBody>
        {loading ? (
          <LoadingState />
        ) : isEmpty ? (
          <EmptyState icon={EmptyIcon}>{emptyMessage}</EmptyState>
        ) : (
          children
        )}
      </CardBody>
    </Card>
  )
}

function TooltipContainer({ title, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2">
      <p className="text-sm font-semibold text-gray-900 mb-2">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function TooltipRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-5 text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  )
}

function OcupacaoTooltip({ active, payload }) {
  if (!active || !payload?.length) return null

  const data = payload[0].payload
  const title = data.profissionalNome || `${data.dia} - ${data.data}`

  return (
    <TooltipContainer title={title}>
      {data.empresaNome && <TooltipRow label="Empresa" value={data.empresaNome} />}
      <TooltipRow label="Ocupação" value={formatPercent(data.ocupacaoPercentual)} />
      <TooltipRow label="Horas ocupadas" value={formatDurationFromMinutes(data.minutosOcupados)} />
      <TooltipRow label="Horas disponíveis" value={formatDurationFromMinutes(data.minutosDisponiveis)} />
      <TooltipRow label="Agendamentos" value={formatNumber(data.totalAgendamentos)} />
    </TooltipContainer>
  )
}

function FaixaHorarioTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  const data = payload[0].payload

  return (
    <TooltipContainer title={label}>
      <TooltipRow label="Agendamentos" value={formatNumber(data.agendamentos)} />
      <TooltipRow label="Cancelamentos" value={formatNumber(data.cancelamentos)} />
    </TooltipContainer>
  )
}

function HorariosProcuradosTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  const data = payload[0].payload

  return (
    <TooltipContainer title={label}>
      <TooltipRow label="Agendamentos" value={formatNumber(data.quantidade)} />
      <TooltipRow label="Cancelamentos" value={formatNumber(data.cancelamentos)} />
      <TooltipRow label="Cancelamento" value={formatPercent(data.percentualCancelamento)} />
    </TooltipContainer>
  )
}

export default function AgendaDisponibilidade() {
  const [loading, setLoading] = useState(true)
  const [agendaData, setAgendaData] = useState(EMPTY_DATA)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true)
      setErrorMessage('')

      try {
        const response = await dashboardService.getGestaoAgenda()
        setAgendaData(response.data || EMPTY_DATA)
      } catch (error) {
        console.error('Erro ao carregar gestão de agenda:', error)
        setErrorMessage('Não foi possível carregar os dados de agenda agora.')
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [])

  const cards = agendaData?.cards || EMPTY_DATA.cards
  const ocupacaoHojeCalculavel = Boolean(cards.disponibilidadeCalculavelHoje)
  const ocupacaoSemanaCalculavel = Boolean(cards.disponibilidadeCalculavelSemana)
  const proximoHorarioLivre = cards.proximoHorarioLivre
  const graficos = agendaData?.graficos || EMPTY_DATA.graficos
  const ocupacaoPorDiaSemana = (graficos.ocupacaoPorDiaSemana || []).map((item) => ({
    ...item,
    minutosDisponiveis: Number(item.minutosDisponiveis || 0),
    minutosOcupados: Number(item.minutosOcupados || 0),
    ocupacaoPercentual: item.ocupacaoPercentual === null || item.ocupacaoPercentual === undefined
      ? null
      : Number(item.ocupacaoPercentual),
    totalAgendamentos: Number(item.totalAgendamentos || 0),
  }))
  const ocupacaoPorProfissional = (graficos.ocupacaoPorProfissional || []).map((item) => ({
    ...item,
    nomeCurto: truncateLabel(item.profissionalNome, 20),
    minutosDisponiveis: Number(item.minutosDisponiveis || 0),
    minutosOcupados: Number(item.minutosOcupados || 0),
    ocupacaoPercentual: item.ocupacaoPercentual === null || item.ocupacaoPercentual === undefined
      ? null
      : Number(item.ocupacaoPercentual),
    totalAgendamentos: Number(item.totalAgendamentos || 0),
  }))
  const agendamentosPorFaixaHorario = (graficos.agendamentosPorFaixaHorario || []).map((item) => ({
    ...item,
    agendamentos: Number(item.agendamentos || 0),
    cancelamentos: Number(item.cancelamentos || 0),
  }))
  const horariosMaisProcurados = (graficos.horariosMaisProcurados || []).map((item) => ({
    ...item,
    quantidade: Number(item.quantidade || 0),
    cancelamentos: Number(item.cancelamentos || 0),
    percentualCancelamento: Number(item.percentualCancelamento || 0),
  }))
  const temOcupacaoPorDia = ocupacaoPorDiaSemana.some((item) => item.ocupacaoPercentual !== null)
  const temOcupacaoPorProfissional = ocupacaoPorProfissional.some((item) => item.ocupacaoPercentual !== null)
  const temAgendamentosPorFaixa = agendamentosPorFaixaHorario.some(
    (item) => item.agendamentos > 0 || item.cancelamentos > 0,
  )
  const temHorariosProcurados = horariosMaisProcurados.length > 0

  return (
    <div className="space-y-6">
      {errorMessage && (
        <Card className="border-red-200 bg-red-50">
          <CardBody>
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <AgendaMetricCard
          title="Ocupação de hoje"
          value={loading ? '...' : formatPercent(cards.ocupacaoHoje)}
          helper={ocupacaoHojeCalculavel ? 'Minutos ocupados / capacidade de hoje' : 'Sem dados suficientes para calcular'}
          icon={Percent}
          tone={ocupacaoHojeCalculavel ? 'blue' : 'gray'}
          muted={!ocupacaoHojeCalculavel}
        />

        <AgendaMetricCard
          title="Ocupação da semana"
          value={loading ? '...' : formatPercent(cards.ocupacaoSemana)}
          helper={ocupacaoSemanaCalculavel ? 'Minutos ocupados / capacidade semanal' : 'Sem dados suficientes para calcular'}
          icon={Percent}
          tone={ocupacaoSemanaCalculavel ? 'purple' : 'gray'}
          muted={!ocupacaoSemanaCalculavel}
        />

        <AgendaMetricCard
          title="Horas disponíveis hoje"
          value={loading ? '...' : formatDurationFromHours(cards.horasDisponiveisHoje)}
          helper={cards.horasDisponiveisHoje === null ? 'Sem expediente configurado' : 'Capacidade menos horas ocupadas'}
          icon={Clock}
          tone={cards.horasDisponiveisHoje === null ? 'gray' : 'green'}
          muted={cards.horasDisponiveisHoje === null}
        />

        <AgendaMetricCard
          title="Horas ocupadas hoje"
          value={loading ? '...' : formatDurationFromHours(cards.horasOcupadasHoje)}
          helper="Agendamentos ativos pelo intervalo real"
          icon={Timer}
          tone="orange"
        />

        <AgendaMetricCard
          title="Próximo horário livre"
          value={loading ? '...' : (proximoHorarioLivre?.hora || 'Sem horários')}
          helper={
            proximoHorarioLivre
              ? `${proximoHorarioLivre.profissional}${proximoHorarioLivre.empresa ? ` - ${proximoHorarioLivre.empresa}` : ''}`
              : 'Sem horários livres hoje'
          }
          icon={CheckCircle}
          tone={proximoHorarioLivre ? 'green' : 'gray'}
          muted={!proximoHorarioLivre}
        />

        <AgendaMetricCard
          title="Profissionais ativos hoje"
          value={loading ? '...' : formatNumber(cards.profissionaisAtivosHoje)}
          helper="Profissionais ativos com expediente hoje"
          icon={Users}
          tone="blue"
        />

        <AgendaMetricCard
          title="Agendamentos restantes hoje"
          value={loading ? '...' : formatNumber(cards.agendamentosRestantesHoje)}
          helper="Compromissos ativos ainda por iniciar"
          icon={Calendar}
          tone="purple"
        />

        <AgendaMetricCard
          title="Cancelamentos hoje"
          value={loading ? '...' : formatNumber(cards.cancelamentosHoje)}
          helper="Cancelados na data do agendamento"
          icon={XCircle}
          tone="red"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Ocupação por dia da semana"
          description="Semana atual"
          loading={loading}
          isEmpty={!temOcupacaoPorDia}
          emptyMessage="Sem dados suficientes para calcular ocupação."
          emptyIcon={Activity}
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ocupacaoPorDiaSemana}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="dia" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  tickFormatter={(value) => `${Number(value || 0).toLocaleString('pt-BR')}%`}
                />
                <Tooltip content={<OcupacaoTooltip />} />
                <Bar
                  dataKey="ocupacaoPercentual"
                  name="Ocupação"
                  fill={chartColors.blue}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Ocupação por profissional"
          description="Semana atual"
          loading={loading}
          isEmpty={!temOcupacaoPorProfissional}
          emptyMessage="Sem dados suficientes para calcular ocupação."
          emptyIcon={Users}
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ocupacaoPorProfissional}
                layout="vertical"
                margin={{ left: 18, right: 18 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis
                  type="number"
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  tickFormatter={(value) => `${Number(value || 0).toLocaleString('pt-BR')}%`}
                />
                <YAxis
                  type="category"
                  dataKey="nomeCurto"
                  width={150}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <Tooltip content={<OcupacaoTooltip />} />
                <Bar
                  dataKey="ocupacaoPercentual"
                  name="Ocupação"
                  fill={chartColors.purple}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Agendamentos por faixa de horário"
          description="Mês atual"
          loading={loading}
          isEmpty={!temAgendamentosPorFaixa}
          emptyMessage="Nenhum agendamento encontrado para o período."
          emptyIcon={Clock}
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agendamentosPorFaixaHorario}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="faixa" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip content={<FaixaHorarioTooltip />} />
                <Legend />
                <Bar
                  dataKey="agendamentos"
                  name="Agendamentos"
                  fill={chartColors.green}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="cancelamentos"
                  name="Cancelamentos"
                  fill={chartColors.red}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Horários mais procurados"
          description="Top 10 do mês atual"
          loading={loading}
          isEmpty={!temHorariosProcurados}
          emptyMessage="Ainda não há dados para este período."
          emptyIcon={BarChart3}
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={horariosMaisProcurados}
                layout="vertical"
                margin={{ left: 8, right: 18 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="horario"
                  width={70}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <Tooltip content={<HorariosProcuradosTooltip />} />
                <Legend />
                <Bar
                  dataKey="quantidade"
                  name="Agendamentos"
                  fill={chartColors.blue}
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="cancelamentos"
                  name="Cancelamentos"
                  fill={chartColors.orange}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  )
}
