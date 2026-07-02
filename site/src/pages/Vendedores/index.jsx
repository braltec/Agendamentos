import { useState, useEffect } from 'react'
import { UsersRound, Plus, Edit, Trash2, TrendingUp, UserCheck, X } from 'lucide-react'
import { organizacoesService } from '../../services/organizacoes.service'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../contexts/AuthContext'
import VendedorModal from './VendedorModal'

const REVENDA_ID = '550e8400-e29b-41d4-a716-446655440020'

export default function Vendedores() {
  const { user } = useAuth()
  const [organizacao, setOrganizacao] = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [vendedorEditando, setVendedorEditando] = useState(null)
  const [filtro, setFiltro] = useState('')

  const isRevenda = user?.nivel_acesso_id === REVENDA_ID
  const isGestorRevenda = user?.is_gestor_revenda
  const orgId = user?.org_revenda_id

  useEffect(() => {
    if (isRevenda && isGestorRevenda && orgId) {
      carregarDados()
    }
  }, [isRevenda, isGestorRevenda, orgId])

  async function carregarDados() {
    try {
      setLoading(true)
      const [resOrg, resUsuarios, resEmpresas] = await Promise.all([
        organizacoesService.buscarPorId(orgId),
        organizacoesService.listarUsuarios(orgId),
        organizacoesService.listarEmpresas(orgId)
      ])
      setOrganizacao(resOrg.data)
      setUsuarios(resUsuarios.data)
      setEmpresas(resEmpresas.data)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      alert('Erro ao carregar dados da organização')
    } finally {
      setLoading(false)
    }
  }

  async function removerVendedor(vendedorId, vendedorNome) {
    if (!confirm(`Tem certeza que deseja remover ${vendedorNome}?`)) {
      return
    }

    try {
      await organizacoesService.removerVendedor(orgId, vendedorId)
      alert('Vendedor removido com sucesso!')
      carregarDados()
    } catch (error) {
      console.error('Erro ao remover vendedor:', error)
      alert(error.response?.data?.message || 'Erro ao remover vendedor')
    }
  }

  function abrirModalCriar() {
    setVendedorEditando(null)
    setModalAberto(true)
  }

  function abrirModalEditar(vendedor) {
    setVendedorEditando(vendedor)
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setVendedorEditando(null)
    carregarDados()
  }

  const usuariosFiltrados = usuarios.filter(usuario =>
    usuario.nome?.toLowerCase().includes(filtro.toLowerCase()) ||
    usuario.login?.toLowerCase().includes(filtro.toLowerCase()) ||
    usuario.email?.toLowerCase().includes(filtro.toLowerCase())
  )

  const gestores = usuariosFiltrados.filter(u => u.is_gestor_revenda)
  const vendedores = usuariosFiltrados.filter(u => !u.is_gestor_revenda)

  if (!isRevenda || !isGestorRevenda) {
    return (
      <div className="page-shell">
        <Card className="border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3 text-red-800">
            <X className="w-5 h-5" />
            <p>Acesso negado. Apenas Gestores de Revenda podem visualizar esta página.</p>
          </div>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Carregando dados...</div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      {/* Header */}
      <div className="page-heading">
        <div>
          <h1 className="page-title">Vendedores</h1>
          <p className="page-subtitle">
            {organizacao?.org_nome || 'Minha Organização'}
          </p>
        </div>
        <Button onClick={abrirModalCriar} className="w-full sm:w-auto">
          <Plus className="w-5 h-5" />
          Novo Vendedor
        </Button>
      </div>

      {/* Filtro */}
      <Card className="p-4">
        <Input
          placeholder="Buscar por nome, login ou email..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="w-full"
        />
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total de Usuários</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{usuarios.length}</p>
            </div>
            <UsersRound className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        <Card className="border-green-200 bg-green-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Gestores</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{gestores.length}</p>
            </div>
            <UserCheck className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        <Card className="border-purple-200 bg-purple-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Vendedores</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">{vendedores.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
        <Card className="border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Empresas Cadastradas</p>
              <p className="text-2xl font-bold text-orange-900 mt-1">{empresas.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Lista de Gestores */}
      {gestores.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Gestores</h2>
          <div className="grid grid-cols-1 gap-4">
            {gestores.map((gestor) => (
              <Card key={gestor.login_id} className="border-green-200 bg-green-50 p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="break-words text-lg font-semibold text-gray-900">
                        {gestor.nome}
                      </h3>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                        Gestor
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Login:</span> {gestor.login}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Email:</span> {gestor.email}
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      <span className="font-medium">Empresas cadastradas:</span>{' '}
                      {gestor.total_empresas_cadastradas || 0}
                    </p>
                  </div>
                  <div className="flex w-full gap-2 sm:ml-4 sm:w-auto">
                    <Button
                      size="sm"
                      onClick={() => abrirModalEditar(gestor)}
                      className="w-full sm:w-auto"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Vendedores */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Vendedores ({vendedores.length})
        </h2>
        {vendedores.length === 0 ? (
          <Card className="p-4">
            <div className="text-center py-12">
              <UsersRound className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                {filtro ? 'Nenhum vendedor encontrado' : 'Nenhum vendedor cadastrado'}
              </p>
              {!filtro && (
                <Button onClick={abrirModalCriar} className="mt-4">
                  Criar Primeiro Vendedor
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {vendedores.map((vendedor) => (
              <Card key={vendedor.login_id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-2 break-words text-lg font-semibold text-gray-900">
                      {vendedor.nome}
                    </h3>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Login:</span> {vendedor.login}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Email:</span> {vendedor.email}
                    </p>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                      <div className="bg-blue-50 px-3 py-2 rounded">
                        <p className="text-xs text-blue-600 font-medium">Empresas cadastradas</p>
                        <p className="text-lg font-bold text-blue-900">
                          {vendedor.total_empresas_cadastradas || 0}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500">
                        <p>Criado em</p>
                        <p className="font-medium text-gray-700">
                          {new Date(vendedor.created).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:w-auto lg:ml-4">
                    <Button
                      size="sm"
                      onClick={() => abrirModalEditar(vendedor)}
                      className="w-full sm:w-auto"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => removerVendedor(vendedor.login_id, vendedor.nome)}
                      className="w-full text-red-600 hover:text-red-700 sm:w-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remover
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalAberto && (
        <VendedorModal
          vendedor={vendedorEditando}
          orgId={orgId}
          onClose={fecharModal}
        />
      )}
    </div>
  )
}


