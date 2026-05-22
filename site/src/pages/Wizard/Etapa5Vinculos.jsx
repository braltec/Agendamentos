import { useState } from 'react'
import { Link2, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import wizardService from '../../services/wizard.service'

export default function Etapa5Vinculos({ dados, atualizarDados, proximaEtapa, etapaAnterior, loading, setLoading }) {
  // Criar matriz de vínculos: profissional x serviço
  const [vinculos, setVinculos] = useState(() => {
    const vinculosIniciais = {}
    dados.profissionais.forEach(prof => {
      vinculosIniciais[prof.profissional_id] = {}
      dados.servicos.forEach(serv => {
        vinculosIniciais[prof.profissional_id][serv.servicos_id] = {
          ativo: false,
          valor_personalizado: serv.valor,
          duracao_personalizada: serv.duracao_minutos
        }
      })
    })
    return vinculosIniciais
  })

  const toggleVinculo = (profId, servId) => {
    setVinculos(prev => ({
      ...prev,
      [profId]: {
        ...prev[profId],
        [servId]: {
          ...prev[profId][servId],
          ativo: !prev[profId][servId].ativo
        }
      }
    }))
  }

  const handlePersonalizacaoChange = (profId, servId, campo, valor) => {
    setVinculos(prev => ({
      ...prev,
      [profId]: {
        ...prev[profId],
        [servId]: {
          ...prev[profId][servId],
          [campo]: valor
        }
      }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const vinculosCriados = []
      
      // Para cada profissional
      for (const profissional of dados.profissionais) {
        const profId = profissional.profissional_id
        
        // Para cada serviço
        for (const servico of dados.servicos) {
          const servId = servico.servicos_id
          const vinculo = vinculos[profId][servId]
          
          // Se o vínculo está ativo, criar
          if (vinculo.ativo) {
            await wizardService.vincularServico(profId, servId, {
              valor_personalizado: vinculo.valor_personalizado,
              duracao_personalizada: vinculo.duracao_personalizada
            })
            
            vinculosCriados.push({
              profissional_id: profId,
              servico_id: servId,
              ...vinculo
            })
          }
        }
      }
      
      atualizarDados('vinculos', vinculosCriados)
      proximaEtapa()
    } catch (error) {
      console.error('Erro ao vincular serviços:', error)
      alert('Erro ao vincular serviços. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Link2 className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-gray-900">Vincular Serviços aos Profissionais</h2>
        </div>
        <p className="text-gray-600">
          Defina quais serviços cada profissional pode realizar e personalize valores/duração
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {dados.profissionais.map(profissional => (
          <div key={profissional.profissional_id} className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold text-lg text-gray-900 mb-4">
              {profissional.profissional_nome}
              {profissional.especialidade && (
                <span className="text-sm text-gray-600 ml-2">
                  ({profissional.especialidade})
                </span>
              )}
            </h3>

            <div className="space-y-3">
              {dados.servicos.map(servico => {
                const vinculo = vinculos[profissional.profissional_id][servico.servicos_id]
                
                return (
                  <div
                    key={servico.servicos_id}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      vinculo.ativo ? 'bg-white border-blue-300' : 'bg-gray-100 border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={vinculo.ativo}
                        onChange={() => toggleVinculo(profissional.profissional_id, servico.servicos_id)}
                        className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-2">
                          {servico.servicos_nome}
                        </div>
                        
                        {vinculo.ativo && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Duração (min)
                              </label>
                              <Input
                                type="number"
                                min="1"
                                value={vinculo.duracao_personalizada}
                                onChange={(e) => handlePersonalizacaoChange(
                                  profissional.profissional_id,
                                  servico.servicos_id,
                                  'duracao_personalizada',
                                  parseInt(e.target.value)
                                )}
                                className="text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Valor (R$)
                              </label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={vinculo.valor_personalizado}
                                onChange={(e) => handlePersonalizacaoChange(
                                  profissional.profissional_id,
                                  servico.servicos_id,
                                  'valor_personalizado',
                                  parseFloat(e.target.value)
                                )}
                                className="text-sm"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

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








