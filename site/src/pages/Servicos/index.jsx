import Card, { CardBody, CardHeader } from '../../components/ui/Card'

export default function ServicosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Servicos</h1>
        <p className="text-gray-600 mt-1">Gerencie servicos</p>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Lista de Servicos</h3>
        </CardHeader>
        <CardBody>
          <p className="text-gray-600">Em desenvolvimento...</p>
        </CardBody>
      </Card>
    </div>
  )
}
