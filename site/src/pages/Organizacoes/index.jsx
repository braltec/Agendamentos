import { useState, useEffect } from 'react'
import { Building2, Plus, Edit, Eye, Users, Briefcase, TrendingUp, X } from 'lucide-react'
import { organizacoesService } from '../../services/organizacoes.service'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../contexts/AuthContext'
import OrganizacaoModal from './OrganizacaoModal'
import DetalhesOrganizacaoModal from './DetalhesOrganizacaoModal'

const SUPER_ADMIN_ID = '550e8400-e29b-41d4-a716-446655440012'

export default function Organizacoes() {
  const { user } = useAuth()
  const [organizacoes, setOrganizacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false)
  const [organizacaoEditando, setOrganizacaoEditando] = useState(null)
  const [organizacaoDetalhes, setOrganizacaoDetalhes] = useState(null)
  const [filtro, setFiltro] = useState('')

  const isSuperAdmin = user?.nivel_acesso_id === SUPER_ADMIN_ID

  useEffect(() => {
    if (isSuperAdmin) {
      carregarOrganizacoes()
    }
  }, [isSuperAdmin])

  async function carregarOrganizacoes() {
    try {
      setLoading(true)
      const response = await organizacoesService.listar()
      setOrganizacoes(response.data)
    } catch (error) {
      console.error('Erro ao carregar organizações:', error)
      alert('Erro ao carregar organizações')
    } finally {
      setLoading(false)
    }
  }

  async function alterarStatus(orgId, novoStatus) {
    try {
      await organizacoesService.alterarStatus(orgId, novoStatus)
      alert(`Organização ${novoStatus === 'ativa' ? 'ativada' : 'desativada'} com sucesso!`)
      carregarOrganizacoes()
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      alert('Erro ao alterar status da organização')
    }
  }

  function abrirModalCriar() {
    setOrganizacaoEditando(null)
    setModalAberto(true)
  }

  function abrirModalEditar(org) {
    setOrganizacaoEditando(org)
    setModalAberto(true)
  }

  function abrirModalDetalhes(org) {
    setOrganizacaoDetalhes(org)
    setModalDetalhesAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setOrganizacaoEditando(null)
    carregarOrganizacoes()
  }

  function fecharModalDetalhes() {
    setModalDetalhesAberto(false)
    setOrganizacaoDetalhes(null)
  }

  const organizacoesFiltradas = organizacoes.filter(org =>
    org.org_nome?.toLowerCase().includes(filtro.toLowerCase()) ||
    org.org_razao_social?.toLowerCase().includes(filtro.toLowerCase()) ||
    org.org_cnpj?.toLowerCase().includes(filtro.toLowerCase())
  )

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <Card className="bg-red-50 border-red-200">
          <div className="flex items-center gap-3 text-red-800">
            <X className="w-5 h-5" />
            <p>Acesso negado. Apenas Super Admin pode visualizar organizações.</p>
          </div>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Carregando organizações...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizações de Revenda</h1>
          <p className="text-gray-600 mt-1">Gerencie organizações e seus vendedores</p>
        </div>
        <Button onClick={abrirModalCriar} className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nova Organização
        </Button>
      </div>

      {/* Filtro */}
      <Card>
        <Input
          placeholder="Buscar por nome, razão social ou CNPJ..."
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
              <p className="text-sm text-blue-600 font-medium">Total de Organizações</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{organizacoes.length}</p>
            </div>
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Organizações Ativas</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {organizacoes.filter(o => o.org_status === 'ativa').length}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Total de Usuários</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                {organizacoes.reduce((acc, o) => acc + (parseInt(o.total_usuarios) || 0), 0)}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Total de Empresas</p>
              <p className="text-2xl font-bold text-orange-900 mt-1">
                {organizacoes.reduce((acc, o) => acc + (parseInt(o.total_empresas) || 0), 0)}
              </p>
            </div>
            <Briefcase className="w-8 h-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Lista de Organizações */}
      {organizacoesFiltradas.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              {filtro ? 'Nenhuma organização encontrada' : 'Nenhuma organização cadastrada'}
            </p>
            {!filtro && (
              <Button onClick={abrirModalCriar} className="mt-4">
                Criar Primeira Organização
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {organizacoesFiltradas.map((org) => (
            <Card key={org.org_revenda_id}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {org.org_nome}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      org.org_status === 'ativa' 
                        ? 'bg-green-100 text-green-800' 
                        : org.org_status === 'inativa'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {org.org_status === 'ativa' ? 'Ativa' : org.org_status === 'inativa' ? 'Inativa' : 'Suspensa'}
                    </span>
                  </div>

                  {org.org_razao_social && (
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Razão Social:</span> {org.org_razao_social}
                    </p>
                  )}

                  {org.org_cnpj && (
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">CNPJ:</span> {org.org_cnpj}
                    </p>
                  )}

                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Usuários</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {org.total_usuarios || 0}
                      </p>
                      <p className="text-xs text-gray-500">
                        {org.total_gestores || 0} gestores, {org.total_vendedores || 0} vendedores
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Empresas</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {org.total_empresas || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Criada em</p>
                      <p className="text-sm text-gray-700">
                        {new Date(org.org_criado_em).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Atualizada em</p>
                      <p className="text-sm text-gray-700">
                        {new Date(org.org_atualizado_em).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4 flex-col">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => abrirModalDetalhes(org)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Detalhes
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => abrirModalEditar(org)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => alterarStatus(
                      org.org_revenda_id,
                      org.org_status === 'ativa' ? 'inativa' : 'ativa'
                    )}
                  >
                    {org.org_status === 'ativa' ? 'Desativar' : 'Ativar'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modais */}
      {modalAberto && (
        <OrganizacaoModal
          organizacao={organizacaoEditando}
          onClose={fecharModal}
        />
      )}

      {modalDetalhesAberto && organizacaoDetalhes && (
        <DetalhesOrganizacaoModal
          organizacao={organizacaoDetalhes}
          onClose={fecharModalDetalhes}
        />
      )}
    </div>
  )
}



