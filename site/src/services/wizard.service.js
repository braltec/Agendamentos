import api from './api'

export const wizardService = {
  // Verificar status do wizard
  async checkStatus() {
    const response = await api.get('/wizard/status')
    return response.data
  },

  // Buscar todos os dados da empresa
  async getDadosCompletos() {
    const response = await api.get('/wizard/dados-completos')
    return response.data
  },

  // Buscar dados completos de uma empresa específica (Super Admin)
  async getDadosCompletosPorEmpresa(empresaId) {
    const response = await api.get(`/wizard/dados-completos/${empresaId}`)
    return response.data
  },

  // Salvar configurações
  async saveConfiguracoes(data) {
    const response = await api.post('/wizard/configuracoes', data)
    return response.data
  },

  // Salvar horários
  async saveHorarios(horarios) {
    const response = await api.post('/wizard/horarios', { horarios })
    return response.data
  },

  // Criar profissional
  async createProfissional(data) {
    const response = await api.post('/wizard/profissionais', data)
    return response.data
  },

  // Vincular horário ao profissional
  async vincularHorario(profissionalId, horarioFId) {
    const response = await api.post('/wizard/vincular-horario', {
      profissional_id: profissionalId,
      horario_f_id: horarioFId
    })
    return response.data
  },

  // Criar serviço
  async createServico(data) {
    const response = await api.post('/wizard/servicos', data)
    return response.data
  },

  // Vincular serviço ao profissional
  async vincularServico(profissionalId, servicoId, personalizacao = {}) {
    const response = await api.post('/wizard/vincular-servico', {
      profissional_id: profissionalId,
      servico_id: servicoId,
      personalizacao
    })
    return response.data
  },

  // Atualizar instância WhatsApp
  async updateInstancia(data) {
    const response = await api.post('/wizard/instancia', data)
    return response.data
  },

  // Concluir wizard
  async complete() {
    const response = await api.post('/wizard/complete')
    return response.data
  },

  // Atualizar dados da empresa
  async updateEmpresa(data) {
    const response = await api.put('/wizard/empresa', data)
    return response.data
  },

  // Atualizar serviço
  async updateServico(servicoId, data) {
    const response = await api.put(`/wizard/servicos/${servicoId}`, data)
    return response.data
  },

  // Atualizar profissional
  async updateProfissional(profissionalId, data) {
    const response = await api.put(`/wizard/profissionais/${profissionalId}`, data)
    return response.data
  },

  // Atualizar horários
  async updateHorarios(horarios, empresaId = null) {
    const payload = { horarios }
    if (empresaId) {
      payload.empresa_id = empresaId
    }
    const response = await api.put('/wizard/horarios', payload)
    return response.data
  },

  // Excluir serviço
  async deleteServico(servicoId) {
    const response = await api.delete(`/wizard/servicos/${servicoId}`)
    return response.data
  },

  // Excluir profissional
  async deleteProfissional(profissionalId) {
    const response = await api.delete(`/wizard/profissionais/${profissionalId}`)
    return response.data
  },

  // Buscar todos os prompts disponíveis
  async getAllPrompts() {
    const response = await api.get('/wizard/prompts')
    return response.data
  },

  // Buscar versões de um prompt específico
  async getPromptVersions(promptKey) {
    const response = await api.get(`/wizard/prompts/${promptKey}/versions`)
    return response.data
  },

  // Atualizar prompt e versão da empresa
  async updateEmpresaPrompt(data) {
    const response = await api.put('/wizard/empresa/prompt', data)
    return response.data
  },

  // Buscar usuários de uma empresa
  async getUsuarios(empresaId) {
    const response = await api.get(`/wizard/usuarios/${empresaId}`)
    return response.data
  },

  // Buscar níveis de acesso
  async getNiveisAcesso() {
    const response = await api.get('/wizard/niveis-acesso')
    return response.data
  },

  // Criar novo usuário
  async createUsuario(data) {
    const response = await api.post('/wizard/usuarios', data)
    return response.data
  },

  // Atualizar usuário
  async updateUsuario(loginId, data) {
    const response = await api.put(`/wizard/usuarios/${loginId}`, data)
    return response.data
  },

  // Atualizar senha do usuário
  async updateSenhaUsuario(loginId, novaSenha) {
    const response = await api.put(`/wizard/usuarios/${loginId}/senha`, { novaSenha })
    return response.data
  },

  // Excluir usuário
  async deleteUsuario(loginId) {
    const response = await api.delete(`/wizard/usuarios/${loginId}`)
    return response.data
  }
}

export default wizardService

