import api from './api'

export const empresasService = {
  // Listar todas as empresas
  async listar() {
    const response = await api.get('/empresas')
    return response.data
  },

  // Listar empresas agrupadas por revenda (apenas Super Admin)
  async listarPorRevenda() {
    const response = await api.get('/empresas/por-revenda')
    return response.data
  },

  // Buscar empresa por ID
  async buscarPorId(id) {
    const response = await api.get(`/empresas/${id}`)
    return response.data
  },

  // Criar nova empresa
  async criar(empresaData) {
    const response = await api.post('/empresas', empresaData)
    return response.data
  },

  // Atualizar empresa
  async atualizar(id, empresaData) {
    const response = await api.put(`/empresas/${id}`, empresaData)
    return response.data
  },

  // Alterar status da empresa
  async alterarStatus(id, status) {
    const response = await api.patch(`/empresas/${id}/status`, { status })
    return response.data
  }
}








