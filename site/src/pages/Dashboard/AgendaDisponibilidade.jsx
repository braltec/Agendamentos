import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Percent,
  Timer,
  Users,
  XCircle,
} from 'lucide-react'
import Card, { CardBody } from '../../components/ui/Card'
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
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0 && minutes > 0) return `${hours}h${String(minutes).padStart(2, '0')}`
  if (hours > 0) return `${hours}h`
  return `${minutes}min`
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
    </div>
  )
}
