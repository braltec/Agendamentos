import { useState } from 'react'
import { Briefcase, ArrowRight, ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import wizardService from '../../services/wizard.service'

export default function Etapa4Servicos({ dados, atualizarDados, proximaEtapa, etapaAnterior, loading, setLoading }) {
  const [servicos, setServicos] = useState(
    dados.servicos.length > 0
      ? dados.servicos
      : [{ nome: '', duracao_minutos: 30, valor: '', descricao: '' }]
  )

  const adicionarServico = () => {
    setServicos([...servicos, { nome: '', duracao_minutos: 30, valor: '', descricao: '' }])
  }

  const removerServico = (index) => {
    if (servicos.length > 1) {
      setServicos(servicos.filter((_, i) => i !== index))
    }
  }

  const handleChange = (index, campo, valor) => {
    const novosServicos = [...servicos]
    novosServicos[index][campo] = valor
    setServicos(novosServicos)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const servicosCriados = []
      
      for (const servico of servicos) {
        const response = await wizardService.createServico(servico)
        servicosCriados.push({
          ...response.data,
          ...servico
        })
      }
      
      atualizarDados('servicos', servicosCriados)
      proximaEtapa()
    } catch (error) {
      console.error('Erro ao criar serviços:', error)
      alert('Erro ao criar serviços. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Briefcase className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-gray-900">Cadastro de Serviços</h2>
        </div>
        <p className="text-gray-600">
          Adicione os serviços oferecidos pela sua empresa
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {servicos.map((servico, index) => (
          <div key={index} className="p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">
                Serviço {index + 1}
              </h3>
              {servicos.length > 1 && (
                <button
                  type="button"
                  onClick={() => removerServico(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Serviço *
                </label>
                <Input
                  type="text"
                  value={servico.nome}
                  onChange={(e) => handleChange(index, 'nome', e.target.value)}
                  placeholder="Consulta Dermatológica"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duração (minutos) *
                </label>
                <Input
                  type="number"
                  min="1"
                  value={servico.duracao_minutos}
                  onChange={(e) => handleChange(index, 'duracao_minutos', parseInt(e.target.value))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor (R$) *
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={servico.valor}
                  onChange={(e) => handleChange(index, 'valor', parseFloat(e.target.value))}
                  placeholder="150.00"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={servico.descricao}
                  onChange={(e) => handleChange(index, 'descricao', e.target.value)}
                  placeholder="Descrição do serviço..."
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        ))}

        <Button
          type="button"
          onClick={adicionarServico}
          variant="outline"
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Outro Serviço
        </Button>

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








