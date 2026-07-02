import { useState } from 'react'
import { Calendar, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import wizardService from '../../services/wizard.service'

const DIAS_SEMANA = [
  { numero: 1, nome: 'Segunda-feira' },
  { numero: 2, nome: 'Terça-feira' },
  { numero: 3, nome: 'Quarta-feira' },
  { numero: 4, nome: 'Quinta-feira' },
  { numero: 5, nome: 'Sexta-feira' },
  { numero: 6, nome: 'Sábado' },
  { numero: 0, nome: 'Domingo' }
]

export default function Etapa2Horarios({ dados, atualizarDados, proximaEtapa, etapaAnterior, loading, setLoading }) {
  const [horarios, setHorarios] = useState(
    dados.horarios.length > 0
      ? dados.horarios
      : DIAS_SEMANA.map(dia => ({
          dia_semana: dia.numero,
          dia_nome: dia.nome,
          hora_inicio: '08:00',
          hora_fim: '18:00',
          ativo: dia.numero >= 1 && dia.numero <= 5 // Segunda a Sexta ativo por padrão
        }))
  )

  const handleToggleDia = (index) => {
    const novosHorarios = [...horarios]
    novosHorarios[index].ativo = !novosHorarios[index].ativo
    setHorarios(novosHorarios)
  }

  const handleHorarioChange = (index, campo, valor) => {
    const novosHorarios = [...horarios]
    novosHorarios[index][campo] = valor
    setHorarios(novosHorarios)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await wizardService.saveHorarios(horarios)
      atualizarDados('horarios', horarios)
      atualizarDados('horarioFId', response.data.horario_f_id)
      proximaEtapa()
    } catch (error) {
      console.error('Erro ao salvar horários:', error)
      alert('Erro ao salvar horários. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Horários de Funcionamento</h2>
        </div>
        <p className="text-gray-600">
          Defina os horários de funcionamento para cada dia da semana
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {horarios.map((horario, index) => (
          <div
            key={horario.dia_semana}
            className={`flex flex-col gap-4 p-4 rounded-lg border-2 transition-colors sm:flex-row sm:items-center ${
              horario.ativo ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <input
              type="checkbox"
              checked={horario.ativo}
              onChange={() => handleToggleDia(index)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            
            <div className="grid w-full flex-1 grid-cols-1 gap-4 md:grid-cols-3 md:items-center">
              <div className="font-medium text-gray-900">
                {horario.dia_nome}
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">Início</label>
                <Input
                  type="time"
                  value={horario.hora_inicio}
                  onChange={(e) => handleHorarioChange(index, 'hora_inicio', e.target.value)}
                  disabled={!horario.ativo}
                  required={horario.ativo}
                  className="text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">Fim</label>
                <Input
                  type="time"
                  value={horario.hora_fim}
                  onChange={(e) => handleHorarioChange(index, 'hora_fim', e.target.value)}
                  disabled={!horario.ativo}
                  required={horario.ativo}
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        ))}

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







