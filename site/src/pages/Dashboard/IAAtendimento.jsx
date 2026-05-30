import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Bot,
  Building2,
  CalendarCheck,
  CheckCircle2,
  CircleOff,
  HelpCircle,
  MessageSquare,
  Percent,
  Timer,
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
import { useAuth } from '../../contexts/AuthContext'
import dashboardService from '../../services/dashboard.service'

const SUPER_ADMIN_ID = '550e8400-e29b-41d4-a716-446655440012'

const EMPTY_DATA = {
  cards: {
    conversasIniciadas: 0,
    conversasConcluidas: 0,
    conversasAbandonadas: 0,
    conversasAgendamento: 0,
    taxaConversao: 0,
    mediaMensagensPorConversa: 0,
    tempoMedioPrimeiraRespostaSeg: 0,
    tempoMedioConclusaoSeg: 0,
    taxaAskMissingInfo: 0,
    errosRegistrados: 0,
    errosEmValidacao: true,
  },
  graficos: {
    evolucaoDiariaConversas: [],
    funilAtendimento: [],
    intencoesMaisDetectadas: [],
    acoesMaisExecutadas: [],
    distribuicaoResultados: [],
    distribuicaoTipoMensagem: [],
    taxaAskMissingInfoPorDia: [],
    errosPorTipo: [],
  },
  tabelas: {
    conversasRecentes: [],
    conversasAbandonadas: [],
    conversasComErro: [],
    principaisIntentsActions: [],
    empresasMaiorVolume: [],
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

function formatNumber(value, maximumFractionDigits = 0) {
  return Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  })
}

function formatPercent(value) {
  return `${formatNumber(value, 1)}%`
}

function formatDurationFromSeconds(value) {
  const totalSeconds = Math.max(0, Math.round(Number(value || 0)))

  if (totalSeconds < 60) return `${totalSeconds}s`

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`
  }

  return seconds > 0 ? `${minutes}min ${seconds}s` : `${minutes}min`
}

function formatOptionalDuration(value) {
  if (value === null || value === undefined) return '—'
  return formatDurationFromSeconds(value)
}

function formatDateTime(value) {
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

function formatText(value) {
  return value || '—'
}

function truncateText(value, maxLength = 24) {
  const text = String(value || '')
  if (text.length <= maxLength) return text || '—'
  return `${text.slice(0, maxLength - 1)}...`
}

function MetricCard({ title, value, helper, icon: Icon, tone = 'blue', badge }) {
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
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              {badge && (
                <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700">
                  {badge}
                </span>
              )}
            </div>
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

function EmptyState({ children }) {
  return (
    <div className="py-10 text-center text-gray-500">
      <BarChart3 className="mx-auto mb-3 h-11 w-11 text-gray-400" />
      <p>{children}</p>
    </div>
  )
}

function ChartCard({ title, description, badge, loading, isEmpty, emptyMessage, children }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
          {badge && (
            <span className="w-fit rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
              {badge}
            </span>
          )}
        </div>
      </CardHeader>
      <CardBody>
        {loading ? (
          <LoadingState />
        ) : isEmpty ? (
          <EmptyState>{emptyMessage}</EmptyState>
        ) : (
          children
        )}
      </CardBody>
    </Card>
  )
}

function TableCard({ title, description, badge, loading, isEmpty, emptyMessage, children }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
          {badge && (
            <span className="w-fit rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
              {badge}
            </span>
          )}
        </div>
      </CardHeader>
      <CardBody>
        {loading ? (
          <LoadingState />
        ) : isEmpty ? (
          <EmptyState>{emptyMessage}</EmptyState>
        ) : (
          <div className="overflow-x-auto">{children}</div>
        )}
      </CardBody>
    </Card>
  )
}

function StatusBadge({ value }) {
  const normalized = String(value || '').toLowerCase()
  const tone = normalized.includes('conclu')
    ? 'bg-green-50 text-green-700'
    : normalized.includes('abandon')
      ? 'bg-gray-100 text-gray-700'
      : normalized.includes('erro')
        ? 'bg-red-50 text-red-700'
        : 'bg-blue-50 text-blue-700'

  return (
    <span className={`inline-flex w-fit whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      {value || '—'}
    </span>
  )
}

function hasEmpresa(items) {
  return (items || []).some((item) => Boolean(item.empresa))
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

function hasAnyValue(items, keys) {
  return (items || []).some((item) => keys.some((key) => Number(item[key] || 0) > 0))
}

function QuantidadeTooltip({ active, payload, labelKey, label }) {
  if (!active || !payload?.length) return null

  const data = payload[0].payload
  const title = data[labelKey] || label || '-'

  return (
    <TooltipContainer title={title}>
      <TooltipRow label="Quantidade" value={formatNumber(data.quantidade)} />
      {data.percentual !== undefined && (
        <TooltipRow label="Percentual" value={formatPercent(data.percentual)} />
      )}
    </TooltipContainer>
  )
}

function EvolucaoTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <TooltipContainer title={label}>
      {payload.map((item) => (
        <TooltipRow key={item.dataKey} label={item.name} value={formatNumber(item.value)} />
      ))}
    </TooltipContainer>
  )
}

function AskMissingTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  const data = payload[0].payload

  return (
    <TooltipContainer title={label}>
      <TooltipRow label="Taxa" value={formatPercent(data.taxa)} />
      <TooltipRow label="Total de ações" value={formatNumber(data.totalActions)} />
      <TooltipRow label="ask_missing_info" value={formatNumber(data.askMissingInfo)} />
    </TooltipContainer>
  )
}

export default function IAAtendimento({ dateRange }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(EMPTY_DATA)
  const [errorMessage, setErrorMessage] = useState('')

  const isSuperAdmin = user?.nivel_acesso_id === SUPER_ADMIN_ID

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true)
      setErrorMessage('')

      try {
        const response = await dashboardService.getIAAtendimento(dateRange)
        setData(response.data || EMPTY_DATA)
      } catch (error) {
        console.error('Erro ao carregar IA / Atendimento:', error)
        setErrorMessage('Não foi possível carregar os dados de IA / Atendimento agora.')
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [dateRange])

  const cards = data.cards || EMPTY_DATA.cards
  const graficos = data.graficos || EMPTY_DATA.graficos
  const tabelas = data.tabelas || EMPTY_DATA.tabelas

  const funilAtendimento = useMemo(() => (
    graficos.funilAtendimento || []
  ), [graficos.funilAtendimento])

  const hasEvolucaoDiaria = hasAnyValue(graficos.evolucaoDiariaConversas, [
    'iniciadas',
    'concluidas',
    'abandonadas',
    'agendamentos',
  ])
  const hasFunil = hasAnyValue(funilAtendimento, ['quantidade'])
  const hasIntencoes = hasAnyValue(graficos.intencoesMaisDetectadas, ['quantidade'])
  const hasAcoes = hasAnyValue(graficos.acoesMaisExecutadas, ['quantidade'])
  const hasResultados = hasAnyValue(graficos.distribuicaoResultados, ['quantidade'])
  const hasTipoMensagem = hasAnyValue(graficos.distribuicaoTipoMensagem, ['quantidade'])
  const hasAskMissingPorDia = hasAnyValue(graficos.taxaAskMissingInfoPorDia, ['totalActions'])
  const hasErrosPorTipo = hasAnyValue(graficos.errosPorTipo, ['quantidade'])
  const showEmpresaConversasRecentes = isSuperAdmin && hasEmpresa(tabelas.conversasRecentes)
  const showEmpresaConversasAbandonadas = isSuperAdmin && hasEmpresa(tabelas.conversasAbandonadas)
  const showEmpresaConversasComErro = isSuperAdmin && hasEmpresa(tabelas.conversasComErro)

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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Conversas iniciadas"
          value={loading ? '...' : formatNumber(cards.conversasIniciadas)}
          helper="Conversas abertas no período"
          icon={Bot}
          tone="blue"
        />
        <MetricCard
          title="Conversas concluídas"
          value={loading ? '...' : formatNumber(cards.conversasConcluidas)}
          helper="Status concluída ou conclusão registrada"
          icon={CheckCircle2}
          tone="green"
        />
        <MetricCard
          title="Conversas abandonadas"
          value={loading ? '...' : formatNumber(cards.conversasAbandonadas)}
          helper="Status abandonada registrado"
          icon={CircleOff}
          tone="gray"
        />
        <MetricCard
          title="Viraram agendamento"
          value={loading ? '...' : formatNumber(cards.conversasAgendamento)}
          helper="Conversas com resultado agendamento"
          icon={CalendarCheck}
          tone="purple"
        />
        <MetricCard
          title="Taxa de conversão"
          value={loading ? '...' : formatPercent(cards.taxaConversao)}
          helper="Agendamentos sobre conversas iniciadas"
          icon={Percent}
          tone="orange"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Média de mensagens"
          value={loading ? '...' : formatNumber(cards.mediaMensagensPorConversa, 1)}
          helper="Cliente + agente por conversa"
          icon={MessageSquare}
          tone="blue"
        />
        <MetricCard
          title="Primeira resposta"
          value={loading ? '...' : formatDurationFromSeconds(cards.tempoMedioPrimeiraRespostaSeg)}
          helper="Tempo médio até resposta do agente"
          icon={Timer}
          tone="green"
        />
        <MetricCard
          title="Tempo até conclusão"
          value={loading ? '...' : formatDurationFromSeconds(cards.tempoMedioConclusaoSeg)}
          helper="Tempo médio das conversas concluídas"
          icon={Timer}
          tone="purple"
        />
        <MetricCard
          title="Taxa ask_missing_info"
          value={loading ? '...' : formatPercent(cards.taxaAskMissingInfo)}
          helper="Pedidos de informação complementar"
          icon={HelpCircle}
          tone="orange"
        />
        <MetricCard
          title="Erros registrados"
          value={loading ? '...' : formatNumber(cards.errosRegistrados)}
          helper="Indicador de erros em validação"
          icon={AlertTriangle}
          tone="red"
          badge={cards.errosEmValidacao ? 'em validação' : null}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard
          title="Evolução diária de conversas"
          description="Conversas iniciadas, concluídas, abandonadas e agendamentos"
          loading={loading}
          isEmpty={!hasEvolucaoDiaria}
          emptyMessage="Ainda não há conversas neste período."
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={graficos.evolucaoDiariaConversas} margin={{ top: 8, right: 18, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="label" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip content={<EvolucaoTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="iniciadas" name="Iniciadas" stroke={chartColors.blue} strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="concluidas" name="Concluídas" stroke={chartColors.green} strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="abandonadas" name="Abandonadas" stroke={chartColors.gray} strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="agendamentos" name="Agendamentos" stroke={chartColors.purple} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Funil de atendimento do agente"
          description="Cada conversa conta uma vez por etapa"
          loading={loading}
          isEmpty={!hasFunil}
          emptyMessage="Ainda não há conversas neste período."
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funilAtendimento} layout="vertical" margin={{ left: 20, right: 18 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis type="category" dataKey="etapa" width={165} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip content={<QuantidadeTooltip labelKey="etapa" />} />
                <Bar dataKey="quantidade" name="Conversas" fill={chartColors.blue} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard
          title="Intenções mais detectadas"
          loading={loading}
          isEmpty={!hasIntencoes}
          emptyMessage="Nenhuma intenção detectada no período."
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graficos.intencoesMaisDetectadas} layout="vertical" margin={{ left: 18, right: 18 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis type="category" dataKey="intent" width={140} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip content={<QuantidadeTooltip labelKey="intent" />} />
                <Bar dataKey="quantidade" fill={chartColors.purple} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Ações mais executadas"
          description="Inclui ask_missing_info"
          loading={loading}
          isEmpty={!hasAcoes}
          emptyMessage="Nenhuma ação registrada no período."
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graficos.acoesMaisExecutadas} layout="vertical" margin={{ left: 18, right: 18 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis type="category" dataKey="action" width={150} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip content={<QuantidadeTooltip labelKey="action" />} />
                <Bar dataKey="quantidade" fill={chartColors.orange} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard
          title="Distribuição de resultados"
          loading={loading}
          isEmpty={!hasResultados}
          emptyMessage="Nenhum resultado registrado no período."
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graficos.distribuicaoResultados} layout="vertical" margin={{ left: 18, right: 18 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis type="category" dataKey="resultado" width={165} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip content={<QuantidadeTooltip labelKey="resultado" />} />
                <Bar dataKey="quantidade" fill={chartColors.green} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Distribuição por tipo de mensagem"
          description="Mensagens recebidas do cliente"
          loading={loading}
          isEmpty={!hasTipoMensagem}
          emptyMessage="Nenhuma mensagem registrada no período."
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graficos.distribuicaoTipoMensagem} layout="vertical" margin={{ left: 18, right: 18 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis type="category" dataKey="tipoMensagem" width={165} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip content={<QuantidadeTooltip labelKey="tipoMensagem" />} />
                <Bar dataKey="quantidade" fill={chartColors.blue} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard
          title="Taxa de ask_missing_info por dia"
          loading={loading}
          isEmpty={!hasAskMissingPorDia}
          emptyMessage="Nenhuma ação registrada no período."
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={graficos.taxaAskMissingInfoPorDia} margin={{ top: 8, right: 18, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="label" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(value) => `${value}%`} />
                <Tooltip content={<AskMissingTooltip />} />
                <Line type="monotone" dataKey="taxa" name="Taxa" stroke={chartColors.orange} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Erros por tipo"
          badge="Indicador em validação"
          loading={loading}
          isEmpty={!hasErrosPorTipo}
          emptyMessage="Nenhum erro registrado no período."
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graficos.errosPorTipo} layout="vertical" margin={{ left: 18, right: 18 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis type="category" dataKey="erroTipo" width={165} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip content={<QuantidadeTooltip labelKey="erroTipo" />} />
                <Bar dataKey="quantidade" fill={chartColors.red} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <TableCard
        title="Conversas recentes"
        description="Últimas conversas registradas pelo agente"
        loading={loading}
        isEmpty={(tabelas.conversasRecentes || []).length === 0}
        emptyMessage="Ainda não há conversas neste período."
      >
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-600">Primeira mensagem</th>
              {showEmpresaConversasRecentes && (
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Empresa</th>
              )}
              <th className="px-3 py-2 text-left font-semibold text-gray-600">Telefone</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-600">Canal</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-600">Status</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-600">Resultado</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-600">Cliente</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-600">Agente</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-600">1ª resposta</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-600">Conclusão</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {(tabelas.conversasRecentes || []).map((conversa) => (
              <tr key={conversa.conversaId}>
                <td className="whitespace-nowrap px-3 py-3 text-gray-900">
                  {formatDateTime(conversa.primeiraMensagemAt)}
                </td>
                {showEmpresaConversasRecentes && (
                  <td className="px-3 py-3 text-gray-600">{truncateText(conversa.empresa, 28)}</td>
                )}
                <td className="whitespace-nowrap px-3 py-3 text-gray-600">{formatText(conversa.telefone)}</td>
                <td className="whitespace-nowrap px-3 py-3 text-gray-600">{formatText(conversa.canal)}</td>
                <td className="px-3 py-3"><StatusBadge value={conversa.status} /></td>
                <td className="px-3 py-3"><StatusBadge value={conversa.resultado} /></td>
                <td className="px-3 py-3 text-right text-gray-600">{formatNumber(conversa.qtdMsgCliente)}</td>
                <td className="px-3 py-3 text-right text-gray-600">{formatNumber(conversa.qtdMsgAgente)}</td>
                <td className="px-3 py-3 text-right text-gray-600">
                  {formatOptionalDuration(conversa.tempoPrimeiraRespostaSeg)}
                </td>
                <td className="px-3 py-3 text-right text-gray-600">
                  {formatOptionalDuration(conversa.tempoConclusaoSeg)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TableCard
          title="Conversas abandonadas"
          loading={loading}
          isEmpty={(tabelas.conversasAbandonadas || []).length === 0}
          emptyMessage="Nenhuma conversa abandonada registrada."
        >
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Primeira mensagem</th>
                {showEmpresaConversasAbandonadas && (
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Empresa</th>
                )}
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Telefone</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Resultado</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600">Mensagens</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600">Sem interação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {(tabelas.conversasAbandonadas || []).map((conversa) => (
                <tr key={conversa.conversaId}>
                  <td className="whitespace-nowrap px-3 py-3 text-gray-900">
                    {formatDateTime(conversa.primeiraMensagemAt)}
                  </td>
                  {showEmpresaConversasAbandonadas && (
                    <td className="px-3 py-3 text-gray-600">{truncateText(conversa.empresa, 26)}</td>
                  )}
                  <td className="whitespace-nowrap px-3 py-3 text-gray-600">{formatText(conversa.telefone)}</td>
                  <td className="px-3 py-3"><StatusBadge value={conversa.resultado} /></td>
                  <td className="px-3 py-3 text-right text-gray-600">
                    {formatNumber(Number(conversa.qtdMsgCliente || 0) + Number(conversa.qtdMsgAgente || 0))}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-600">
                    {formatOptionalDuration(conversa.tempoDesdeUltimaMensagemSeg)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>

        <TableCard
          title="Conversas com erro"
          badge="Indicador em validação"
          loading={loading}
          isEmpty={(tabelas.conversasComErro || []).length === 0}
          emptyMessage="Nenhuma conversa com erro registrada."
        >
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Erro</th>
                {showEmpresaConversasComErro && (
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Empresa</th>
                )}
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Contato</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Tipo</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Intent</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Action</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {(tabelas.conversasComErro || []).map((erro) => (
                <tr key={erro.eventoId}>
                  <td className="whitespace-nowrap px-3 py-3 text-gray-900">{formatDateTime(erro.createdAt)}</td>
                  {showEmpresaConversasComErro && (
                    <td className="px-3 py-3 text-gray-600">{truncateText(erro.empresa, 26)}</td>
                  )}
                  <td className="whitespace-nowrap px-3 py-3 text-gray-600">
                    {formatText(erro.telefone || truncateText(erro.sessionId, 18))}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-gray-600">{formatText(erro.erroTipo)}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-gray-600">{formatText(erro.intent)}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-gray-600">{formatText(erro.action)}</td>
                  <td className="px-3 py-3"><StatusBadge value={erro.statusConversa} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TableCard
          title="Principais intents/actions"
          loading={loading}
          isEmpty={(tabelas.principaisIntentsActions || []).length === 0}
          emptyMessage="Nenhuma intent/action registrada no período."
        >
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Intent</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Action</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600">Quantidade</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600">Percentual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {(tabelas.principaisIntentsActions || []).map((item) => (
                <tr key={`${item.intent}-${item.action}`}>
                  <td className="whitespace-nowrap px-3 py-3 text-gray-900">{formatText(item.intent)}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-gray-600">{formatText(item.action)}</td>
                  <td className="px-3 py-3 text-right text-gray-600">{formatNumber(item.quantidade)}</td>
                  <td className="px-3 py-3 text-right text-gray-600">{formatPercent(item.percentual)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>

        {isSuperAdmin && (
          <TableCard
            title="Empresas com maior volume"
            description="Uso consolidado do agente por empresa"
            loading={loading}
            isEmpty={(tabelas.empresasMaiorVolume || []).length === 0}
            emptyMessage="Ainda não há conversas por empresa neste período."
          >
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Empresa</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-600">Iniciadas</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-600">Concluídas</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-600">Abandonadas</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-600">Agendamentos</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-600">Conversão</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-600">Mensagens</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-600">1ª resposta</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-600">Conclusão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {(tabelas.empresasMaiorVolume || []).map((empresa) => (
                  <tr key={empresa.empresaId}>
                    <td className="px-3 py-3 text-gray-900">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span>{truncateText(empresa.empresa, 30)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-gray-600">{formatNumber(empresa.conversasIniciadas)}</td>
                    <td className="px-3 py-3 text-right text-gray-600">{formatNumber(empresa.conversasConcluidas)}</td>
                    <td className="px-3 py-3 text-right text-gray-600">{formatNumber(empresa.conversasAbandonadas)}</td>
                    <td className="px-3 py-3 text-right text-gray-600">{formatNumber(empresa.conversasAgendamento)}</td>
                    <td className="px-3 py-3 text-right text-gray-600">{formatPercent(empresa.taxaConversao)}</td>
                    <td className="px-3 py-3 text-right text-gray-600">{formatNumber(empresa.mensagensTotais)}</td>
                    <td className="px-3 py-3 text-right text-gray-600">
                      {formatOptionalDuration(empresa.tempoMedioPrimeiraRespostaSeg)}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-600">
                      {formatOptionalDuration(empresa.tempoMedioConclusaoSeg)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        )}
      </div>
    </div>
  )
}
