import { useState } from 'react'
import { empresasService } from '../../services/empresas.service'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export default function NovaEmpresaModal({ onClose, onSuccess }) {
  const [etapa, setEtapa] = useState(1)
  const [loading, setLoading] = useState(false)
  const [credenciais, setCredenciais] = useState(null)
  
  const [formData, setFormData] = useState({
    // Dados da empresa
    empresa_nome: '',
    empresa_contato: '',
    observacoes: '',
    
    // Endereço
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    
    // Configurações
    anteced_minutos: 30,
    interv_minutos: 15,
    buffer_pre_minutos: 5,
    buffer_pos_minutos: 5,
    timezone: 'America/Sao_Paulo',
    
    // Usuário admin
    admin_nome: '',
    admin_email: '',
    admin_senha: '',
    
    // Opcionais
    criar_instancia: true,
    criar_contrato: true,
    contrato_valor: 59.90,
    contrato_nome: 'Básico'
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  async function buscarCEP() {
    if (formData.cep.length !== 8) return
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${formData.cep}/json/`)
      const data = await response.json()
      
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          logradouro: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          uf: data.uf
        }))
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    try {
      setLoading(true)
      const response = await empresasService.criar(formData)
      
      if (response.success) {
        setCredenciais(response.data.credenciais)
        setEtapa(4) // Ir para etapa de sucesso
      }
    } catch (error) {
      console.error('Erro ao criar empresa:', error)
      alert('Erro ao criar empresa: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  function renderEtapa1() {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Dados da Empresa</h3>
        
        <Input
          label="Nome da Empresa *"
          name="empresa_nome"
          value={formData.empresa_nome}
          onChange={handleChange}
          required
        />
        
        <Input
          label="Contato (WhatsApp) *"
          name="empresa_contato"
          value={formData.empresa_contato}
          onChange={handleChange}
          placeholder="(00) 00000-0000"
          required
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observações
          </label>
          <textarea
            name="observacoes"
            value={formData.observacoes}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    )
  }

  function renderEtapa2() {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Endereço</h3>
        
        <div className="flex gap-2">
          <Input
            label="CEP *"
            name="cep"
            value={formData.cep}
            onChange={handleChange}
            onBlur={buscarCEP}
            placeholder="00000-000"
            maxLength="8"
            required
            className="w-40"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={buscarCEP}
            className="mt-6"
          >
            Buscar
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Input
              label="Logradouro *"
              name="logradouro"
              value={formData.logradouro}
              onChange={handleChange}
              required
            />
          </div>
          <Input
            label="Número *"
            name="numero"
            value={formData.numero}
            onChange={handleChange}
            required
          />
        </div>
        
        <Input
          label="Complemento"
          name="complemento"
          value={formData.complemento}
          onChange={handleChange}
        />
        
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Bairro *"
            name="bairro"
            value={formData.bairro}
            onChange={handleChange}
            required
          />
          <Input
            label="Cidade *"
            name="cidade"
            value={formData.cidade}
            onChange={handleChange}
            required
          />
          <Input
            label="UF *"
            name="uf"
            value={formData.uf}
            onChange={handleChange}
            maxLength="2"
            required
          />
        </div>
      </div>
    )
  }

  function renderEtapa3() {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Usuário Administrador</h3>
        
        <Input
          label="Nome do Administrador *"
          name="admin_nome"
          value={formData.admin_nome}
          onChange={handleChange}
          required
        />
        
        <Input
          label="Email *"
          name="admin_email"
          type="email"
          value={formData.admin_email}
          onChange={handleChange}
          required
        />
        
        <Input
          label="Senha *"
          name="admin_senha"
          type="password"
          value={formData.admin_senha}
          onChange={handleChange}
          required
        />

        <div className="border-t pt-4 mt-6">
          <h4 className="font-medium mb-3">Configurações Iniciais</h4>
          
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="criar_instancia"
                checked={formData.criar_instancia}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm">Criar instância WhatsApp</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="criar_contrato"
                checked={formData.criar_contrato}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm">Criar contrato inicial</span>
            </label>
          </div>

          {formData.criar_contrato && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Input
                label="Nome do Plano"
                name="contrato_nome"
                value={formData.contrato_nome}
                onChange={handleChange}
              />
              <Input
                label="Valor Mensal (R$)"
                name="contrato_valor"
                type="number"
                step="0.01"
                value={formData.contrato_valor}
                onChange={handleChange}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderEtapa4() {
    return (
      <div className="space-y-4">
        <div className="text-center py-6">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-green-600 mb-2">
            Empresa Criada com Sucesso!
          </h3>
          <p className="text-gray-600">
            A empresa foi cadastrada e está pronta para uso.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">
            📧 Credenciais de Acesso
          </h4>
          <div className="space-y-2 text-sm">
            <p><strong>Email:</strong> {credenciais?.email}</p>
            <p><strong>Senha:</strong> {credenciais?.senha}</p>
          </div>
          <p className="text-xs text-blue-700 mt-3">
            ⚠️ Anote essas credenciais! A senha não será exibida novamente.
          </p>
        </div>

        <div className="flex justify-center">
          <Button onClick={onSuccess}>
            Concluir
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Nova Empresa</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Progress */}
          {etapa < 4 && (
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                {[1, 2, 3].map((num) => (
                  <div
                    key={num}
                    className={`flex-1 h-2 rounded ${
                      num <= etapa ? 'bg-blue-600' : 'bg-gray-200'
                    } ${num < 3 ? 'mr-2' : ''}`}
                  />
                ))}
              </div>
              <div className="text-sm text-gray-600 text-center">
                Etapa {etapa} de 3
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {etapa === 1 && renderEtapa1()}
            {etapa === 2 && renderEtapa2()}
            {etapa === 3 && renderEtapa3()}
            {etapa === 4 && renderEtapa4()}

            {/* Buttons */}
            {etapa < 4 && (
              <div className="flex justify-between mt-6 pt-6 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => etapa > 1 ? setEtapa(etapa - 1) : onClose()}
                >
                  {etapa > 1 ? 'Voltar' : 'Cancelar'}
                </Button>
                
                {etapa < 3 ? (
                  <Button
                    type="button"
                    onClick={() => setEtapa(etapa + 1)}
                  >
                    Próximo
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Criando...' : 'Criar Empresa'}
                  </Button>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}








