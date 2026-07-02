import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, Users } from 'lucide-react'
import { empresasService } from '../../services/empresas.service'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import NovaEmpresaModal from './NovaEmpresaModal'
import { useAuth } from '../../contexts/AuthContext'

const SUPER_ADMIN_ID = '550e8400-e29b-41d4-a716-446655440012'
const REVENDA_ID = '550e8400-e29b-41d4-a716-446655440020'

export default function Empresas() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [filtro, setFiltro] = useState('')
  const [visualizacaoPorRevenda, setVisualizacaoPorRevenda] = useState(false)
  const [dadosRevenda, setDadosRevenda] = useState(null)
  
  const isSuperAdmin = user?.nivel_acesso_id === SUPER_ADMIN_ID
  const isGestorRevenda = user?.nivel_acesso_id === REVENDA_ID && user?.is_gestor_revenda

  useEffect(() => {
    if (visualizacaoPorRevenda && isSuperAdmin) {
      carregarEmpresasPorRevenda()
    } else {
      carregarEmpresas()
    }
  }, [visualizacaoPorRevenda])

  async function carregarEmpresas() {
    try {
      setLoading(true)
      const response = await empresasService.listar()
      setEmpresas(response.data)
      setDadosRevenda(null)
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
      alert('Erro ao carregar empresas')
    } finally {
      setLoading(false)
    }
  }

  async function carregarEmpresasPorRevenda() {
    try {
      setLoading(true)
      const response = await empresasService.listarPorRevenda()
      setDadosRevenda(response.data)
      setEmpresas([])
    } catch (error) {
      console.error('Erro ao carregar empresas por revenda:', error)
      alert('Erro ao carregar empresas por revenda')
    } finally {
      setLoading(false)
    }
  }

  async function alterarStatus(empresaId, novoStatus) {
    try {
      await empresasService.alterarStatus(empresaId, novoStatus)
      alert(`Empresa ${novoStatus === 'ativa' ? 'ativada' : 'desativada'} com sucesso!`)
      if (visualizacaoPorRevenda) {
        carregarEmpresasPorRevenda()
      } else {
        carregarEmpresas()
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      alert('Erro ao alterar status da empresa')
    }
  }

  const empresasFiltradas = empresas.filter(empresa =>
    empresa.empresa_nome.toLowerCase().includes(filtro.toLowerCase()) ||
    empresa.empresa_contato?.toLowerCase().includes(filtro.toLowerCase())
  )
  
  // Renderizar card de empresa (usado em ambas as visualizações)
  const renderEmpresaCard = (empresa) => (
    <Card key={empresa.empresa_id} className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="min-w-0 break-words text-lg font-semibold text-gray-900 sm:text-xl">
              {empresa.empresa_nome}
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              empresa.status === 'ativa' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {empresa.status === 'ativa' ? 'Ativa' : 'Inativa'}
            </span>
          </div>
          
          {/* Mostrar "Cadastrado por" apenas para Gestor Revenda */}
          {isGestorRevenda && (empresa.criador_nome || empresa.criador_login) && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <span className="font-medium">Cadastrado por:</span>{' '}
                {empresa.criador_nome || empresa.criador_login}
                {empresa.criador_login && empresa.criador_nome && (
                  <span className="text-blue-600"> ({empresa.criador_login})</span>
                )}
              </p>
            </div>
          )}
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Usuários:</span> {empresa.total_usuarios || 0}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Profissionais:</span> {empresa.total_profissionais || 0}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Agendamentos:</span> {empresa.total_agendamentos || 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">
                Criada em: {new Date(empresa.empresa_dt_criacao || empresa.data_cadastro).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto lg:ml-4">
          <Button
            size="sm"
            onClick={() => navigate(`/configuracoes/${empresa.empresa_id}`)}
            className="w-full sm:w-auto"
          >
            <Settings className="w-4 h-4" />
            Configurar
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => alterarStatus(
              empresa.empresa_id, 
              empresa.status === 'ativa' ? 'inativa' : 'ativa'
            )}
            className="w-full sm:w-auto"
          >
            {empresa.status === 'ativa' ? 'Desativar' : 'Ativar'}
          </Button>
        </div>
      </div>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Carregando empresas...</div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      {/* Header */}
      <div className="page-heading">
        <div>
          <h1 className="page-title">Gestão de Empresas</h1>
          <p className="page-subtitle">Cadastre e gerencie empresas clientes</p>
        </div>
        <Button onClick={() => setModalAberto(true)} className="w-full sm:w-auto">
          + Nova Empresa
        </Button>
      </div>

      {/* Toggle Visualização por Revenda (apenas Super Admin) */}
      {isSuperAdmin && (
        <Card className="border-blue-200 bg-blue-50 p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-3 sm:items-center">
              <Users className="w-5 h-5 text-blue-600" />
              <div className="min-w-0">
                <h3 className="font-semibold text-blue-900">Visualização por Revenda</h3>
                <p className="text-sm text-blue-700">Veja quais revendas cadastraram quais empresas</p>
              </div>
            </div>
            <Button
              variant={visualizacaoPorRevenda ? "primary" : "secondary"}
              size="sm"
              onClick={() => setVisualizacaoPorRevenda(!visualizacaoPorRevenda)}
              className="w-full sm:w-auto"
            >
              {visualizacaoPorRevenda ? 'Mostrar Lista Normal' : 'Agrupar por Revenda'}
            </Button>
          </div>
        </Card>
      )}

      {/* Filtros (apenas na visualização normal) */}
      {!visualizacaoPorRevenda && (
        <Card className="p-4">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Buscar por nome ou contato..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="min-h-11 w-full flex-1 rounded-lg border border-gray-300 px-4 py-2 text-base focus:border-transparent focus:ring-2 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </Card>
      )}

      {/* Estatísticas */}
      {visualizacaoPorRevenda && dadosRevenda ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
          <Card className="p-4 sm:p-5">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{dadosRevenda.estatisticas.total_revendas}</div>
              <div className="text-sm text-gray-600 mt-1">Total de Revendas</div>
            </div>
          </Card>
          <Card className="p-4 sm:p-5">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{dadosRevenda.estatisticas.total_empresas_com_revenda}</div>
              <div className="text-sm text-gray-600 mt-1">Empresas com Revenda</div>
            </div>
          </Card>
          <Card className="p-4 sm:p-5">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{dadosRevenda.estatisticas.total_empresas_sem_revenda}</div>
              <div className="text-sm text-gray-600 mt-1">Empresas sem Revenda</div>
            </div>
          </Card>
          <Card className="p-4 sm:p-5">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{dadosRevenda.estatisticas.total_empresas}</div>
              <div className="text-sm text-gray-600 mt-1">Total de Empresas</div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
          <Card className="p-4 sm:p-5">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{empresas.length}</div>
              <div className="text-sm text-gray-600 mt-1">Total de Empresas</div>
            </div>
          </Card>
          <Card className="p-4 sm:p-5">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {empresas.filter(e => e.status === 'ativa').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Empresas Ativas</div>
            </div>
          </Card>
          <Card className="p-4 sm:p-5">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {empresas.filter(e => e.status === 'inativa').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Empresas Inativas</div>
            </div>
          </Card>
          <Card className="p-4 sm:p-5">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {empresas.reduce((acc, e) => acc + parseInt(e.total_agendamentos || 0), 0)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Agendamentos</div>
            </div>
          </Card>
        </div>
      )}

      {/* Visualização por Revenda */}
      {visualizacaoPorRevenda && dadosRevenda ? (
        <div className="space-y-6">
          {/* Revendas e suas empresas */}
          {dadosRevenda.revendas.map((revenda) => (
            <Card key={revenda.revenda_id} className="bg-gradient-to-r from-blue-50 to-white p-4 sm:p-5">
              <div className="mb-4 pb-4 border-b border-blue-200">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <Users className="w-6 h-6 text-blue-600" />
                  <div className="min-w-0 flex-1">
                    <h2 className="break-words text-xl font-bold text-blue-900 sm:text-2xl">{revenda.revenda_nome}</h2>
                    <p className="break-words text-sm text-blue-700">
                      @{revenda.revenda_login} • {revenda.revenda_email}
                    </p>
                  </div>
                  <span className="w-fit px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium md:ml-auto">
                    {revenda.empresas.length} {revenda.empresas.length === 1 ? 'empresa' : 'empresas'}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                {revenda.empresas.map((empresa) => renderEmpresaCard(empresa))}
              </div>
            </Card>
          ))}

          {/* Empresas sem revenda */}
          {dadosRevenda.empresas_sem_revenda.length > 0 && (
            <Card className="bg-gradient-to-r from-gray-50 to-white p-4 sm:p-5">
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <Users className="w-6 h-6 text-gray-600" />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Empresas sem Revenda</h2>
                    <p className="text-sm text-gray-700">
                      Empresas criadas diretamente ou por outros perfis
                    </p>
                  </div>
                  <span className="w-fit px-4 py-2 bg-gray-600 text-white rounded-full text-sm font-medium md:ml-auto">
                    {dadosRevenda.empresas_sem_revenda.length} {dadosRevenda.empresas_sem_revenda.length === 1 ? 'empresa' : 'empresas'}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                {dadosRevenda.empresas_sem_revenda.map((empresa) => renderEmpresaCard(empresa))}
              </div>
            </Card>
          )}
        </div>
      ) : (
        /* Lista Normal de Empresas */
        <>
          <div className="grid grid-cols-1 gap-6">
            {empresasFiltradas.map((empresa) => renderEmpresaCard(empresa))}
          </div>

          {empresasFiltradas.length === 0 && (
            <Card className="p-4 sm:p-5">
              <div className="text-center py-12">
                <p className="text-gray-500">Nenhuma empresa encontrada</p>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Modal Nova Empresa */}
      {modalAberto && (
        <NovaEmpresaModal
          onClose={() => setModalAberto(false)}
          onSuccess={() => {
            setModalAberto(false)
            carregarEmpresas()
          }}
        />
      )}
    </div>
  )
}







