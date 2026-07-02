import { CheckCircle2, Clock, Calendar, Users, Briefcase, Link2, MessageCircle } from 'lucide-react'
import { Button } from '../../components/ui/Button'

export default function Etapa7Revisao({ dados, etapaAnterior, concluirWizard, loading }) {
  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle2 className="w-6 h-6 text-green-500" />
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Revisão e Conclusão</h2>
        </div>
        <p className="text-gray-600">
          Revise as configurações antes de finalizar
        </p>
      </div>

      <div className="space-y-4">
        {/* Configurações */}
        <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Configurações de Agendamento</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 md:grid-cols-4">
            <div>
              <span className="text-gray-600">Antecedência:</span>
              <p className="font-medium">{dados.configuracoes?.empresa_cfg_anteced_minutos} min</p>
            </div>
            <div>
              <span className="text-gray-600">Intervalo:</span>
              <p className="font-medium">{dados.configuracoes?.empresa_cfg_interv_minutos} min</p>
            </div>
            <div>
              <span className="text-gray-600">Buffer Pré:</span>
              <p className="font-medium">{dados.configuracoes?.empresa_cfg_buffer_pre_minutos} min</p>
            </div>
            <div>
              <span className="text-gray-600">Buffer Pós:</span>
              <p className="font-medium">{dados.configuracoes?.empresa_cfg_buffer_pos_minutos} min</p>
            </div>
          </div>
        </div>

        {/* Horários */}
        <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Horários de Funcionamento</h3>
          </div>
          <div className="space-y-2 text-sm">
            {dados.horarios.filter(h => h.ativo).map(horario => (
              <div key={horario.dia_semana} className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                <span className="text-gray-700">{horario.dia_nome}</span>
                <span className="font-medium">{horario.hora_inicio} - {horario.hora_fim}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Profissionais */}
        <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">
              Profissionais ({dados.profissionais.length})
            </h3>
          </div>
          <div className="space-y-2 text-sm">
            {dados.profissionais.map((prof, index) => (
              <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{prof.profissional_nome || prof.nome}</p>
                  {prof.especialidade && (
                    <p className="text-gray-600 text-xs">{prof.especialidade}</p>
                  )}
                </div>
                <span className="text-gray-600">{prof.profissional_contato || prof.contato}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Serviços */}
        <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-3 mb-3">
            <Briefcase className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">
              Serviços ({dados.servicos.length})
            </h3>
          </div>
          <div className="space-y-2 text-sm">
            {dados.servicos.map((serv, index) => (
              <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{serv.servicos_nome || serv.nome}</p>
                  {serv.descricao && (
                    <p className="text-gray-600 text-xs">{serv.descricao}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium">R$ {serv.servicos_valor || serv.valor}</p>
                  <p className="text-gray-600 text-xs">
                    {serv.servicos_duracao?.minutes || serv.duracao_minutos} min
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vínculos */}
        <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-3 mb-3">
            <Link2 className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">
              Vínculos Criados ({dados.vinculos.length})
            </h3>
          </div>
          <p className="text-sm text-gray-600">
            {dados.vinculos.length} vínculo(s) entre profissionais e serviços
          </p>
        </div>

        {/* WhatsApp */}
        {dados.instancia && (
          <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-3 mb-3">
              <MessageCircle className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900">Instância WhatsApp</h3>
            </div>
            <p className="text-sm font-medium">{dados.instancia.instancia_nome}</p>
            {dados.instancia.instancia_observacao && (
              <p className="text-sm text-gray-600 mt-1">{dados.instancia.instancia_observacao}</p>
            )}
          </div>
        )}
      </div>

      {/* Mensagem de Sucesso */}
      <div className="mt-6 bg-green-50 border-2 border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-green-900 mb-2">
          🎉 Tudo pronto para começar!
        </h4>
        <p className="text-sm text-green-800">
          Sua empresa está configurada e pronta para receber agendamentos.
          Clique em "Concluir" para finalizar o wizard e acessar o sistema.
        </p>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-between">
        <Button type="button" onClick={etapaAnterior} variant="outline" className="w-full sm:w-auto">
          Voltar
        </Button>
        <Button onClick={concluirWizard} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 sm:w-auto">
          {loading ? 'Finalizando...' : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Concluir Configuração
            </>
          )}
        </Button>
      </div>
    </div>
  )
}







