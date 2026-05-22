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
      <div className="p-6">
        <Card className="bg-red-50 border-red-200">
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendedores</h1>
          <p className="text-gray-600 mt-1">
            {organizacao?.org_nome || 'Minha Organização'}
          </p>
        </div>
        <Button onClick={abrirModalCriar} className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Novo Vendedor
        </Button>
      </div>

      {/* Filtro */}
      <Card>
        <Input
          placeholder="Buscar por nome, login ou email..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="w-full"
        />
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total de Usuários</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{usuarios.length}</p>
            </div>
            <UsersRound className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Gestores</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{gestores.length}</p>
            </div>
            <UserCheck className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Vendedores</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">{vendedores.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
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
              <Card key={gestor.login_id} className="bg-green-50 border-green-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
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
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => abrirModalEditar(gestor)}
                      className="flex items-center gap-2"
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
          <Card>
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
              <Card key={vendedor.login_id}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {vendedor.nome}
                    </h3>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Login:</span> {vendedor.login}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Email:</span> {vendedor.email}
                    </p>
                    <div className="mt-3 flex items-center gap-4">
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
                  <div className="flex gap-2 ml-4 flex-col">
                    <Button
                      size="sm"
                      onClick={() => abrirModalEditar(vendedor)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => removerVendedor(vendedor.login_id, vendedor.nome)}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700"
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



