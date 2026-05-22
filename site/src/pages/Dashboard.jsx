import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertCircle,
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Percent,
  Repeat,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import wizardService from '../services/wizard.service'
import dashboardService from '../services/dashboard.service'
import { useAuth } from '../contexts/AuthContext'
import AgendaDisponibilidade from './Dashboard/AgendaDisponibilidade'

const SUPER_ADMIN_ID = '550e8400-e29b-41d4-a716-446655440012'

const EMPTY_DASHBOARD = {
  periodo: {
    timezone: 'America/Sao_Paulo',
  },
  cards: {
    agendamentosHoje: 0,
    agendamentosMes: 0,
    agendamentosMesAtivos: 0,
    agendamentosMesCancelados: 0,
    agendamentosMesRealizados: 0,
    agendamentosMesPrevistos: 0,
    receitaPrevistaMes: 0,
    receitaRealizadaMes: 0,
    receitaRealizadaDisponivel: true,
    ticketMedio: 0,
    ticketMedioBase: 'prevista',
    clientesNovosMes: 0,
    clientesRecorrentesMes: 0,
    taxaCancelamentoMes: 0,
    taxaOcupacaoEstimada: null,
    ocupacaoCalculavel: false,
    servicosRealizadosMes: 0,
    servicosRealizadosDisponivel: true,
  },
  graficos: {
    evolucaoDiaria: [],
    servicosMaisRealizados: [],
    receitaPorServico: [],
    agendamentosPorDiaSemana: [],
    agendamentosPorFaixaHorario: [],
  },
  tabelas: {
    proximosAgendamentos: [],
    empresasMaiorMovimento: [],
    empresasSemMovimento: [],
    profissionaisComAgendaHoje: [],
    servicosMaiorFaturamento: [],
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

function formatNumber(value) {
  return Number(value || 0).toLocaleString('pt-BR')
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatPercent(value) {
  return `${Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}%`
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
  })
}

function formatTime(value) {
  if (!value) return '--:--'
  return new Date(value).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

function truncateText(value, size = 24) {
  if (!value) return ''
  return value.length > size ? `${value.slice(0, size - 1)}…` : value
}

function MetricCard({ title, value, helper, icon: Icon, tone = 'blue', muted = false }) {
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

function EmptyState({ icon: Icon = AlertCircle, children }) {
  return (
    <div className="text-center py-10 text-gray-500">
      <Icon className="w-11 h-11 mx-auto mb-3 text-gray-400" />
      <p>{children}</p>
    </div>
  )
}

function LoadingState() {
  return <div className="text-center py-10 text-gray-500">Carregando...</div>
}

function DashboardTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2">
      <p className="text-sm font-semibold text-gray-900 mb-2">Dia {label}</p>
      <div className="space-y-1">
        {payload.map((item) => {
          const dataKey = String(item.dataKey).toLowerCase()
          const isCurrency = dataKey.includes('receita') || dataKey.includes('valor')
          return (
            <div key={item.dataKey} className="flex items-center justify-between gap-5 text-sm">
              <span className="text-gray-600">{item.name}</span>
              <span className="font-medium text-gray-900">
                {isCurrency ? formatCurrency(item.value) : formatNumber(item.value)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SimpleList({ emptyIcon, emptyMessage, children, isEmpty, loading }) {
  if (loading) return <LoadingState />
  if (isEmpty) return <EmptyState icon={emptyIcon}>{emptyMessage}</EmptyState>
  return <div className="space-y-3">{children}</div>
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(EMPTY_DASHBOARD)
  const [errorMessage, setErrorMessage] = useState('')
  const [activeTab, setActiveTab] = useState('visao-geral')

  const isSuperAdmin = user?.nivel_acesso_id === SUPER_ADMIN_ID

  useEffect(() => {
    const checkWizard = async () => {
      try {
        const response = await wizardService.checkStatus()
        if (!response.data.completed) {
          navigate('/wizard')
        }
      } catch (error) {
        console.error('Erro ao verificar wizard:', error)
      }
    }
    checkWizard()
  }, [navigate])

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true)
      setErrorMessage('')
      try {
        const response = await dashboardService.getVisaoGeral()
        setDashboardData(response.data || EMPTY_DASHBOARD)
      } catch (error) {
        console.error('Erro ao carregar visão geral:', error)
        setErrorMessage('Não foi possível carregar os dados da visão geral agora.')
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [])

  const data = dashboardData || EMPTY_DASHBOARD
  const cards = data.cards || EMPTY_DASHBOARD.cards
  const graficos = data.graficos || EMPTY_DASHBOARD.graficos
  const tabelas = data.tabelas || EMPTY_DASHBOARD.tabelas

  const receitaLabel = 'Receita realizada'

  const evolucaoDiaria = useMemo(() => (
    graficos.evolucaoDiaria || []
  ), [graficos.evolucaoDiaria])

  const servicosMaisRealizados = useMemo(() => (
    (graficos.servicosMaisRealizados || []).map((item) => ({
      ...item,
      nomeCurto: truncateText(item.servicosNome, 28),
    }))
  ), [graficos.servicosMaisRealizados])

  const receitaPorServico = useMemo(() => (
    (graficos.receitaPorServico || []).map((item) => ({
      ...item,
      nomeCurto: truncateText(item.servicosNome, 28),
    }))
  ), [graficos.receitaPorServico])

  const servicosMaiorFaturamento = useMemo(() => (
    (tabelas.servicosMaiorFaturamento || []).map((item) => ({
      ...item,
      nomeCurto: truncateText(item.servicosNome, 36),
    }))
  ), [tabelas.servicosMaiorFaturamento])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {activeTab === 'visao-geral' ? 'Visão Geral' : 'Agenda e Disponibilidade'}
          </p>
        </div>
        <div className="inline-flex w-fit rounded-lg bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
          Período atual
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('visao-geral')}
          className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'visao-geral'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Visão Geral
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('agenda-disponibilidade')}
          className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'agenda-disponibilidade'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Agenda e Disponibilidade
        </button>
      </div>

      {activeTab === 'agenda-disponibilidade' ? (
        <AgendaDisponibilidade />
      ) : (
        <>
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-6">
        <MetricCard
          title="Agendamentos hoje"
          value={loading ? '...' : formatNumber(cards.agendamentosHoje)}
          helper="Compromissos ativos na agenda"
          icon={Calendar}
          tone="blue"
        />
        <MetricCard
          title="Agendamentos no mês"
          value={loading ? '...' : formatNumber(cards.agendamentosMes)}
          helper={`${formatNumber(cards.agendamentosMesAtivos)} ativos, ${formatNumber(cards.agendamentosMesCancelados)} cancelados`}
          icon={Activity}
          tone="purple"
        />
        <MetricCard
          title="Receita prevista"
          value={loading ? '...' : formatCurrency(cards.receitaPrevistaMes)}
          helper="Atendimentos futuros ativos"
          icon={TrendingUp}
          tone="orange"
        />
        <MetricCard
          title="Receita realizada"
          value={loading ? '...' : formatCurrency(cards.receitaRealizadaMes)}
          helper="Atendimentos já passados e não cancelados"
          icon={DollarSign}
          tone="green"
        />
        <MetricCard
          title="Ticket médio"
          value={loading ? '...' : formatCurrency(cards.ticketMedio)}
          helper={`Base ${cards.ticketMedioBase}: compromissos`}
          icon={Briefcase}
          tone="blue"
        />
        <MetricCard
          title="Taxa de cancelamento"
          value={loading ? '...' : formatPercent(cards.taxaCancelamentoMes)}
          helper="Cancelados sobre agendamentos do mês"
          icon={Percent}
          tone="red"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard
          title="Clientes novos"
          value={loading ? '...' : formatNumber(cards.clientesNovosMes)}
          helper="Cadastrados no mês"
          icon={UserPlus}
          tone="green"
        />
        <MetricCard
          title="Clientes recorrentes"
          value={loading ? '...' : formatNumber(cards.clientesRecorrentesMes)}
          helper="2+ agendamentos no mês"
          icon={Repeat}
          tone="purple"
        />
        <MetricCard
          title="Ocupação estimada"
          value={
            loading
              ? '...'
              : cards.ocupacaoCalculavel
                ? formatPercent(cards.taxaOcupacaoEstimada)
                : 'Sem dados'
          }
          helper={cards.ocupacaoCalculavel ? 'Horas agendadas / disponíveis' : 'Sem dados suficientes'}
          icon={Clock}
          tone={cards.ocupacaoCalculavel ? 'orange' : 'gray'}
          muted={!cards.ocupacaoCalculavel}
        />
        <MetricCard
          title="Serviços realizados"
          value={loading ? '...' : formatNumber(cards.servicosRealizadosMes)}
          helper="Procedimentos dentro de atendimentos já passados"
          icon={Briefcase}
          tone="blue"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Evolução diária do mês</h3>
            <p className="text-sm text-gray-500">Compromissos, cancelamentos e valores por dia</p>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <LoadingState />
          ) : evolucaoDiaria.length === 0 ? (
            <EmptyState icon={BarChart3}>Ainda não há dados para este período.</EmptyState>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={evolucaoDiaria} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="dia" tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <YAxis yAxisId="left" allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickFormatter={(value) => `R$ ${Number(value || 0).toLocaleString('pt-BR')}`}
                  />
                  <Tooltip content={<DashboardTooltip />} />
                  <Legend />
                  <Bar
                    yAxisId="right"
                    dataKey="valorRecebido"
                    name="Valores recebidos"
                    fill={chartColors.green}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="valorAReceber"
                    name="Valores a receber"
                    fill={chartColors.orange}
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="agendamentos"
                    name="Agendamentos"
                    stroke={chartColors.blue}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="cancelamentos"
                    name="Cancelamentos"
                    stroke={chartColors.red}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Serviços mais realizados</h3>
          </CardHeader>
          <CardBody>
            {loading ? (
              <LoadingState />
            ) : servicosMaisRealizados.length === 0 ? (
              <EmptyState icon={Briefcase}>
                Ainda não há procedimentos realizados para este período.
              </EmptyState>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={servicosMaisRealizados} layout="vertical" margin={{ left: 16, right: 18 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                    <XAxis type="number" allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="nomeCurto"
                      width={150}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value) => [formatNumber(value), 'Realizados']}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.servicosNome || ''}
                    />
                    <Bar dataKey="quantidade" fill={chartColors.blue} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Receita por serviço</h3>
              <p className="text-sm text-gray-500">{receitaLabel}</p>
            </div>
          </CardHeader>
          <CardBody>
            {loading ? (
              <LoadingState />
            ) : receitaPorServico.length === 0 ? (
              <EmptyState icon={DollarSign}>Ainda não há dados para este período.</EmptyState>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={receitaPorServico} layout="vertical" margin={{ left: 16, right: 18 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                    <XAxis
                      type="number"
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      tickFormatter={(value) => `R$ ${Number(value || 0).toLocaleString('pt-BR')}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="nomeCurto"
                      width={150}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(value), receitaLabel]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.servicosNome || ''}
                    />
                    <Bar dataKey="receita" fill={chartColors.orange} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Agendamentos por dia da semana</h3>
          </CardHeader>
          <CardBody>
            {loading ? (
              <LoadingState />
            ) : graficos.agendamentosPorDiaSemana.length === 0 ? (
              <EmptyState icon={Calendar}>Ainda não há dados para este período.</EmptyState>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={graficos.agendamentosPorDiaSemana}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="nomeCurto" tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <Tooltip formatter={(value) => [formatNumber(value), 'Agendamentos']} />
                    <Bar dataKey="quantidade" fill={chartColors.purple} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Agendamentos por faixa de horário</h3>
          </CardHeader>
          <CardBody>
            {loading ? (
              <LoadingState />
            ) : graficos.agendamentosPorFaixaHorario.length === 0 ? (
              <EmptyState icon={Clock}>Ainda não há dados para este período.</EmptyState>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={graficos.agendamentosPorFaixaHorario}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="faixa" tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <Tooltip formatter={(value) => [formatNumber(value), 'Agendamentos']} />
                    <Bar dataKey="quantidade" fill={chartColors.green} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Próximos agendamentos</h3>
          </CardHeader>
          <CardBody>
            <SimpleList
              loading={loading}
              isEmpty={tabelas.proximosAgendamentos.length === 0}
              emptyIcon={Calendar}
              emptyMessage="Nenhum agendamento próximo."
            >
              {tabelas.proximosAgendamentos.map((agendamento) => {
                const statusConfirmado = agendamento.statusAgendNome?.toLowerCase().includes('confirm')

                return (
                  <div
                    key={agendamento.agendId}
                    className="flex flex-col gap-3 rounded-lg bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{agendamento.clientesNome}</p>
                      <p className="text-sm text-gray-600">
                        {agendamento.servicos} - {formatDate(agendamento.agendInicio)} às {formatTime(agendamento.agendInicio)}
                      </p>
                      <p className="text-xs text-gray-500">{agendamento.profissionalNome}</p>
                      {isSuperAdmin && agendamento.empresaNome && (
                        <p className="text-xs text-blue-600 font-medium mt-1">{agendamento.empresaNome}</p>
                      )}
                    </div>
                    <span className={`w-fit rounded-full px-3 py-1 text-sm ${
                      statusConfirmado
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {agendamento.statusAgendNome}
                    </span>
                  </div>
                )
              })}
            </SimpleList>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Profissionais com agenda hoje</h3>
          </CardHeader>
          <CardBody>
            <SimpleList
              loading={loading}
              isEmpty={tabelas.profissionaisComAgendaHoje.length === 0}
              emptyIcon={Users}
              emptyMessage="Nenhum profissional com agenda hoje."
            >
              {tabelas.profissionaisComAgendaHoje.map((profissional) => {
                const iniciais = profissional.profissionalNome
                  ?.split(' ')
                  .map((parte) => parte[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()

                return (
                  <div key={profissional.profissionalId} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
                      {iniciais}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">{profissional.profissionalNome}</p>
                      <p className="text-sm text-gray-600">
                        {formatNumber(profissional.agendamentosHoje)} agendamento(s) hoje
                      </p>
                      {profissional.profissionalEspecialidade && (
                        <p className="text-xs text-gray-500">{profissional.profissionalEspecialidade}</p>
                      )}
                      {isSuperAdmin && profissional.empresaNome && (
                        <p className="text-xs text-blue-600 font-medium mt-1">{profissional.empresaNome}</p>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatTime(profissional.primeiroHorario)}
                    </span>
                  </div>
                )
              })}
            </SimpleList>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Serviços com maior faturamento</h3>
            <p className="text-sm text-gray-500">{receitaLabel}</p>
          </div>
        </CardHeader>
        <CardBody>
          <SimpleList
            loading={loading}
            isEmpty={servicosMaiorFaturamento.length === 0}
            emptyIcon={DollarSign}
            emptyMessage="Ainda não há dados para este período."
          >
            {servicosMaiorFaturamento.map((servico, index) => (
              <div key={servico.servicosId} className="flex items-center justify-between gap-4 rounded-lg bg-gray-50 p-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">
                    {index + 1}. {servico.servicosNome}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatNumber(servico.quantidade)} serviço(s)
                  </p>
                </div>
                <p className="shrink-0 font-semibold text-orange-600">{formatCurrency(servico.receita)}</p>
              </div>
            ))}
          </SimpleList>
        </CardBody>
      </Card>

      {isSuperAdmin && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Empresas com maior movimento</h3>
            </CardHeader>
            <CardBody>
              <SimpleList
                loading={loading}
                isEmpty={tabelas.empresasMaiorMovimento.length === 0}
                emptyIcon={Building2}
                emptyMessage="Ainda não há dados para este período."
              >
                {tabelas.empresasMaiorMovimento.map((empresa) => (
                  <div key={empresa.empresaId} className="flex items-center justify-between gap-4 rounded-lg bg-gray-50 p-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{empresa.empresaNome}</p>
                      <p className="text-sm text-gray-500">
                        {formatNumber(empresa.agendamentosMes)} agendamento(s), {formatNumber(empresa.cancelamentosMes)} cancelado(s)
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold text-orange-600">
                      {formatCurrency(cards.receitaRealizadaDisponivel ? empresa.receitaRealizada : empresa.receitaPrevista)}
                    </p>
                  </div>
                ))}
              </SimpleList>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Empresas sem movimento no mês</h3>
            </CardHeader>
            <CardBody>
              <SimpleList
                loading={loading}
                isEmpty={tabelas.empresasSemMovimento.length === 0}
                emptyIcon={Building2}
                emptyMessage="Nenhuma empresa ativa sem movimento neste mês."
              >
                {tabelas.empresasSemMovimento.map((empresa) => (
                  <div key={empresa.empresaId} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                    <p className="font-medium text-gray-900">{empresa.empresaNome}</p>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                      {empresa.status}
                    </span>
                  </div>
                ))}
              </SimpleList>
            </CardBody>
          </Card>
        </div>
      )}
        </>
      )}
    </div>
  )
}
