import { useState, useEffect } from 'react'
import { X, Users, Briefcase, TrendingUp, UserCheck, Plus } from 'lucide-react'
import { organizacoesService } from '../../services/organizacoes.service'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import NovoUsuarioModal from './NovoUsuarioModal'

export default function DetalhesOrganizacaoModal({ organizacao, onClose }) {
  const [usuarios, setUsuarios] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState('usuarios') // 'usuarios' ou 'empresas'
  const [modalUsuarioAberto, setModalUsuarioAberto] = useState(false)

  useEffect(() => {
    carregarDados()
  }, [organizacao])

  async function carregarDados() {
    try {
      setLoading(true)
      const [resUsuarios, resEmpresas] = await Promise.all([
        organizacoesService.listarUsuarios(organizacao.org_revenda_id),
        organizacoesService.listarEmpresas(organizacao.org_revenda_id)
      ])
      setUsuarios(resUsuarios.data)
      setEmpresas(resEmpresas.data)
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error)
      alert('Erro ao carregar detalhes da organização')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {organizacao.org_nome}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Detalhes da organização
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-medium text-blue-600">Usuários</p>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {organizacao.total_usuarios || 0}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-600">Gestores</p>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {organizacao.total_gestores || 0}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <p className="text-sm font-medium text-purple-600">Vendedores</p>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {organizacao.total_vendedores || 0}
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-5 h-5 text-orange-600" />
              <p className="text-sm font-medium text-orange-600">Empresas</p>
            </div>
            <p className="text-2xl font-bold text-orange-900">
              {organizacao.total_empresas || 0}
            </p>
          </div>
        </div>

        {/* Abas */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <button
                onClick={() => setAbaAtiva('usuarios')}
                className={`pb-3 px-1 font-medium transition-colors ${
                  abaAtiva === 'usuarios'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Usuários ({usuarios.length})
              </button>
              <button
                onClick={() => setAbaAtiva('empresas')}
                className={`pb-3 px-1 font-medium transition-colors ${
                  abaAtiva === 'empresas'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Empresas ({empresas.length})
              </button>
            </div>
            {abaAtiva === 'usuarios' && (
              <Button
                size="sm"
                onClick={() => setModalUsuarioAberto(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Novo Usuário
              </Button>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando...</p>
          </div>
        ) : (
          <>
            {/* Aba Usuários */}
            {abaAtiva === 'usuarios' && (
              <div className="space-y-3">
                {usuarios.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Nenhum usuário cadastrado
                  </p>
                ) : (
                  usuarios.map((usuario) => (
                    <div
                      key={usuario.login_id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {usuario.nome}
                            </h4>
                            {usuario.is_gestor_revenda && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                                Gestor
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Login:</span> {usuario.login}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Email:</span> {usuario.email}
                          </p>
                          <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Empresas cadastradas:</span>{' '}
                            {usuario.total_empresas_cadastradas || 0}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            Criado em
                          </p>
                          <p className="text-sm text-gray-700">
                            {new Date(usuario.created).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Aba Empresas */}
            {abaAtiva === 'empresas' && (
              <div className="space-y-3">
                {empresas.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Nenhuma empresa cadastrada
                  </p>
                ) : (
                  empresas.map((empresa) => (
                    <div
                      key={empresa.empresa_id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {empresa.empresa_nome}
                            </h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              empresa.status === 'ativa'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {empresa.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Cadastrado por:</span>{' '}
                            {empresa.criador_nome} ({empresa.criador_login})
                            {empresa.criador_is_gestor && (
                              <span className="ml-2 text-blue-600 text-xs">• Gestor</span>
                            )}
                          </p>
                          <div className="flex gap-4 mt-2 text-sm text-gray-600">
                            <span>
                              <span className="font-medium">Usuários:</span> {empresa.total_usuarios || 0}
                            </span>
                            <span>
                              <span className="font-medium">Profissionais:</span> {empresa.total_profissionais || 0}
                            </span>
                            <span>
                              <span className="font-medium">Agendamentos:</span> {empresa.total_agendamentos || 0}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            Cadastrado em
                          </p>
                          <p className="text-sm text-gray-700">
                            {new Date(empresa.data_cadastro || empresa.empresa_dt_criacao).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {/* Botão Fechar */}
        <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
          <Button onClick={onClose}>
            Fechar
          </Button>
        </div>
      </Card>

      {/* Modal para criar novo usuário */}
      {modalUsuarioAberto && (
        <NovoUsuarioModal
          organizacao={organizacao}
          onClose={() => {
            setModalUsuarioAberto(false)
            carregarDados() // Recarregar lista de usuários
          }}
        />
      )}
    </div>
  )
}

