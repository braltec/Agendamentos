import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CalendarClock,
  DollarSign,
  Repeat,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from 'lucide-react'
import Card, { CardBody } from '../../components/ui/Card'
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

export default function ClientesDashboard() {
  const [loading, setLoading] = useState(true)
  const [clientesData, setClientesData] = useState(EMPTY_DATA)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true)
      setErrorMessage('')

      try {
        const response = await dashboardService.getClientes()
        setClientesData(response.data || EMPTY_DATA)
      } catch (error) {
        console.error('Erro ao carregar dashboard de clientes:', error)
        setErrorMessage('Não foi possível carregar os dados de clientes agora.')
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [])

  const cards = clientesData?.cards || EMPTY_DATA.cards

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
          title="Clientes novos no mês"
          value={loading ? '...' : formatNumber(cards.clientesNovosMes)}
          helper="Cadastrados no mês atual"
          icon={UserPlus}
          tone="blue"
        />

        <ClientesMetricCard
          title="Clientes recorrentes"
          value={loading ? '...' : formatNumber(cards.clientesRecorrentesMes)}
          helper="2 ou mais agendamentos no mês"
          icon={Repeat}
          tone="purple"
        />

        <ClientesMetricCard
          title="Clientes ativos 30 dias"
          value={loading ? '...' : formatNumber(cards.clientesAtivos30Dias)}
          helper="Com agendamento real recente"
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
          helper="Receita do mês / clientes atendidos"
          icon={DollarSign}
          tone="green"
        />

        <ClientesMetricCard
          title="Agendamentos médios"
          value={loading ? '...' : formatDecimal(cards.agendamentosMediosPorCliente)}
          helper="Agendamentos do mês por cliente"
          icon={CalendarClock}
          tone="orange"
        />

        <ClientesMetricCard
          title="Receita dos recorrentes"
          value={loading ? '...' : formatCurrency(cards.receitaClientesRecorrentes)}
          helper="Clientes com 2+ agendamentos no mês"
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
    </div>
  )
}
