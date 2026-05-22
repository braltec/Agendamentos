import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Circle } from 'lucide-react'
import wizardService from '../../services/wizard.service'
import Etapa1Configuracoes from './Etapa1Configuracoes'
import Etapa2Horarios from './Etapa2Horarios'
import Etapa3Profissionais from './Etapa3Profissionais'
import Etapa4Servicos from './Etapa4Servicos'
import Etapa5Vinculos from './Etapa5Vinculos'
import Etapa6WhatsApp from './Etapa6WhatsApp'
import Etapa7Revisao from './Etapa7Revisao'

const ETAPAS = [
  { numero: 1, titulo: 'Configurações', componente: Etapa1Configuracoes },
  { numero: 2, titulo: 'Horários', componente: Etapa2Horarios },
  { numero: 3, titulo: 'Profissionais', componente: Etapa3Profissionais },
  { numero: 4, titulo: 'Serviços', componente: Etapa4Servicos },
  { numero: 5, titulo: 'Vínculos', componente: Etapa5Vinculos },
  { numero: 6, titulo: 'WhatsApp', componente: Etapa6WhatsApp },
  { numero: 7, titulo: 'Revisão', componente: Etapa7Revisao }
]

export default function Wizard() {
  const navigate = useNavigate()
  const [etapaAtual, setEtapaAtual] = useState(1)
  const [loading, setLoading] = useState(false)
  const [dados, setDados] = useState({
    configuracoes: null,
    horarioFId: null,
    horarios: [],
    profissionais: [],
    servicos: [],
    vinculos: [],
    instancia: null
  })

  // Verificar se o wizard já foi concluído
  useEffect(() => {
    const checkWizardStatus = async () => {
      try {
        const response = await wizardService.checkStatus()
        if (response.data.completed) {
          navigate('/dashboard')
        }
      } catch (error) {
        console.error('Erro ao verificar status do wizard:', error)
      }
    }
    checkWizardStatus()
  }, [navigate])

  const atualizarDados = (chave, valor) => {
    setDados(prev => ({ ...prev, [chave]: valor }))
  }

  const proximaEtapa = () => {
    if (etapaAtual < ETAPAS.length) {
      setEtapaAtual(etapaAtual + 1)
    }
  }

  const etapaAnterior = () => {
    if (etapaAtual > 1) {
      setEtapaAtual(etapaAtual - 1)
    }
  }

  const concluirWizard = async () => {
    setLoading(true)
    try {
      await wizardService.complete()
      navigate('/dashboard')
    } catch (error) {
      console.error('Erro ao concluir wizard:', error)
      alert('Erro ao concluir wizard. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const EtapaComponente = ETAPAS[etapaAtual - 1].componente

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configuração Inicial
          </h1>
          <p className="text-gray-600">
            Vamos configurar sua empresa em {ETAPAS.length} etapas simples
          </p>
        </div>

        {/* Indicador de Progresso */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            {ETAPAS.map((etapa, index) => (
              <div key={etapa.numero} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      etapa.numero < etapaAtual
                        ? 'bg-green-500 border-green-500 text-white'
                        : etapa.numero === etapaAtual
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    {etapa.numero < etapaAtual ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <span className="text-sm font-semibold">{etapa.numero}</span>
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      etapa.numero <= etapaAtual ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {etapa.titulo}
                  </span>
                </div>
                {index < ETAPAS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition-colors ${
                      etapa.numero < etapaAtual ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Conteúdo da Etapa */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <EtapaComponente
            dados={dados}
            atualizarDados={atualizarDados}
            proximaEtapa={proximaEtapa}
            etapaAnterior={etapaAnterior}
            concluirWizard={concluirWizard}
            loading={loading}
            setLoading={setLoading}
            etapaAtual={etapaAtual}
            totalEtapas={ETAPAS.length}
          />
        </div>
      </div>
    </div>
  )
}








