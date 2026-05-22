import { useState } from 'react'
import { Clock, ArrowRight } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import wizardService from '../../services/wizard.service'

export default function Etapa1Configuracoes({ dados, atualizarDados, proximaEtapa, loading, setLoading }) {
  const [formData, setFormData] = useState({
    anteced_minutos: dados.configuracoes?.anteced_minutos || 60,
    interv_minutos: dados.configuracoes?.interv_minutos || 15,
    buffer_pre_minutos: dados.configuracoes?.buffer_pre_minutos || 5,
    buffer_pos_minutos: dados.configuracoes?.buffer_pos_minutos || 5
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await wizardService.saveConfiguracoes(formData)
      atualizarDados('configuracoes', response.data)
      proximaEtapa()
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      alert('Erro ao salvar configurações. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Clock className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-gray-900">Configurações de Agendamento</h2>
        </div>
        <p className="text-gray-600">
          Configure os tempos padrão para os agendamentos da sua empresa
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Antecedência Mínima (minutos)
            </label>
            <Input
              type="number"
              min="0"
              value={formData.anteced_minutos}
              onChange={(e) => setFormData({ ...formData, anteced_minutos: parseInt(e.target.value) })}
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Tempo mínimo de antecedência para agendar
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Intervalo entre Agendamentos (minutos)
            </label>
            <Input
              type="number"
              min="0"
              value={formData.interv_minutos}
              onChange={(e) => setFormData({ ...formData, interv_minutos: parseInt(e.target.value) })}
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Tempo de intervalo entre cada agendamento
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buffer Pré-Atendimento (minutos)
            </label>
            <Input
              type="number"
              min="0"
              value={formData.buffer_pre_minutos}
              onChange={(e) => setFormData({ ...formData, buffer_pre_minutos: parseInt(e.target.value) })}
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Tempo de preparação antes do atendimento
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buffer Pós-Atendimento (minutos)
            </label>
            <Input
              type="number"
              min="0"
              value={formData.buffer_pos_minutos}
              onChange={(e) => setFormData({ ...formData, buffer_pos_minutos: parseInt(e.target.value) })}
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Tempo de finalização após o atendimento
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t">
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








