import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Briefcase,
  Clock,
  DollarSign,
  Percent,
  Star,
  TrendingUp,
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
    totalServicosMes: 0,
    receitaServicosMes: 0,
    servicoMaisVendido: null,
    servicoMaiorReceita: null,
    ticketMedioServico: 0,
    tempoTotalOcupadoMin: 0,
    taxaCancelamentoServicos: 0,
    servicosSemMovimento: 0,
  },
  graficos: {
    servicosMaisRealizados: [],
    receitaPorServico: [],
    cancelamentosPorServico: [],
    ocupacaoPorServico: [],
    evolucaoMensalServicos: {
      series: [],
      dados: [],
    },
  },
  tabelas: {
    rankingReceita: [],
    rankingQuantidade: [],
    maiorCancelamento: [],
    servicosSemAgendamento: [],
    servicosPorProfissional: [],
  },
}

const chartColors = {
  blue: '#3B82F6',
  green: '#10B981',
  orange: '#F59E0B',
  purple: '#8B5CF6',
  red: '#EF4444',
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

function formatDurationFromMinutes(value) {
  const totalMinutes = Math.max(0, Math.round(Number(value || 0)))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0 && minutes > 0) return `${hours}h${String(minutes).padStart(2, '0')}`
  if (hours > 0) return `${hours}h`
  return `${minutes}min`
}

function formatDate(value) {
  if (!value) return '-'

  const [year, month, day] = String(value).slice(0, 10).split('-')
  if (!year || !month || !day) return String(value)

  return `${day}/${month}/${year}`
}

function truncateLabel(value, maxLength = 24) {
  const label = String(value || '')
  if (label.length <= maxLength) return label
  return `${label.slice(0, maxLength - 1)}...`
}

function ServicosMetricCard({ title, value, helper, icon: Icon, tone = 'blue' }) {
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
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="mt-2 break-words text-2xl font-bold text-gray-900">{value}</p>
            {helper && <p className="mt-1 text-sm text-gray-500">{helper}</p>}
          </div>
          <div className={`p-3 rounded-lg shrink-0 ${tones[tone] || tones.blue}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

function TableCard({ title, children, emptyMessage, isEmpty, loading }) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="py-10 text-center text-gray-500">Carregando...</div>
        ) : isEmpty ? (
          <div className="py-10 text-center text-gray-500">{emptyMessage}</div>
        ) : (
          <div className="overflow-x-auto">{children}</div>
        )}
      </CardBody>
    </Card>
  )
}

function CancelamentoBadge({ value }) {
  const percentual = Number(value || 0)
  const tone = percentual >= 50
    ? 'bg-red-50 text-red-700'
    : percentual >= 20
      ? 'bg-orange-50 text-orange-700'
      : 'bg-green-50 text-green-700'

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${tone}`}>
      {formatPercent(percentual)}
    </span>
  )
}

function hasEmpresa(items) {
  return (items || []).some((item) => Boolean(item.empresa))
}

function EmptyChart({ children }) {
  return (
    <div className="flex h-72 items-center justify-center text-center text-gray-500">
      <p>{children}</p>
    </div>
  )
}

function ChartCard({ title, children, emptyMessage, isEmpty, loading }) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </CardHeader>
      <CardBody>
        {loading ? (
          <EmptyChart>Carregando...</EmptyChart>
        ) : isEmpty ? (
          <EmptyChart>{emptyMessage}</EmptyChart>
        ) : (
          children
        )}
      </CardBody>
    </Card>
  )
}

function TooltipContainer({ title, children }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
      <p className="mb-2 text-sm font-semibold text-gray-900">{title}</p>
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

function QuantidadeTooltip({ active, payload }) {
  if (!active || !payload?.length) return null

  const data = payload[0].payload

  return (
    <TooltipContainer title={data.servicoNome}>
      <TooltipRow label="Quantidade" value={formatNumber(data.quantidade)} />
    </TooltipContainer>
  )
}

function ReceitaTooltip({ active, payload }) {
  if (!active || !payload?.length) return null

  const data = payload[0].payload

  return (
    <TooltipContainer title={data.servicoNome}>
      <TooltipRow label="Receita" value={formatCurrency(data.receita)} />
      <TooltipRow label="Quantidade" value={formatNumber(data.quantidade)} />
    </TooltipContainer>
  )
}

function CancelamentosTooltip({ active, payload }) {
  if (!active || !payload?.length) return null

  const data = payload[0].payload

  return (
    <TooltipContainer title={data.servicoNome}>
      <TooltipRow label="Cancelamentos" value={formatNumber(data.cancelamentos)} />
      <TooltipRow label="Total" value={formatNumber(data.totalAgendamentos)} />
      <TooltipRow label="Taxa" value={formatPercent(data.taxaCancelamento)} />
    </TooltipContainer>
  )
}

function OcupacaoTooltip({ active, payload }) {
  if (!active || !payload?.length) return null

  const data = payload[0].payload

  return (
    <TooltipContainer title={data.servicoNome}>
      <TooltipRow label="Tempo ocupado" value={formatDurationFromMinutes(data.tempoOcupadoMin)} />
      <TooltipRow label="Quantidade" value={formatNumber(data.quantidade)} />
    </TooltipContainer>
  )
}

function EvolucaoTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  const linhas = payload.filter((item) => item.dataKey !== undefined)

  return (
    <TooltipContainer title={label}>
      {linhas.map((item) => (
        <TooltipRow
          key={item.dataKey}
          label={item.name}
          value={formatNumber(item.value)}
        />
      ))}
    </TooltipContainer>
  )
}

function serviceName(service) {
  return service?.servicosNome || 'Sem dados'
}

export default function ServicosDashboard({ dateRange }) {
  const [loading, setLoading] = useState(true)
  const [servicosData, setServicosData] = useState(EMPTY_DATA)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true)
      setErrorMessage('')

      try {
        const response = await dashboardService.getServicos(dateRange)
        setServicosData(response.data || EMPTY_DATA)
      } catch (error) {
        console.error('Erro ao carregar dashboard de serviços:', error)
        setErrorMessage('Não foi possível carregar os dados de serviços agora.')
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [dateRange])

  const cards = servicosData?.cards || EMPTY_DATA.cards
  const graficos = servicosData?.graficos || EMPTY_DATA.graficos
  const servicoMaisVendido = cards.servicoMaisVendido
  const servicoMaiorReceita = cards.servicoMaiorReceita
  const servicosMaisRealizados = (graficos.servicosMaisRealizados || []).map((item) => ({
    ...item,
    nomeCurto: truncateLabel(item.servicoNome),
    quantidade: Number(item.quantidade || 0),
  }))
  const receitaPorServico = (graficos.receitaPorServico || []).map((item) => ({
    ...item,
    nomeCurto: truncateLabel(item.servicoNome),
    receita: Number(item.receita || 0),
    quantidade: Number(item.quantidade || 0),
  }))
  const cancelamentosPorServico = (graficos.cancelamentosPorServico || []).map((item) => ({
    ...item,
    nomeCurto: truncateLabel(item.servicoNome),
    cancelamentos: Number(item.cancelamentos || 0),
    totalAgendamentos: Number(item.totalAgendamentos || 0),
    taxaCancelamento: Number(item.taxaCancelamento || 0),
  }))
  const ocupacaoPorServico = (graficos.ocupacaoPorServico || []).map((item) => ({
    ...item,
    nomeCurto: truncateLabel(item.servicoNome),
    tempoOcupadoMin: Number(item.tempoOcupadoMin || 0),
    quantidade: Number(item.quantidade || 0),
  }))
  const evolucaoPayload = graficos.evolucaoMensalServicos || EMPTY_DATA.graficos.evolucaoMensalServicos
  const evolucaoSeries = (evolucaoPayload.series || []).map((item) => ({
    ...item,
    servicoNome: item.servicoNome || 'Serviço',
  }))
  const evolucaoMensalServicos = Object.values((evolucaoPayload.dados || []).reduce((acc, item) => {
    if (!acc[item.mes]) {
      acc[item.mes] = {
        mes: item.mes,
        label: item.label,
      }
    }

    acc[item.mes][item.dataKey] = Number(item.quantidade || 0)
    return acc
  }, {})).sort((a, b) => String(a.mes || '').localeCompare(String(b.mes || '')))
  const temEvolucaoMensal = evolucaoMensalServicos.some((item) => (
    evolucaoSeries.some((serie) => Number(item[serie.dataKey] || 0) > 0)
  ))
  const lineColors = [
    chartColors.blue,
    chartColors.green,
    chartColors.orange,
    chartColors.purple,
    chartColors.red,
  ]
  const tabelas = servicosData?.tabelas || EMPTY_DATA.tabelas
  const rankingReceita = (tabelas.rankingReceita || []).map((item) => ({
    ...item,
    receitaTotal: Number(item.receitaTotal || 0),
    quantidade: Number(item.quantidade || 0),
    ticketMedio: Number(item.ticketMedio || 0),
    tempoTotalMin: Number(item.tempoTotalMin || 0),
  }))
  const rankingQuantidade = (tabelas.rankingQuantidade || []).map((item) => ({
    ...item,
    quantidade: Number(item.quantidade || 0),
    receitaTotal: Number(item.receitaTotal || 0),
    ticketMedio: Number(item.ticketMedio || 0),
    taxaCancelamento: Number(item.taxaCancelamento || 0),
  }))
  const maiorCancelamento = (tabelas.maiorCancelamento || []).map((item) => ({
    ...item,
    totalAgendamentos: Number(item.totalAgendamentos || 0),
    cancelamentos: Number(item.cancelamentos || 0),
    taxaCancelamento: Number(item.taxaCancelamento || 0),
    valorCancelado: Number(item.valorCancelado || 0),
  }))
  const servicosSemAgendamento = (tabelas.servicosSemAgendamento || []).map((item) => ({
    ...item,
    valorPadrao: Number(item.valorPadrao || 0),
    duracaoMin: Number(item.duracaoMin || 0),
    profissionaisVinculados: Number(item.profissionaisVinculados || 0),
    cancelamentosNoMes: Number(item.cancelamentosNoMes || 0),
  }))
  const servicosPorProfissional = (tabelas.servicosPorProfissional || []).map((item) => ({
    ...item,
    quantidade: Number(item.quantidade || 0),
    receitaTotal: Number(item.receitaTotal || 0),
    ticketMedio: Number(item.ticketMedio || 0),
    tempoTotalMin: Number(item.tempoTotalMin || 0),
    taxaCancelamento: Number(item.taxaCancelamento || 0),
  }))
  const mostraEmpresaRankingReceita = hasEmpresa(rankingReceita)
  const mostraEmpresaRankingQuantidade = hasEmpresa(rankingQuantidade)
  const mostraEmpresaCancelamento = hasEmpresa(maiorCancelamento)
  const mostraEmpresaSemAgendamento = hasEmpresa(servicosSemAgendamento)
  const mostraEmpresaPorProfissional = hasEmpresa(servicosPorProfissional)

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
        <ServicosMetricCard
          title="Serviços realizados no mês"
          value={loading ? '...' : formatNumber(cards.totalServicosMes)}
          helper="Procedimentos em agendamentos não cancelados"
          icon={Briefcase}
          tone="blue"
        />

        <ServicosMetricCard
          title="Receita por serviços"
          value={loading ? '...' : formatCurrency(cards.receitaServicosMes)}
          helper="Soma dos valores de serviços não cancelados"
          icon={DollarSign}
          tone="green"
        />

        <ServicosMetricCard
          title="Serviço mais vendido"
          value={loading ? '...' : serviceName(servicoMaisVendido)}
          helper={
            servicoMaisVendido
              ? `${formatNumber(servicoMaisVendido.quantidade)} serviços no mês`
              : 'Nenhum serviço encontrado'
          }
          icon={Star}
          tone="purple"
        />

        <ServicosMetricCard
          title="Serviço com maior receita"
          value={loading ? '...' : serviceName(servicoMaiorReceita)}
          helper={
            servicoMaiorReceita
              ? formatCurrency(servicoMaiorReceita.receita)
              : 'Nenhuma receita encontrada'
          }
          icon={TrendingUp}
          tone="green"
        />

        <ServicosMetricCard
          title="Ticket médio por serviço"
          value={loading ? '...' : formatCurrency(cards.ticketMedioServico)}
          helper="Receita de serviços / procedimentos"
          icon={DollarSign}
          tone="orange"
        />

        <ServicosMetricCard
          title="Tempo ocupado por serviços"
          value={loading ? '...' : formatDurationFromMinutes(cards.tempoTotalOcupadoMin)}
          helper="Duração somada dos procedimentos"
          icon={Clock}
          tone="blue"
        />

        <ServicosMetricCard
          title="Taxa de cancelamento"
          value={loading ? '...' : formatPercent(cards.taxaCancelamentoServicos)}
          helper="Serviços cancelados / total do mês"
          icon={Percent}
          tone="red"
        />

        <ServicosMetricCard
          title="Serviços sem movimento"
          value={loading ? '...' : formatNumber(cards.servicosSemMovimento)}
          helper="Serviços ativos sem agendamento no mês"
          icon={AlertCircle}
          tone="gray"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Serviços mais realizados"
          loading={loading}
          isEmpty={servicosMaisRealizados.length === 0}
          emptyMessage="Nenhum serviço realizado encontrado."
        >
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
                <Tooltip content={<QuantidadeTooltip />} />
                <Bar
                  dataKey="quantidade"
                  name="Quantidade"
                  fill={chartColors.blue}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Receita por serviço"
          loading={loading}
          isEmpty={receitaPorServico.length === 0}
          emptyMessage="Nenhuma receita encontrada para serviços."
        >
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
                <Tooltip content={<ReceitaTooltip />} />
                <Bar
                  dataKey="receita"
                  name="Receita"
                  fill={chartColors.green}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Cancelamentos por serviço"
          loading={loading}
          isEmpty={cancelamentosPorServico.length === 0}
          emptyMessage="Nenhum cancelamento registrado."
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cancelamentosPorServico} layout="vertical" margin={{ left: 16, right: 18 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="nomeCurto"
                  width={150}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <Tooltip content={<CancelamentosTooltip />} />
                <Bar
                  dataKey="cancelamentos"
                  name="Cancelamentos"
                  fill={chartColors.red}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Ocupação da agenda por serviço"
          loading={loading}
          isEmpty={ocupacaoPorServico.length === 0}
          emptyMessage="Sem dados suficientes para calcular ocupação por serviço."
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ocupacaoPorServico} layout="vertical" margin={{ left: 16, right: 18 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis
                  type="number"
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  tickFormatter={(value) => formatDurationFromMinutes(value)}
                />
                <YAxis
                  type="category"
                  dataKey="nomeCurto"
                  width={150}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <Tooltip content={<OcupacaoTooltip />} />
                <Bar
                  dataKey="tempoOcupadoMin"
                  name="Tempo ocupado"
                  fill={chartColors.orange}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard
        title="Evolução mensal dos principais serviços"
        loading={loading}
        isEmpty={!temEvolucaoMensal}
        emptyMessage="Ainda não há dados para este período."
      >
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolucaoMensalServicos}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="label" tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip content={<EvolucaoTooltip />} />
              <Legend />
              {evolucaoSeries.map((serie, index) => (
                <Line
                  key={serie.dataKey}
                  type="monotone"
                  dataKey={serie.dataKey}
                  name={serie.servicoNome}
                  stroke={lineColors[index % lineColors.length]}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TableCard
          title="Ranking por receita"
          loading={loading}
          isEmpty={rankingReceita.length === 0}
          emptyMessage="Nenhum serviço encontrado para este período."
        >
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2 font-semibold">Serviço</th>
                {mostraEmpresaRankingReceita && <th className="px-3 py-2 font-semibold">Empresa</th>}
                <th className="px-3 py-2 font-semibold">Receita</th>
                <th className="px-3 py-2 font-semibold">Qtd.</th>
                <th className="px-3 py-2 font-semibold">Ticket</th>
                <th className="px-3 py-2 font-semibold">Tempo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rankingReceita.map((item) => (
                <tr key={`${item.empresa || 'empresa'}-${item.servicoId}`} className="text-gray-700">
                  <td className="px-3 py-3 font-medium text-gray-900">{item.servicoNome}</td>
                  {mostraEmpresaRankingReceita && <td className="px-3 py-3">{item.empresa}</td>}
                  <td className="px-3 py-3">{formatCurrency(item.receitaTotal)}</td>
                  <td className="px-3 py-3">{formatNumber(item.quantidade)}</td>
                  <td className="px-3 py-3">{formatCurrency(item.ticketMedio)}</td>
                  <td className="px-3 py-3">{formatDurationFromMinutes(item.tempoTotalMin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>

        <TableCard
          title="Ranking por quantidade"
          loading={loading}
          isEmpty={rankingQuantidade.length === 0}
          emptyMessage="Nenhum serviço encontrado para este período."
        >
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2 font-semibold">Serviço</th>
                {mostraEmpresaRankingQuantidade && <th className="px-3 py-2 font-semibold">Empresa</th>}
                <th className="px-3 py-2 font-semibold">Qtd.</th>
                <th className="px-3 py-2 font-semibold">Receita</th>
                <th className="px-3 py-2 font-semibold">Ticket</th>
                <th className="px-3 py-2 font-semibold">Cancel.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rankingQuantidade.map((item) => (
                <tr key={`${item.empresa || 'empresa'}-${item.servicoId}`} className="text-gray-700">
                  <td className="px-3 py-3 font-medium text-gray-900">{item.servicoNome}</td>
                  {mostraEmpresaRankingQuantidade && <td className="px-3 py-3">{item.empresa}</td>}
                  <td className="px-3 py-3">{formatNumber(item.quantidade)}</td>
                  <td className="px-3 py-3">{formatCurrency(item.receitaTotal)}</td>
                  <td className="px-3 py-3">{formatCurrency(item.ticketMedio)}</td>
                  <td className="px-3 py-3"><CancelamentoBadge value={item.taxaCancelamento} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TableCard
          title="Maior taxa de cancelamento"
          loading={loading}
          isEmpty={maiorCancelamento.length === 0}
          emptyMessage="Nenhum cancelamento registrado."
        >
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2 font-semibold">Serviço</th>
                {mostraEmpresaCancelamento && <th className="px-3 py-2 font-semibold">Empresa</th>}
                <th className="px-3 py-2 font-semibold">Total</th>
                <th className="px-3 py-2 font-semibold">Cancel.</th>
                <th className="px-3 py-2 font-semibold">Taxa</th>
                <th className="px-3 py-2 font-semibold">Valor cancelado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {maiorCancelamento.map((item) => (
                <tr key={`${item.empresa || 'empresa'}-${item.servicoId}`} className="text-gray-700">
                  <td className="px-3 py-3 font-medium text-gray-900">{item.servicoNome}</td>
                  {mostraEmpresaCancelamento && <td className="px-3 py-3">{item.empresa}</td>}
                  <td className="px-3 py-3">{formatNumber(item.totalAgendamentos)}</td>
                  <td className="px-3 py-3">{formatNumber(item.cancelamentos)}</td>
                  <td className="px-3 py-3"><CancelamentoBadge value={item.taxaCancelamento} /></td>
                  <td className="px-3 py-3">{formatCurrency(item.valorCancelado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>

        <TableCard
          title="Serviços sem agendamento no mês"
          loading={loading}
          isEmpty={servicosSemAgendamento.length === 0}
          emptyMessage="Nenhum serviço sem movimento."
        >
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2 font-semibold">Serviço</th>
                {mostraEmpresaSemAgendamento && <th className="px-3 py-2 font-semibold">Empresa</th>}
                <th className="px-3 py-2 font-semibold">Valor</th>
                <th className="px-3 py-2 font-semibold">Duração</th>
                <th className="px-3 py-2 font-semibold">Prof.</th>
                <th className="px-3 py-2 font-semibold">Último agend.</th>
                <th className="px-3 py-2 font-semibold">Cancel.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {servicosSemAgendamento.map((item) => (
                <tr key={`${item.empresa || 'empresa'}-${item.servicoId}`} className="text-gray-700">
                  <td className="px-3 py-3 font-medium text-gray-900">{item.servicoNome}</td>
                  {mostraEmpresaSemAgendamento && <td className="px-3 py-3">{item.empresa}</td>}
                  <td className="px-3 py-3">{formatCurrency(item.valorPadrao)}</td>
                  <td className="px-3 py-3">{formatDurationFromMinutes(item.duracaoMin)}</td>
                  <td className="px-3 py-3">{formatNumber(item.profissionaisVinculados)}</td>
                  <td className="px-3 py-3">{formatDate(item.ultimoAgendamento)}</td>
                  <td className="px-3 py-3">{formatNumber(item.cancelamentosNoMes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      </div>

      <TableCard
        title="Serviços por profissional"
        loading={loading}
        isEmpty={servicosPorProfissional.length === 0}
        emptyMessage="Nenhum vínculo entre serviço e profissional encontrado."
      >
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-3 py-2 font-semibold">Profissional</th>
              <th className="px-3 py-2 font-semibold">Serviço</th>
              {mostraEmpresaPorProfissional && <th className="px-3 py-2 font-semibold">Empresa</th>}
              <th className="px-3 py-2 font-semibold">Qtd.</th>
              <th className="px-3 py-2 font-semibold">Receita</th>
              <th className="px-3 py-2 font-semibold">Ticket</th>
              <th className="px-3 py-2 font-semibold">Tempo</th>
              <th className="px-3 py-2 font-semibold">Cancel.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {servicosPorProfissional.map((item) => (
              <tr
                key={`${item.empresa || 'empresa'}-${item.profissionalId || 'sem-profissional'}-${item.servicoId}`}
                className="text-gray-700"
              >
                <td className="px-3 py-3 font-medium text-gray-900">{item.profissionalNome}</td>
                <td className="px-3 py-3">{item.servicoNome}</td>
                {mostraEmpresaPorProfissional && <td className="px-3 py-3">{item.empresa}</td>}
                <td className="px-3 py-3">{formatNumber(item.quantidade)}</td>
                <td className="px-3 py-3">{formatCurrency(item.receitaTotal)}</td>
                <td className="px-3 py-3">{formatCurrency(item.ticketMedio)}</td>
                <td className="px-3 py-3">{formatDurationFromMinutes(item.tempoTotalMin)}</td>
                <td className="px-3 py-3"><CancelamentoBadge value={item.taxaCancelamento} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  )
}
