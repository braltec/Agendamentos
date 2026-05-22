import Card, { CardBody, CardHeader } from '../../components/ui/Card'

export default function ProfissionaisPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profissionais</h1>
        <p className="text-gray-600 mt-1">Gerencie profissionais</p>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Lista de Profissionais</h3>
        </CardHeader>
        <CardBody>
          <p className="text-gray-600">Em desenvolvimento...</p>
        </CardBody>
      </Card>
    </div>
  )
}
