import { useState } from 'react'
import { X } from 'lucide-react'
import { organizacoesService } from '../../services/organizacoes.service'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'

export default function NovoUsuarioModal({ organizacao, onClose }) {
  const [formData, setFormData] = useState({
    nome: '',
    login: '',
    email: '',
    senha: '',
    is_gestor_revenda: false
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  function validarForm() {
    const novosErros = {}

    if (!formData.nome?.trim()) {
      novosErros.nome = 'Nome é obrigatório'
    }

    if (!formData.login?.trim()) {
      novosErros.login = 'Login é obrigatório'
    }

    if (!formData.email?.trim()) {
      novosErros.email = 'Email é obrigatório'
    } else if (!formData.email.includes('@')) {
      novosErros.email = 'Email inválido'
    }

    if (!formData.senha?.trim()) {
      novosErros.senha = 'Senha é obrigatória'
    } else if (formData.senha.length < 6) {
      novosErros.senha = 'Senha deve ter no mínimo 6 caracteres'
    }

    setErrors(novosErros)
    return Object.keys(novosErros).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!validarForm()) {
      return
    }

    try {
      setLoading(true)
      
      await organizacoesService.criarVendedor(organizacao.org_revenda_id, formData)
      
      alert(`${formData.is_gestor_revenda ? 'Gestor' : 'Vendedor'} criado com sucesso!\n\nCredenciais:\nEmail: ${formData.email}\nSenha: ${formData.senha}`)
      
      onClose()
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      alert(error.response?.data?.message || 'Erro ao criar usuário')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <Card className="max-w-lg w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Novo Usuário
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {organizacao.org_nome}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo *
            </label>
            <Input
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Ex: João Silva"
              error={errors.nome}
            />
            {errors.nome && (
              <p className="text-sm text-red-600 mt-1">{errors.nome}</p>
            )}
          </div>

          {/* Login */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Login *
            </label>
            <Input
              name="login"
              value={formData.login}
              onChange={handleChange}
              placeholder="Ex: joao.silva"
              error={errors.login}
            />
            {errors.login && (
              <p className="text-sm text-red-600 mt-1">{errors.login}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="joao@exemplo.com"
              error={errors.email}
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha *
            </label>
            <Input
              name="senha"
              type="password"
              value={formData.senha}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              error={errors.senha}
            />
            {errors.senha && (
              <p className="text-sm text-red-600 mt-1">{errors.senha}</p>
            )}
          </div>

          {/* Tipo de Usuário */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_gestor_revenda"
                checked={formData.is_gestor_revenda}
                onChange={handleChange}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Tornar Gestor</p>
                <p className="text-sm text-gray-600">
                  Gestores podem criar outros vendedores e ver todas as empresas da organização
                </p>
              </div>
            </label>
          </div>

          {/* Informação importante */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              <strong>💡 Dica:</strong> Crie pelo menos um Gestor para que ele possa gerenciar os vendedores da organização.
            </p>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}



