import Card, { CardBody, CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Plus } from 'lucide-react'

export default function AgendamentosPage() {
  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <h1 className="page-title">Agendamentos</h1>
          <p className="page-subtitle">Gerencie todos os agendamentos</p>
        </div>
        <Button className="w-full sm:w-auto">
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







