import { useEffect, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Building2,
  Clock,
  RefreshCw,
  Server,
  Wifi,
  WifiOff,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Card, { CardBody, CardHeader } from '../../components/ui/Card'
import dashboardService from '../../services/dashboard.service'

const chartColors = {
  blue: '#3B82F6',
  green: '#10B981',
  orange: '#F59E0B',
  purple: '#8B5CF6',
  red: '#EF4444',
  gray: '#6B7280',
}

const statusLabels = {
  online: 'Online',
  offline: 'Offline',
  instavel: 'Instável',
  desconhecido: 'Desconhecido',
}

const statusColors = {
  online: chartColors.green,
  offline: chartColors.red,
  instavel: chartColors.orange,
  desconhecido: chartColors.gray,
}

const EMPTY_DATA = {
  cards: {
    instanciasOnline: 0,
    instanciasOffline: 0,
    instanciasInstaveis: 0,
    alertasAbertos: 0,
    empresasAcaoSuporte: 0,
    maiorTempoOfflineSeg: null,
    mediaOfflineConsecutivo: 0,
    ultimaConferenciaEm: null,
  },
  graficos: {
    statusAtualInstancias: [],
    evolucaoQuedasPorDia: [],
    rankingEmpresasQuedas: [],
    disponibilidadePorInstancia: [],
    alertasPorDia: [],
    eventosPorOrigem: [],
  },
  tabelas: {
    instanciasAlertaAberto: [],
    instanciasOfflineAgora: [],
    historicoEventos: [],
    ultimosAlertas: [],
    alertasResolvidos: [],
    empresasMaiorInstabilidade: [],
  },
}

function formatNumber(value, maximumFractionDigits = 0) {
  return Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  })
}

function formatPercent(value) {
  if (value === null || value === undefined) return 'Sem dados'
  return `${formatNumber(value, 1)}%`
}

function truncateLabel(value, maxLength = 24) {
  const label = String(value || '')
  if (label.length <= maxLength) return label || '—'
  return `${label.slice(0, maxLength - 1)}...`
}

function formatDurationFromSeconds(value) {
  if (value === null || value === undefined) return 'Sem instâncias offline'

  const totalSeconds = Math.max(0, Math.round(Number(value || 0)))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`
  }

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`
  }

  if (minutes > 0) return `${minutes}min`

  return `${totalSeconds}s`
}

function formatDateTime(value) {
  if (!value) return 'Sem conferência registrada'

  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

function formatTableDateTime(value) {
  if (!value) return '—'

  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

function formatOptionalDuration(value) {
  if (value === null || value === undefined) return '—'
  return formatDurationFromSeconds(value)
}

function formatText(value) {
  return value === null || value === undefined || value === '' ? '—' : String(value)
}

function truncateText(value, maxLength = 72) {
  const text = formatText(value)
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1)}...`
}

function EvolutionMetricCard({ title, value, helper, icon: Icon, tone = 'blue' }) {
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

function LoadingState() {
  return <div className="py-10 text-center text-gray-500">Carregando...</div>
}

function EmptyChart({ children }) {
  return (
    <div className="flex h-72 flex-col items-center justify-center text-center text-gray-500">
      <BarChart3 className="mb-3 h-11 w-11 text-gray-400" />
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
          <EmptyChart>{emptyMessage}</EmptyChart>
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
          <div className="py-10 text-center text-gray-500">{emptyMessage}</div>
        ) : (
          <div className="table-scroll">{children}</div>
        )}
      </CardBody>
    </Card>
  )
}

function StatusBadge({ value }) {
  const status = String(value || 'desconhecido').toLowerCase()
  const tone = status.includes('online')
    ? 'bg-green-50 text-green-700'
    : status.includes('offline')
      ? 'bg-red-50 text-red-700'
      : status.includes('instavel')
        ? 'bg-orange-50 text-orange-700'
        : 'bg-gray-100 text-gray-700'

  return (
    <span className={`inline-flex w-fit whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      {statusLabels[status] || value || 'Desconhecido'}
    </span>
  )
}

function SeverityBadge({ value }) {
  const severity = String(value || '').toLowerCase()
  const tone = severity.includes('crit') || severity.includes('alta')
    ? 'bg-red-50 text-red-700'
    : severity.includes('media') || severity.includes('média')
      ? 'bg-orange-50 text-orange-700'
      : severity.includes('baixa')
        ? 'bg-blue-50 text-blue-700'
        : 'bg-gray-100 text-gray-700'

  return (
    <span className={`inline-flex w-fit whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      {value || 'Sem severidade'}
    </span>
  )
}

function BooleanBadge({ value, trueLabel = 'Sim', falseLabel = 'Não' }) {
  const tone = value ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'

  return (
    <span className={`inline-flex w-fit whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      {value ? trueLabel : falseLabel}
    </span>
  )
}

function hasEmpresa(rows) {
  return (rows || []).some((row) => Boolean(row.empresa))
}

function DataTable({ children }) {
  return <table className="min-w-full divide-y divide-gray-200 text-sm">{children}</table>
}

function Th({ children }) {
  return <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{children}</th>
}

function Td({ children, className = '' }) {
  return <td className={`px-3 py-3 align-top text-gray-600 ${className}`}>{children}</td>
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

function StatusTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload

  return (
    <TooltipContainer title={data.statusLabel}>
      <TooltipRow label="Instâncias" value={formatNumber(data.quantidade)} />
    </TooltipContainer>
  )
}

function DiaTooltip({ active, payload, label, dataKey, labelText, helper }) {
  if (!active || !payload?.length) return null

  return (
    <TooltipContainer title={label}>
      <TooltipRow label={labelText} value={formatNumber(payload[0].payload[dataKey])} />
      {helper && <p className="pt-1 text-xs text-gray-500">{helper}</p>}
    </TooltipContainer>
  )
}

function RankingQuedasTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload

  return (
    <TooltipContainer title={data.empresa}>
      <TooltipRow label="Quedas" value={formatNumber(data.quedas)} />
    </TooltipContainer>
  )
}

function OrigemTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload

  return (
    <TooltipContainer title={data.origem}>
      <TooltipRow label="Eventos" value={formatNumber(data.quantidade)} />
      <TooltipRow label="Participação" value={formatPercent(data.percentual)} />
    </TooltipContainer>
  )
}

function DisponibilidadeTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload

  return (
    <TooltipContainer title={data.instanciaNome}>
      {data.empresa && <TooltipRow label="Empresa" value={data.empresa} />}
      <TooltipRow label="Disponibilidade observada" value={formatPercent(data.disponibilidadeObservada)} />
      <TooltipRow label="Eventos online" value={formatNumber(data.eventosOnline)} />
      <TooltipRow label="Eventos offline" value={formatNumber(data.eventosOffline)} />
      <TooltipRow label="Eventos instáveis" value={formatNumber(data.eventosInstaveis)} />
      <TooltipRow label="Base" value="Eventos registrados no período" />
    </TooltipContainer>
  )
}

export default function WhatsAppEvolution({ dateRange }) {
  const [loading, setLoading] = useState(true)
  const [whatsAppData, setWhatsAppData] = useState(EMPTY_DATA)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true)
      setErrorMessage('')

      try {
        const response = await dashboardService.getWhatsAppEvolution(dateRange)
        setWhatsAppData(response.data || EMPTY_DATA)
      } catch (error) {
        console.error('Erro ao carregar WhatsApp / Evolution:', error)
        setErrorMessage('Não foi possível carregar os dados do WhatsApp / Evolution agora.')
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [dateRange])

  const cards = whatsAppData?.cards || EMPTY_DATA.cards
  const graficos = whatsAppData?.graficos || EMPTY_DATA.graficos
  const tabelas = whatsAppData?.tabelas || EMPTY_DATA.tabelas
  const statusAtualInstancias = (graficos.statusAtualInstancias || []).map((item) => ({
    ...item,
    statusLabel: statusLabels[item.status] || item.status || 'Desconhecido',
    quantidade: Number(item.quantidade || 0),
  }))
  const evolucaoQuedasPorDia = (graficos.evolucaoQuedasPorDia || []).map((item) => ({
    ...item,
    quedas: Number(item.quedas || 0),
  }))
  const rankingEmpresasQuedas = (graficos.rankingEmpresasQuedas || []).map((item) => ({
    ...item,
    empresa: item.empresa || 'Empresa não informada',
    empresaCurta: truncateLabel(item.empresa || 'Empresa não informada', 28),
    quedas: Number(item.quedas || 0),
  }))
  const alertasPorDia = (graficos.alertasPorDia || []).map((item) => ({
    ...item,
    alertas: Number(item.alertas || 0),
  }))
  const eventosPorOrigem = (graficos.eventosPorOrigem || []).map((item) => ({
    ...item,
    origem: item.origem || 'desconhecida',
    origemCurta: truncateLabel(item.origem || 'desconhecida', 24),
    quantidade: Number(item.quantidade || 0),
    percentual: Number(item.percentual || 0),
  }))
  const disponibilidadePorInstancia = (graficos.disponibilidadePorInstancia || []).map((item) => ({
    ...item,
    instanciaNome: item.instanciaNome || 'Instância não informada',
    instanciaCurta: truncateLabel(item.instanciaNome || 'Instância não informada', 26),
    eventosOnline: Number(item.eventosOnline || 0),
    eventosOffline: Number(item.eventosOffline || 0),
    eventosInstaveis: Number(item.eventosInstaveis || 0),
    totalEventos: Number(item.totalEventos || 0),
    disponibilidadeObservada: item.disponibilidadeObservada === null || item.disponibilidadeObservada === undefined
      ? null
      : Number(item.disponibilidadeObservada),
    disponibilidadeGrafico: item.disponibilidadeObservada === null || item.disponibilidadeObservada === undefined
      ? 0
      : Number(item.disponibilidadeObservada),
  }))
  const temStatusAtual = statusAtualInstancias.some((item) => item.quantidade > 0)
  const temQuedas = evolucaoQuedasPorDia.some((item) => item.quedas > 0)
  const temAlertas = alertasPorDia.some((item) => item.alertas > 0)
  const temDisponibilidade = disponibilidadePorInstancia.some((item) => item.totalEventos > 0)
  const instanciasAlertaAberto = (tabelas.instanciasAlertaAberto || []).map((item) => ({
    ...item,
    offlineConsecutivo: Number(item.offlineConsecutivo || 0),
    tempoOfflineSeg: item.tempoOfflineSeg === null || item.tempoOfflineSeg === undefined
      ? null
      : Number(item.tempoOfflineSeg),
  }))
  const instanciasOfflineAgora = (tabelas.instanciasOfflineAgora || []).map((item) => ({
    ...item,
    offlineConsecutivo: Number(item.offlineConsecutivo || 0),
    alertaAberto: Boolean(item.alertaAberto),
    monitorarConexao: Boolean(item.monitorarConexao),
  }))
  const historicoEventos = (tabelas.historicoEventos || []).map((item) => ({
    ...item,
    sucesso: item.sucesso === null || item.sucesso === undefined ? null : Boolean(item.sucesso),
  }))
  const ultimosAlertas = (tabelas.ultimosAlertas || []).map((item) => ({
    ...item,
    offlineConsecutivo: Number(item.offlineConsecutivo || 0),
    resolvido: Boolean(item.resolvido),
  }))
  const alertasResolvidos = (tabelas.alertasResolvidos || []).map((item) => ({
    ...item,
    tempoResolucaoSeg: item.tempoResolucaoSeg === null || item.tempoResolucaoSeg === undefined
      ? null
      : Number(item.tempoResolucaoSeg),
  }))
  const empresasMaiorInstabilidade = (tabelas.empresasMaiorInstabilidade || []).map((item) => ({
    ...item,
    empresa: item.empresa || 'Empresa não informada',
    instanciasMonitoradas: Number(item.instanciasMonitoradas || 0),
    eventosOffline: Number(item.eventosOffline || 0),
    eventosInstaveis: Number(item.eventosInstaveis || 0),
    totalAlertas: Number(item.totalAlertas || 0),
    alertasAbertos: Number(item.alertasAbertos || 0),
    instanciasOfflineAgora: Number(item.instanciasOfflineAgora || 0),
  }))
  const mostraEmpresaAlerta = hasEmpresa(instanciasAlertaAberto)
  const mostraEmpresaOffline = hasEmpresa(instanciasOfflineAgora)
  const mostraEmpresaEventos = hasEmpresa(historicoEventos)
  const mostraEmpresaUltimosAlertas = hasEmpresa(ultimosAlertas)
  const mostraEmpresaResolvidos = hasEmpresa(alertasResolvidos)

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
        <EvolutionMetricCard
          title="Instâncias online"
          value={loading ? '...' : formatNumber(cards.instanciasOnline)}
          helper="Instâncias monitoradas com status online"
          icon={Wifi}
          tone="green"
        />

        <EvolutionMetricCard
          title="Instâncias offline"
          value={loading ? '...' : formatNumber(cards.instanciasOffline)}
          helper="Instâncias monitoradas com status offline"
          icon={WifiOff}
          tone="red"
        />

        <EvolutionMetricCard
          title="Instâncias instáveis"
          value={loading ? '...' : formatNumber(cards.instanciasInstaveis)}
          helper="Instâncias em conexão ou estado instável"
          icon={RefreshCw}
          tone="orange"
        />

        <EvolutionMetricCard
          title="Alertas abertos"
          value={loading ? '...' : formatNumber(cards.alertasAbertos)}
          helper="Instâncias com alerta ainda não resolvido"
          icon={AlertTriangle}
          tone="red"
        />

        <EvolutionMetricCard
          title="Empresas exigindo ação do suporte"
          value={loading ? '...' : formatNumber(cards.empresasAcaoSuporte)}
          helper="Empresas com instância offline ou alerta aberto"
          icon={Building2}
          tone="purple"
        />

        <EvolutionMetricCard
          title="Maior tempo offline atual"
          value={loading ? '...' : formatDurationFromSeconds(cards.maiorTempoOfflineSeg)}
          helper="Calculado desde a primeira queda registrada"
          icon={Clock}
          tone="red"
        />

        <EvolutionMetricCard
          title="Média de conferências offline consecutivas"
          value={loading ? '...' : formatNumber(cards.mediaOfflineConsecutivo, 1)}
          helper="Média entre instâncias atualmente offline"
          icon={Server}
          tone="gray"
        />

        <EvolutionMetricCard
          title="Última conferência realizada"
          value={loading ? '...' : formatDateTime(cards.ultimaConferenciaEm)}
          helper="Último monitoramento registrado"
          icon={Clock}
          tone="blue"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Status atual das instâncias"
          description="Distribuição das instâncias monitoradas por status atual"
          loading={loading}
          isEmpty={!temStatusAtual}
          emptyMessage="Nenhuma instância monitorada encontrada."
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusAtualInstancias} margin={{ left: 8, right: 18 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="statusLabel" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip content={<StatusTooltip />} />
                <Bar dataKey="quantidade" name="Instâncias" radius={[4, 4, 0, 0]}>
                  {statusAtualInstancias.map((entry) => (
                    <Cell key={entry.status} fill={statusColors[entry.status] || chartColors.gray} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Quedas iniciadas por dia"
          description="Novos episódios de queda identificados no período"
          loading={loading}
          isEmpty={!temQuedas}
          emptyMessage="Nenhuma queda registrada no período."
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={evolucaoQuedasPorDia} margin={{ left: 8, right: 18 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="label" interval="preserveStartEnd" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip
                  content={(
                    <DiaTooltip
                      dataKey="quedas"
                      labelText="Quedas iniciadas"
                      helper="Não conta conferências repetidas da mesma queda."
                    />
                  )}
                />
                <Bar dataKey="quedas" name="Quedas iniciadas" fill={chartColors.red} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Empresas com mais quedas iniciadas"
          description="Conta novos episódios de queda, sem duplicar conferências repetidas durante a mesma indisponibilidade."
          loading={loading}
          isEmpty={rankingEmpresasQuedas.length === 0}
          emptyMessage="Nenhuma queda registrada no período."
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rankingEmpresasQuedas} layout="vertical" margin={{ left: 16, right: 18 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="empresaCurta"
                  width={150}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <Tooltip content={<RankingQuedasTooltip />} />
                <Bar dataKey="quedas" name="Quedas" fill={chartColors.orange} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Alertas disparados por dia"
          description="Alertas operacionais registrados no período"
          loading={loading}
          isEmpty={!temAlertas}
          emptyMessage="Nenhum alerta disparado no período."
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alertasPorDia} margin={{ left: 8, right: 18 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="label" interval="preserveStartEnd" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip content={<DiaTooltip dataKey="alertas" labelText="Alertas" />} />
                <Bar dataKey="alertas" name="Alertas" fill={chartColors.purple} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Eventos por origem"
          description="Origem técnica dos eventos registrados"
          loading={loading}
          isEmpty={eventosPorOrigem.length === 0}
          emptyMessage="Nenhum evento registrado no período."
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventosPorOrigem} layout="vertical" margin={{ left: 16, right: 18 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="origemCurta"
                  width={150}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <Tooltip content={<OrigemTooltip />} />
                <Bar dataKey="quantidade" name="Eventos" fill={chartColors.blue} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Disponibilidade observada por instância"
          description="Baseado nos eventos registrados no período. Não representa SLA oficial."
          loading={loading}
          isEmpty={!temDisponibilidade}
          emptyMessage="Sem dados suficientes para calcular disponibilidade observada."
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={disponibilidadePorInstancia} layout="vertical" margin={{ left: 16, right: 18 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis
                  type="category"
                  dataKey="instanciaCurta"
                  width={150}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <Tooltip content={<DisponibilidadeTooltip />} />
                <Bar
                  dataKey="disponibilidadeGrafico"
                  name="Disponibilidade observada"
                  fill={chartColors.green}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TableCard
          title="Instâncias com alerta aberto"
          description="Instâncias que precisam de acompanhamento operacional"
          loading={loading}
          isEmpty={instanciasAlertaAberto.length === 0}
          emptyMessage="Nenhum alerta aberto."
        >
          <DataTable>
            <thead>
              <tr>
                {mostraEmpresaAlerta && <Th>Empresa</Th>}
                <Th>Instância</Th>
                <Th>Status</Th>
                <Th>Severidade</Th>
                <Th>Offline</Th>
                <Th>Último alerta</Th>
                <Th>Evolution ID</Th>
                <Th>Servidor</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {instanciasAlertaAberto.map((item, index) => (
                <tr key={`${item.instanciaId || item.instanciaNome}-${index}`}>
                  {mostraEmpresaAlerta && <Td>{formatText(item.empresa)}</Td>}
                  <Td className="font-medium text-gray-900">
                    <p>{formatText(item.instanciaNome)}</p>
                    <p className="text-xs text-gray-500">{truncateText(item.statusReason, 42)}</p>
                  </Td>
                  <Td><StatusBadge value={item.statusAtual} /></Td>
                  <Td><SeverityBadge value={item.severidade} /></Td>
                  <Td>
                    <p>{formatOptionalDuration(item.tempoOfflineSeg)}</p>
                    <p className="text-xs text-gray-500">{formatNumber(item.offlineConsecutivo)} conferências</p>
                  </Td>
                  <Td>
                    <p>{formatTableDateTime(item.ultimoAlertaEm)}</p>
                    <p className="text-xs text-gray-500">Queda: {formatTableDateTime(item.primeiraQuedaEm)}</p>
                  </Td>
                  <Td>{truncateText(item.evolutionInstanceId, 28)}</Td>
                  <Td>{truncateText(item.serverUrl, 36)}</Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </TableCard>

        <TableCard
          title="Instâncias offline agora"
          description="Estado atual das instâncias monitoradas offline"
          loading={loading}
          isEmpty={instanciasOfflineAgora.length === 0}
          emptyMessage="Nenhuma instância offline no momento."
        >
          <DataTable>
            <thead>
              <tr>
                {mostraEmpresaOffline && <Th>Empresa</Th>}
                <Th>Instância</Th>
                <Th>Status</Th>
                <Th>State</Th>
                <Th>Primeira queda</Th>
                <Th>Última ocorrência</Th>
                <Th>Conferências</Th>
                <Th>Alerta</Th>
                <Th>Monitoramento</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {instanciasOfflineAgora.map((item, index) => (
                <tr key={`${item.instanciaNome}-${item.primeiraQuedaEm}-${index}`}>
                  {mostraEmpresaOffline && <Td>{formatText(item.empresa)}</Td>}
                  <Td className="font-medium text-gray-900">
                    <p>{formatText(item.instanciaNome)}</p>
                    <p className="text-xs text-gray-500">{truncateText(item.statusReason, 42)}</p>
                  </Td>
                  <Td><StatusBadge value={item.status} /></Td>
                  <Td>{formatText(item.state)}</Td>
                  <Td>{formatTableDateTime(item.primeiraQuedaEm)}</Td>
                  <Td>
                    <p>{formatTableDateTime(item.ultimaOcorrenciaEm)}</p>
                    <p className="text-xs text-gray-500">Conf.: {formatTableDateTime(item.ultimaConferenciaEm)}</p>
                  </Td>
                  <Td>{formatNumber(item.offlineConsecutivo)}</Td>
                  <Td><BooleanBadge value={item.alertaAberto} trueLabel="Aberto" falseLabel="Sem alerta" /></Td>
                  <Td><BooleanBadge value={item.monitorarConexao} trueLabel="Ativo" falseLabel="Inativo" /></Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </TableCard>
      </div>

      <TableCard
        title="Histórico recente de eventos"
        description="Eventos técnicos registrados no período, sem payload completo"
        loading={loading}
        isEmpty={historicoEventos.length === 0}
        emptyMessage="Nenhum evento registrado no período."
      >
        <DataTable>
          <thead>
            <tr>
              <Th>Data/hora</Th>
              {mostraEmpresaEventos && <Th>Empresa</Th>}
              <Th>Instância</Th>
              <Th>Tipo</Th>
              <Th>Origem</Th>
              <Th>Status</Th>
              <Th>State</Th>
              <Th>Sucesso</Th>
              <Th>Erro</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {historicoEventos.map((item, index) => (
              <tr key={`${item.eventoId || item.dataHora}-${index}`}>
                <Td>{formatTableDateTime(item.dataHora)}</Td>
                {mostraEmpresaEventos && <Td>{formatText(item.empresa)}</Td>}
                <Td className="font-medium text-gray-900">{formatText(item.instanciaNome)}</Td>
                <Td>{truncateText(item.tipoEvento, 28)}</Td>
                <Td>{formatText(item.origem)}</Td>
                <Td><StatusBadge value={item.statusNormalizado} /></Td>
                <Td>
                  <p>{formatText(item.state)}</p>
                  <p className="text-xs text-gray-500">{truncateText(item.statusReason, 36)}</p>
                </Td>
                <Td>
                  {item.sucesso === null
                    ? '—'
                    : <BooleanBadge value={item.sucesso} trueLabel="Sim" falseLabel="Não" />}
                </Td>
                <Td>
                  <p>{formatText(item.erroTipo)}</p>
                  <p className="text-xs text-gray-500">{truncateText(item.erroDetalhe, 52)}</p>
                </Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </TableCard>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TableCard
          title="Últimos alertas enviados"
          description="Alertas operacionais disparados no período"
          loading={loading}
          isEmpty={ultimosAlertas.length === 0}
          emptyMessage="Nenhum alerta disparado no período."
        >
          <DataTable>
            <thead>
              <tr>
                <Th>Disparo</Th>
                {mostraEmpresaUltimosAlertas && <Th>Empresa</Th>}
                <Th>Instância</Th>
                <Th>Tipo</Th>
                <Th>Severidade</Th>
                <Th>Status</Th>
                <Th>Resolvido</Th>
                <Th>Mensagem</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ultimosAlertas.map((item, index) => (
                <tr key={`${item.alertaId || item.disparadoEm}-${index}`}>
                  <Td>
                    <p>{formatTableDateTime(item.disparadoEm)}</p>
                    <p className="text-xs text-gray-500">1ª ocorrência: {formatTableDateTime(item.primeiraOcorrenciaEm)}</p>
                  </Td>
                  {mostraEmpresaUltimosAlertas && <Td>{formatText(item.empresa)}</Td>}
                  <Td className="font-medium text-gray-900">{formatText(item.instanciaNome)}</Td>
                  <Td>{truncateText(item.tipoAlerta, 28)}</Td>
                  <Td><SeverityBadge value={item.severidade} /></Td>
                  <Td><StatusBadge value={item.statusNormalizado} /></Td>
                  <Td>
                    <BooleanBadge value={item.resolvido} trueLabel="Resolvido" falseLabel="Aberto" />
                    <p className="mt-1 text-xs text-gray-500">{formatTableDateTime(item.resolvidoEm)}</p>
                  </Td>
                  <Td>
                    <p>{truncateText(item.mensagem, 64)}</p>
                    <p className="text-xs text-gray-500">{formatNumber(item.offlineConsecutivo)} conferências offline</p>
                  </Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </TableCard>

        <TableCard
          title="Alertas resolvidos"
          description="Alertas resolvidos no período"
          loading={loading}
          isEmpty={alertasResolvidos.length === 0}
          emptyMessage="Nenhum alerta resolvido no período."
        >
          <DataTable>
            <thead>
              <tr>
                {mostraEmpresaResolvidos && <Th>Empresa</Th>}
                <Th>Instância</Th>
                <Th>Tipo</Th>
                <Th>Severidade</Th>
                <Th>Disparado</Th>
                <Th>Resolvido</Th>
                <Th>Tempo</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {alertasResolvidos.map((item, index) => (
                <tr key={`${item.alertaId || item.resolvidoEm}-${index}`}>
                  {mostraEmpresaResolvidos && <Td>{formatText(item.empresa)}</Td>}
                  <Td className="font-medium text-gray-900">{formatText(item.instanciaNome)}</Td>
                  <Td>{truncateText(item.tipoAlerta, 28)}</Td>
                  <Td><SeverityBadge value={item.severidade} /></Td>
                  <Td>{formatTableDateTime(item.disparadoEm)}</Td>
                  <Td>{formatTableDateTime(item.resolvidoEm)}</Td>
                  <Td>{formatOptionalDuration(item.tempoResolucaoSeg)}</Td>
                  <Td><StatusBadge value={item.statusNormalizado} /></Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </TableCard>
      </div>

      <TableCard
        title="Empresas com maior instabilidade"
        description="Consolidação de problemas técnicos de conexão no período"
        loading={loading}
        isEmpty={empresasMaiorInstabilidade.length === 0}
        emptyMessage="Nenhuma instabilidade registrada no período."
      >
        <DataTable>
          <thead>
            <tr>
              <Th>Empresa</Th>
              <Th>Instâncias monitoradas</Th>
              <Th>Eventos offline</Th>
              <Th>Eventos instáveis</Th>
              <Th>Total de alertas</Th>
              <Th>Alertas abertos</Th>
              <Th>Offline agora</Th>
              <Th>Última ocorrência</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {empresasMaiorInstabilidade.map((item) => (
              <tr key={item.empresaId || item.empresa}>
                <Td className="font-medium text-gray-900">{formatText(item.empresa)}</Td>
                <Td>{formatNumber(item.instanciasMonitoradas)}</Td>
                <Td>{formatNumber(item.eventosOffline)}</Td>
                <Td>{formatNumber(item.eventosInstaveis)}</Td>
                <Td>{formatNumber(item.totalAlertas)}</Td>
                <Td>{formatNumber(item.alertasAbertos)}</Td>
                <Td>{formatNumber(item.instanciasOfflineAgora)}</Td>
                <Td>{formatTableDateTime(item.ultimaOcorrencia)}</Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </TableCard>
    </div>
  )
}
