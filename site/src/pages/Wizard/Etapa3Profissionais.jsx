import { useState } from 'react'
import { Users, ArrowRight, ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import wizardService from '../../services/wizard.service'

export default function Etapa3Profissionais({ dados, atualizarDados, proximaEtapa, etapaAnterior, loading, setLoading }) {
  const [profissionais, setProfissionais] = useState(
    dados.profissionais.length > 0
      ? dados.profissionais
      : [{ nome: '', contato: '', especialidade: '' }]
  )

  const adicionarProfissional = () => {
    setProfissionais([...profissionais, { nome: '', contato: '', especialidade: '' }])
  }

  const removerProfissional = (index) => {
    if (profissionais.length > 1) {
      setProfissionais(profissionais.filter((_, i) => i !== index))
    }
  }

  const handleChange = (index, campo, valor) => {
    const novosProfissionais = [...profissionais]
    novosProfissionais[index][campo] = valor
    setProfissionais(novosProfissionais)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const profissionaisCriados = []
      
      for (const prof of profissionais) {
        const response = await wizardService.createProfissional(prof)
        const profissionalId = response.data.profissional_id
        
        // Vincular horário ao profissional
        await wizardService.vincularHorario(profissionalId, dados.horarioFId)
        
        profissionaisCriados.push({
          ...response.data,
          ...prof
        })
      }
      
      atualizarDados('profissionais', profissionaisCriados)
      proximaEtapa()
    } catch (error) {
      console.error('Erro ao criar profissionais:', error)
      alert('Erro ao criar profissionais. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Cadastro de Profissionais</h2>
        </div>
        <p className="text-gray-600">
          Adicione os profissionais que farão atendimentos
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {profissionais.map((prof, index) => (
          <div key={index} className="p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="font-semibold text-gray-900">
                Profissional {index + 1}
              </h3>
              {profissionais.length > 1 && (
                <button
                  type="button"
                  onClick={() => removerProfissional(index)}
                  className="icon-action text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome *
                </label>
                <Input
                  type="text"
                  value={prof.nome}
                  onChange={(e) => handleChange(index, 'nome', e.target.value)}
                  placeholder="Dr. João Silva"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contato *
                </label>
                <Input
                  type="text"
                  value={prof.contato}
                  onChange={(e) => handleChange(index, 'contato', e.target.value)}
                  placeholder="(11) 98765-4321"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Especialidade
                </label>
                <Input
                  type="text"
                  value={prof.especialidade}
                  onChange={(e) => handleChange(index, 'especialidade', e.target.value)}
                  placeholder="Dermatologia"
                />
              </div>
            </div>
          </div>
        ))}

        <Button
          type="button"
          onClick={adicionarProfissional}
          variant="outline"
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Outro Profissional
        </Button>

        <div className="flex flex-col-reverse gap-3 pt-6 border-t sm:flex-row sm:justify-between">
          <Button type="button" onClick={etapaAnterior} variant="outline" className="w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
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







