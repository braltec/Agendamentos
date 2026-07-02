import Card, { CardBody, CardHeader } from '../../components/ui/Card'

export default function ProfissionaisPage() {
  return (
    <div className="page-shell">
      <div>
        <h1 className="page-title">Profissionais</h1>
        <p className="page-subtitle">Gerencie profissionais</p>
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
