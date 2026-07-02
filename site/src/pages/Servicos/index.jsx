import Card, { CardBody, CardHeader } from '../../components/ui/Card'

export default function ServicosPage() {
  return (
    <div className="page-shell">
      <div>
        <h1 className="page-title">Servicos</h1>
        <p className="page-subtitle">Gerencie servicos</p>
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
