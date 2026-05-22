import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { organizacoesService } from '../../services/organizacoes.service'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'

export default function OrganizacaoModal({ organizacao, onClose }) {
  const [formData, setFormData] = useState({
    org_nome: '',
    org_razao_social: '',
    org_cnpj: '',
    org_contato: '',
    org_email: '',
    org_endereco: '',
    org_status: 'ativa',
    org_observacoes: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (organizacao) {
      setFormData({
        org_nome: organizacao.org_nome || '',
        org_razao_social: organizacao.org_razao_social || '',
        org_cnpj: organizacao.org_cnpj || '',
        org_contato: organizacao.org_contato || '',
        org_email: organizacao.org_email || '',
        org_endereco: organizacao.org_endereco || '',
        org_status: organizacao.org_status || 'ativa',
        org_observacoes: organizacao.org_observacoes || ''
      })
    }
  }, [organizacao])

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  function validarForm() {
    const novosErros = {}

    if (!formData.org_nome?.trim()) {
      novosErros.org_nome = 'Nome é obrigatório'
    }

    if (formData.org_email && !formData.org_email.includes('@')) {
      novosErros.org_email = 'Email inválido'
    }

    if (formData.org_cnpj && formData.org_cnpj.replace(/\D/g, '').length !== 14) {
      novosErros.org_cnpj = 'CNPJ deve ter 14 dígitos'
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

      if (organizacao) {
        await organizacoesService.atualizar(organizacao.org_revenda_id, formData)
        alert('Organização atualizada com sucesso!')
      } else {
        await organizacoesService.criar(formData)
        alert('Organização criada com sucesso!')
      }

      onClose()
    } catch (error) {
      console.error('Erro ao salvar organização:', error)
      alert(error.response?.data?.message || 'Erro ao salvar organização')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {organizacao ? 'Editar Organização' : 'Nova Organização'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome da Organização */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Organização *
            </label>
            <Input
              name="org_nome"
              value={formData.org_nome}
              onChange={handleChange}
              placeholder="Ex: Revenda Premium Ltda"
              error={errors.org_nome}
            />
            {errors.org_nome && (
              <p className="text-sm text-red-600 mt-1">{errors.org_nome}</p>
            )}
          </div>

          {/* Razão Social */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Razão Social
            </label>
            <Input
              name="org_razao_social"
              value={formData.org_razao_social}
              onChange={handleChange}
              placeholder="Razão social da empresa"
            />
          </div>

          {/* CNPJ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CNPJ
            </label>
            <Input
              name="org_cnpj"
              value={formData.org_cnpj}
              onChange={handleChange}
              placeholder="00.000.000/0000-00"
              error={errors.org_cnpj}
            />
            {errors.org_cnpj && (
              <p className="text-sm text-red-600 mt-1">{errors.org_cnpj}</p>
            )}
          </div>

          {/* Contato e Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <Input
                name="org_contato"
                value={formData.org_contato}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                name="org_email"
                type="email"
                value={formData.org_email}
                onChange={handleChange}
                placeholder="contato@exemplo.com"
                error={errors.org_email}
              />
              {errors.org_email && (
                <p className="text-sm text-red-600 mt-1">{errors.org_email}</p>
              )}
            </div>
          </div>

          {/* Endereço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Endereço
            </label>
            <Input
              name="org_endereco"
              value={formData.org_endereco}
              onChange={handleChange}
              placeholder="Endereço completo"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="org_status"
              value={formData.org_status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="ativa">Ativa</option>
              <option value="inativa">Inativa</option>
              <option value="suspensa">Suspensa</option>
            </select>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              name="org_observacoes"
              value={formData.org_observacoes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Observações adicionais..."
            />
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
              {loading ? 'Salvando...' : organizacao ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}



