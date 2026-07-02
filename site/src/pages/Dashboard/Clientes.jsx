import { useEffect, useState } from 'react'
import {
  AlertCircle,
  BarChart3,
  CalendarClock,
  DollarSign,
  Repeat,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Card, { CardBody, CardHeader } from '../../components/ui/Card'
import dashboardService from '../../services/dashboard.service'

const EMPTY_DATA = {
  cards: {
    clientesNovosMes: 0,
    clientesRecorrentesMes: 0,
    clientesAtivos30Dias: 0,
    clientesInativos: 0,
    ticketMedioCliente: 0,
    agendamentosMediosPorCliente: 0,
    receitaClientesRecorrentes: 0,
    clientesComRetornoPrevisto: 0,
  },
  graficos: {
    novosClientesPorMes: [],
    novosVsRecorrentes: [],
    clientesPorFrequencia: [],
    receitaPorPerfilCliente: [],
    retencaoMensal: [],
  },
  tabelas: {
    topClientesReceita: [],
    topClientesAgendamentos: [],
    clientesInativos: [],
    clientesRetornoProvavel: [],
    ultimosClientes: [],
  },
}

const chartColors = {
  blue: '#3B82F6',
  green: '#10B981',
  orange: '#F59E0B',
  purple: '#8B5CF6',
  red: '#EF4444',
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

function formatDecimal(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function formatDate(value) {
  if (!value) return '-'

  const [year, month, day] = String(value).slice(0, 10).split('-')
  if (!year || !month || !day) return String(value)

  return `${day}/${month}/${year}`
}

function formatDays(value) {
  const days = Number(value || 0)
  return `${formatNumber(days)} ${days === 1 ? 'dia' : 'dias'}`
}

function formatPercent(value) {
  if (value === null || value === undefined) return 'Sem dados'

  return `${Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}%`
}

function ClientesMetricCard({ title, value, helper, icon: Icon, tone = 'blue' }) {
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
            <p className="text-2xl font-bold text-gray-900 break-words">{value}</p>
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

function ChartCard({ title, description, loading, isEmpty, emptyMessage, children }) {
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
          <EmptyState icon={BarChart3}>{emptyMessage}</EmptyState>
        ) : (
          children
        )}
      </CardBody>
    </Card>
  )
}

function TableCard({ title, description, loading, isEmpty, emptyMessage, children }) {
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
          <EmptyState icon={Users}>{emptyMessage}</EmptyState>
        ) : (
          <div className="table-scroll">{children}</div>
        )}
      </CardBody>
    </Card>
  )
}

function StatusBadge({ status }) {
  const isLate = status === 'Atrasado'
  const className = isLate
    ? 'bg-red-50 text-red-700'
    : 'bg-blue-50 text-blue-700'

  return (
    <span className={`inline-flex w-fit whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      {status || 'Previsto'}
    </span>
  )
}

function hasEmpresa(rows) {
  return rows.some((row) => row.empresa)
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

function ClientesTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <TooltipContainer title={label}>
      {payload.map((item) => (
        <TooltipRow key={item.dataKey} label={item.name} value={formatNumber(item.value)} />
      ))}
    </TooltipContainer>
  )
}

function ReceitaPerfilTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  const data = payload[0].payload

  return (
    <TooltipContainer title={label}>
      <TooltipRow label="Receita" value={formatCurrency(data.receita)} />
      <TooltipRow label="Clientes" value={formatNumber(data.clientes)} />
    </TooltipContainer>
  )
}

function FrequenciaTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  const data = payload[0].payload

  return (
    <TooltipContainer title={label}>
      <TooltipRow label="Clientes" value={formatNumber(data.clientes)} />
      <TooltipRow label="Participação" value={formatPercent(data.percentual)} />
    </TooltipContainer>
  )
}

function RetencaoTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  const data = payload[0].payload
  const semBaseRetencao = data.taxaRetencao === null || data.taxaRetencao === undefined

  return (
    <TooltipContainer title={label}>
      <TooltipRow
        label="Retenção"
        value={
          semBaseRetencao
            ? 'Sem dados suficientes para calcular retenção'
            : formatPercent(data.taxaRetencao)
        }
      />
      <TooltipRow label="Clientes ativos" value={formatNumber(data.clientesAtivos)} />
      <TooltipRow label="Clientes que retornaram" value={formatNumber(data.clientesRetornaram)} />
    </TooltipContainer>
  )
}

export default function ClientesDashboard({ dateRange }) {
  const [loading, setLoading] = useState(true)
  const [clientesData, setClientesData] = useState(EMPTY_DATA)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true)
      setErrorMessage('')

      try {
        const response = await dashboardService.getClientes(dateRange)
        setClientesData(response.data || EMPTY_DATA)
      } catch (error) {
        console.error('Erro ao carregar dashboard de clientes:', error)
        setErrorMessage('Não foi possível carregar os dados de clientes agora.')
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [dateRange])

  const cards = clientesData?.cards || EMPTY_DATA.cards
  const graficos = clientesData?.graficos || EMPTY_DATA.graficos
  const novosClientesPorMes = (graficos.novosClientesPorMes || []).map((item) => ({
    ...item,
    clientesNovos: Number(item.clientesNovos || 0),
  }))
  const novosVsRecorrentes = (graficos.novosVsRecorrentes || []).map((item) => ({
    ...item,
    novos: Number(item.novos || 0),
    recorrentes: Number(item.recorrentes || 0),
  }))
  const clientesPorFrequenciaBase = (graficos.clientesPorFrequencia || []).map((item) => ({
    ...item,
    clientes: Number(item.clientes || 0),
  }))
  const totalClientesFrequencia = clientesPorFrequenciaBase.reduce(
    (total, item) => total + item.clientes,
    0,
  )
  const clientesPorFrequencia = clientesPorFrequenciaBase.map((item) => ({
    ...item,
    percentual: totalClientesFrequencia > 0 ? (item.clientes / totalClientesFrequencia) * 100 : 0,
  }))
  const receitaPorPerfilCliente = (graficos.receitaPorPerfilCliente || []).map((item) => ({
    ...item,
    receita: Number(item.receita || 0),
    clientes: Number(item.clientes || 0),
  }))
  const retencaoMensal = (graficos.retencaoMensal || [])
    .map((item) => ({
      ...item,
      clientesAtivos: Number(item.clientesAtivos || 0),
      clientesRetornaram: Number(item.clientesRetornaram || 0),
      taxaRetencao:
        item.taxaRetencao === null || item.taxaRetencao === undefined
          ? null
          : Number(item.taxaRetencao),
      tooltipAnchor: 0,
    }))
    .sort((a, b) => String(a.mes || '').localeCompare(String(b.mes || '')))
  const temNovosClientes = novosClientesPorMes.some((item) => item.clientesNovos > 0)
  const temNovosVsRecorrentes = novosVsRecorrentes.some(
    (item) => item.novos > 0 || item.recorrentes > 0,
  )
  const temFrequencia = clientesPorFrequencia.some((item) => item.clientes > 0)
  const temReceitaPerfil = receitaPorPerfilCliente.some((item) => item.receita > 0)
  const temRetencao = retencaoMensal.some((item) => item.clientesAtivos > 0)
  const tabelas = clientesData?.tabelas || EMPTY_DATA.tabelas
  const topClientesReceita = (tabelas.topClientesReceita || []).map((item) => ({
    ...item,
    receitaTotal: Number(item.receitaTotal || 0),
    quantidadeAgendamentos: Number(item.quantidadeAgendamentos || 0),
  }))
  const topClientesAgendamentos = (tabelas.topClientesAgendamentos || []).map((item) => ({
    ...item,
    quantidadeAgendamentos: Number(item.quantidadeAgendamentos || 0),
    receitaTotal: Number(item.receitaTotal || 0),
  }))
  const clientesInativos = (tabelas.clientesInativos || []).map((item) => ({
    ...item,
    diasSemAgendar: Number(item.diasSemAgendar || 0),
    totalAgendamentos: Number(item.totalAgendamentos || 0),
    receitaHistorica: Number(item.receitaHistorica || 0),
  }))
  const clientesRetornoProvavel = (tabelas.clientesRetornoProvavel || []).map((item) => ({
    ...item,
    mediaDiasEntreAgendamentos: Number(item.mediaDiasEntreAgendamentos || 0),
  }))
  const ultimosClientes = (tabelas.ultimosClientes || []).map((item) => ({
    ...item,
    totalAgendamentos: Number(item.totalAgendamentos || 0),
  }))
  const mostraEmpresaTopReceita = hasEmpresa(topClientesReceita)
  const mostraEmpresaTopAgendamentos = hasEmpresa(topClientesAgendamentos)
  const mostraEmpresaInativos = hasEmpresa(clientesInativos)
  const mostraEmpresaRetorno = hasEmpresa(clientesRetornoProvavel)
  const mostraEmpresaUltimos = hasEmpresa(ultimosClientes)

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
        <ClientesMetricCard
          title="Clientes novos no período"
          value={loading ? '...' : formatNumber(cards.clientesNovosMes)}
          helper="Cadastrados no período"
          icon={UserPlus}
          tone="blue"
        />

        <ClientesMetricCard
          title="Clientes recorrentes"
          value={loading ? '...' : formatNumber(cards.clientesRecorrentesMes)}
          helper="Com histórico ou recorrência no período"
          icon={Repeat}
          tone="purple"
        />

        <ClientesMetricCard
          title="Clientes ativos no período"
          value={loading ? '...' : formatNumber(cards.clientesAtivos30Dias)}
          helper="Com agendamento real no período"
          icon={UserCheck}
          tone="green"
        />

        <ClientesMetricCard
          title="Clientes inativos"
          value={loading ? '...' : formatNumber(cards.clientesInativos)}
          helper="Sem retorno entre 60 e 365 dias"
          icon={UserX}
          tone="red"
        />

        <ClientesMetricCard
          title="Ticket médio por cliente"
          value={loading ? '...' : formatCurrency(cards.ticketMedioCliente)}
          helper="Receita do período / clientes atendidos"
          icon={DollarSign}
          tone="green"
        />

        <ClientesMetricCard
          title="Agendamentos médios"
          value={loading ? '...' : formatDecimal(cards.agendamentosMediosPorCliente)}
          helper="Agendamentos do período por cliente"
          icon={CalendarClock}
          tone="orange"
        />

        <ClientesMetricCard
          title="Receita dos recorrentes"
          value={loading ? '...' : formatCurrency(cards.receitaClientesRecorrentes)}
          helper="Receita no período"
          icon={TrendingUp}
          tone="purple"
        />

        <ClientesMetricCard
          title="Retorno previsto"
          value={loading ? '...' : formatNumber(cards.clientesComRetornoPrevisto)}
          helper="Previsto em até 7 dias ou atrasado"
          icon={Users}
          tone="blue"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Novos clientes por mês"
          description="Últimos 12 meses"
          loading={loading}
          isEmpty={!temNovosClientes}
          emptyMessage="Ainda não há dados para este período."
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={novosClientesPorMes}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="label" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip content={<ClientesTooltip />} />
                <Bar
                  dataKey="clientesNovos"
                  name="Clientes novos"
                  fill={chartColors.blue}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Clientes novos x recorrentes"
          description="Últimos 12 meses"
          loading={loading}
          isEmpty={!temNovosVsRecorrentes}
          emptyMessage="Nenhum cliente recorrente encontrado."
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={novosVsRecorrentes}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="label" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip content={<ClientesTooltip />} />
                <Legend />
                <Bar dataKey="novos" name="Novos" fill={chartColors.green} radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="recorrentes"
                  name="Recorrentes"
                  fill={chartColors.purple}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Clientes por frequência"
          description="Histórico de agendamentos não cancelados"
          loading={loading}
          isEmpty={!temFrequencia}
          emptyMessage="Ainda não há dados para este período."
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientesPorFrequencia}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="faixa" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip content={<FrequenciaTooltip />} />
                <Bar
                  dataKey="clientes"
                  name="Clientes"
                  fill={chartColors.orange}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Receita por perfil de cliente"
          description="Mês atual"
          loading={loading}
          isEmpty={!temReceitaPerfil}
          emptyMessage="Nenhuma receita encontrada para o período."
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={receitaPorPerfilCliente}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="perfil" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  tickFormatter={(value) => `R$ ${Number(value || 0).toLocaleString('pt-BR')}`}
                />
                <Tooltip content={<ReceitaPerfilTooltip />} />
                <Bar
                  dataKey="receita"
                  name="Receita"
                  fill={chartColors.green}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ChartCard
          title="Retenção mensal"
          description="Clientes que retornaram entre os ativos do mês"
          loading={loading}
          isEmpty={!temRetencao}
          emptyMessage="Sem dados suficientes para calcular retenção."
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={retencaoMensal}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="label" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  tickFormatter={(value) => `${Number(value || 0).toLocaleString('pt-BR')}%`}
                />
                <Tooltip content={<RetencaoTooltip />} />
                <Line
                  type="monotone"
                  dataKey="tooltipAnchor"
                  stroke="transparent"
                  dot={false}
                  activeDot={false}
                  legendType="none"
                />
                <Line
                  type="monotone"
                  dataKey="taxaRetencao"
                  name="Retenção"
                  stroke={chartColors.blue}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TableCard
          title="Top clientes por receita"
          description="Mês atual"
          loading={loading}
          isEmpty={topClientesReceita.length === 0}
          emptyMessage="Nenhum cliente encontrado para este período."
        >
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2 font-semibold">Cliente</th>
                <th className="px-3 py-2 font-semibold">Receita</th>
                <th className="px-3 py-2 font-semibold">Agend.</th>
                <th className="px-3 py-2 font-semibold">Último</th>
                {mostraEmpresaTopReceita && <th className="px-3 py-2 font-semibold">Empresa</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topClientesReceita.map((cliente) => (
                <tr key={cliente.clienteId} className="align-top">
                  <td className="px-3 py-3">
                    <p className="font-medium text-gray-900">{cliente.cliente || 'Cliente não informado'}</p>
                    <p className="text-xs text-gray-500">{cliente.telefone || 'Telefone não informado'}</p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-semibold text-green-700">
                    {formatCurrency(cliente.receitaTotal)}
                  </td>
                  <td className="px-3 py-3 text-gray-600">{formatNumber(cliente.quantidadeAgendamentos)}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-gray-600">
                    {formatDate(cliente.ultimoAgendamento)}
                  </td>
                  {mostraEmpresaTopReceita && (
                    <td className="px-3 py-3 text-gray-600">{cliente.empresa}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>

        <TableCard
          title="Top clientes por agendamentos"
          description="Mês atual"
          loading={loading}
          isEmpty={topClientesAgendamentos.length === 0}
          emptyMessage="Nenhum cliente encontrado para este período."
        >
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2 font-semibold">Cliente</th>
                <th className="px-3 py-2 font-semibold">Agend.</th>
                <th className="px-3 py-2 font-semibold">Receita</th>
                <th className="px-3 py-2 font-semibold">Último</th>
                {mostraEmpresaTopAgendamentos && <th className="px-3 py-2 font-semibold">Empresa</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topClientesAgendamentos.map((cliente) => (
                <tr key={cliente.clienteId} className="align-top">
                  <td className="px-3 py-3">
                    <p className="font-medium text-gray-900">{cliente.cliente || 'Cliente não informado'}</p>
                    <p className="text-xs text-gray-500">{cliente.telefone || 'Telefone não informado'}</p>
                  </td>
                  <td className="px-3 py-3 font-semibold text-gray-900">
                    {formatNumber(cliente.quantidadeAgendamentos)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-green-700">
                    {formatCurrency(cliente.receitaTotal)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-gray-600">
                    {formatDate(cliente.ultimoAgendamento)}
                  </td>
                  {mostraEmpresaTopAgendamentos && (
                    <td className="px-3 py-3 text-gray-600">{cliente.empresa}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TableCard
          title="Clientes inativos"
          description="Sem retorno entre 60 e 365 dias"
          loading={loading}
          isEmpty={clientesInativos.length === 0}
          emptyMessage="Nenhum cliente inativo encontrado."
        >
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2 font-semibold">Cliente</th>
                <th className="px-3 py-2 font-semibold">Último</th>
                <th className="px-3 py-2 font-semibold">Sem agendar</th>
                <th className="px-3 py-2 font-semibold">Histórico</th>
                {mostraEmpresaInativos && <th className="px-3 py-2 font-semibold">Empresa</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clientesInativos.map((cliente) => (
                <tr key={cliente.clienteId} className="align-top">
                  <td className="px-3 py-3">
                    <p className="font-medium text-gray-900">{cliente.cliente || 'Cliente não informado'}</p>
                    <p className="text-xs text-gray-500">{cliente.telefone || 'Telefone não informado'}</p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-gray-600">
                    {formatDate(cliente.ultimoAgendamento)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-medium text-red-700">
                    {formatDays(cliente.diasSemAgendar)}
                  </td>
                  <td className="px-3 py-3 text-gray-600">
                    <p>{formatNumber(cliente.totalAgendamentos)} agend.</p>
                    <p className="text-xs text-green-700">{formatCurrency(cliente.receitaHistorica)}</p>
                  </td>
                  {mostraEmpresaInativos && (
                    <td className="px-3 py-3 text-gray-600">{cliente.empresa}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>

        <TableCard
          title="Clientes com retorno provável"
          description="Previstos em até 7 dias ou atrasados"
          loading={loading}
          isEmpty={clientesRetornoProvavel.length === 0}
          emptyMessage="Nenhum cliente com retorno previsto."
        >
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2 font-semibold">Cliente</th>
                <th className="px-3 py-2 font-semibold">Último</th>
                <th className="px-3 py-2 font-semibold">Média</th>
                <th className="px-3 py-2 font-semibold">Retorno</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                {mostraEmpresaRetorno && <th className="px-3 py-2 font-semibold">Empresa</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clientesRetornoProvavel.map((cliente) => (
                <tr key={cliente.clienteId} className="align-top">
                  <td className="px-3 py-3">
                    <p className="font-medium text-gray-900">{cliente.cliente || 'Cliente não informado'}</p>
                    <p className="text-xs text-gray-500">{cliente.telefone || 'Telefone não informado'}</p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-gray-600">
                    {formatDate(cliente.ultimoAgendamento)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-gray-600">
                    {formatDays(cliente.mediaDiasEntreAgendamentos)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-medium text-gray-900">
                    {formatDate(cliente.retornoPrevisto)}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={cliente.status} />
                  </td>
                  {mostraEmpresaRetorno && (
                    <td className="px-3 py-3 text-gray-600">{cliente.empresa}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <TableCard
          title="Últimos clientes cadastrados"
          description="Cadastros mais recentes"
          loading={loading}
          isEmpty={ultimosClientes.length === 0}
          emptyMessage="Nenhum cliente cadastrado."
        >
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2 font-semibold">Cliente</th>
                <th className="px-3 py-2 font-semibold">Cadastro</th>
                <th className="px-3 py-2 font-semibold">Primeiro agendamento</th>
                <th className="px-3 py-2 font-semibold">Agendamentos</th>
                {mostraEmpresaUltimos && <th className="px-3 py-2 font-semibold">Empresa</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ultimosClientes.map((cliente) => (
                <tr key={cliente.clienteId} className="align-top">
                  <td className="px-3 py-3">
                    <p className="font-medium text-gray-900">{cliente.cliente || 'Cliente não informado'}</p>
                    <p className="text-xs text-gray-500">{cliente.telefone || 'Telefone não informado'}</p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-gray-600">
                    {formatDate(cliente.dataCadastro)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-gray-600">
                    {formatDate(cliente.primeiroAgendamento)}
                  </td>
                  <td className="px-3 py-3 text-gray-600">{formatNumber(cliente.totalAgendamentos)}</td>
                  {mostraEmpresaUltimos && (
                    <td className="px-3 py-3 text-gray-600">{cliente.empresa}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      </div>
    </div>
  )
}
