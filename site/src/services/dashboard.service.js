import api from './api'

export const dashboardService = {
  // Buscar dados executivos da aba Visão Geral
  async getVisaoGeral(dateRange) {
    const response = await api.get('/dashboard/visao-geral', {
      params: dateRange ? {
        preset: dateRange.preset,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      } : undefined,
    })
    return response.data
  },

  // Buscar cards operacionais da aba Gestão de Agenda
  async getGestaoAgenda() {
    const response = await api.get('/dashboard/gestao-agenda')
    return response.data
  },

  // Buscar cards da aba Clientes
  async getClientes(dateRange) {
    const response = await api.get('/dashboard/clientes', {
      params: dateRange ? {
        preset: dateRange.preset,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      } : undefined,
    })
    return response.data
  },

  // Buscar cards da aba Serviços
  async getServicos(dateRange) {
    const response = await api.get('/dashboard/servicos', {
      params: dateRange ? {
        preset: dateRange.preset,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      } : undefined,
    })
    return response.data
  },

  // Buscar cards da aba IA / Atendimento
  async getIAAtendimento(dateRange) {
    const response = await api.get('/dashboard/ia-atendimento', {
      params: dateRange ? {
        preset: dateRange.preset,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      } : undefined,
    })
    return response.data
  },

  // Buscar estatísticas do dashboard
  async getStats() {
    const response = await api.get('/dashboard/stats')
    return response.data
  },

  // Buscar próximos agendamentos
  async getProximosAgendamentos() {
    const response = await api.get('/dashboard/proximos-agendamentos')
    return response.data
  },

  // Buscar profissionais e agendamentos de hoje
  async getProfissionaisHoje() {
    const response = await api.get('/dashboard/profissionais-hoje')
    return response.data
  },

  // Buscar dados do gráfico de agendamentos vs cancelamentos
  async getGraficoAgendamentos() {
    const response = await api.get('/dashboard/grafico-agendamentos')
    return response.data
  },

  // Buscar estatísticas por empresa (apenas Super Admin)
  async getEstatisticasPorEmpresa() {
    const response = await api.get('/dashboard/estatisticas-por-empresa')
    return response.data
  }
}

export default dashboardService
