import Card, { CardBody, CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Plus } from 'lucide-react'

export default function AgendamentosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agendamentos</h1>
          <p className="text-gray-600 mt-1">Gerencie todos os agendamentos</p>
        </div>
        <Button>
          <Plus className="w-5 h-5" />
          Novo Agendamento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Lista de Agendamentos</h3>
        </CardHeader>
        <CardBody>
          <p className="text-gray-600">Em desenvolvimento...</p>
        </CardBody>
      </Card>
    </div>
  )
}








