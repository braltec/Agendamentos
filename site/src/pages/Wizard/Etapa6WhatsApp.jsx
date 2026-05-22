import { useState } from 'react'
import { MessageCircle, ArrowRight, ArrowLeft, Copy, Check } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import wizardService from '../../services/wizard.service'

export default function Etapa6WhatsApp({ dados, atualizarDados, proximaEtapa, etapaAnterior, loading, setLoading }) {
  const [formData, setFormData] = useState({
    instancia_id: dados.instancia?.instancia_id || '',
    nome: dados.instancia?.instancia_nome || 'WhatsApp Principal',
    observacao: dados.instancia?.instancia_observacao || ''
  })
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(formData.instancia_id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await wizardService.updateInstancia({
        instancia_id: formData.instancia_id,
        nome: formData.nome,
        observacao: formData.observacao
      })
      atualizarDados('instancia', response.data)
      proximaEtapa()
    } catch (error) {
      console.error('Erro ao atualizar instância:', error)
      alert('Erro ao atualizar instância WhatsApp. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <MessageCircle className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-gray-900">Configuração WhatsApp</h2>
        </div>
        <p className="text-gray-600">
          Configure a instância do WhatsApp Evolution API
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">
            📱 Como obter o UUID da Instância Evolution
          </h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Acesse o painel da Evolution API</li>
            <li>Crie uma nova instância do WhatsApp</li>
            <li>Copie o UUID gerado pela Evolution</li>
            <li>Cole o UUID no campo abaixo</li>
          </ol>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            UUID da Instância Evolution *
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={formData.instancia_id}
              onChange={(e) => setFormData({ ...formData, instancia_id: e.target.value })}
              placeholder="7d0f44c0-d72d-43b2-906e-a7097e5dd9ba"
              required
              pattern="[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}"
              title="UUID no formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="flex-1"
            />
            {formData.instancia_id && (
              <Button
                type="button"
                onClick={handleCopy}
                variant="outline"
                className="px-3"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            UUID fornecido pela Evolution API ao criar a instância
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome/Apelido da Instância * (máx. 30 caracteres)
          </label>
          <Input
            type="text"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            placeholder="WhatsApp Principal"
            maxLength={30}
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Nome amigável para identificar esta instância ({formData.nome.length}/30)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observações
          </label>
          <textarea
            value={formData.observacao}
            onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
            placeholder="Adicione observações sobre esta instância..."
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Informações adicionais (opcional)
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-900 mb-2">
            ⚠️ Importante
          </h4>
          <p className="text-sm text-yellow-800">
            O UUID da instância é usado para identificar de qual empresa vem cada mensagem do WhatsApp.
            Certifique-se de copiar o UUID correto da Evolution API.
          </p>
        </div>

        <div className="flex justify-between pt-6 border-t">
          <Button type="button" onClick={etapaAnterior} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : (
              <>
                Próxima Etapa
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
