import api from './api'

export const organizacoesService = {
  // Listar todas as organizações (apenas Super Admin)
  async listar() {
    const response = await api.get('/organizacoes')
    return response.data
  },

  // Buscar organização por ID
  async buscarPorId(id) {
    const response = await api.get(`/organizacoes/${id}`)
    return response.data
  },

  // Criar nova organização
  async criar(organizacaoData) {
    const response = await api.post('/organizacoes', organizacaoData)
    return response.data
  },

  // Atualizar organização
  async atualizar(id, organizacaoData) {
    const response = await api.put(`/organizacoes/${id}`, organizacaoData)
    return response.data
  },

  // Alterar status da organização
  async alterarStatus(id, status) {
    const response = await api.patch(`/organizacoes/${id}/status`, { status })
    return response.data
  },

  // Listar usuários de uma organização
  async listarUsuarios(orgId) {
    const response = await api.get(`/organizacoes/${orgId}/usuarios`)
    return response.data
  },

  // Listar empresas de uma organização
  async listarEmpresas(orgId) {
    const response = await api.get(`/organizacoes/${orgId}/empresas`)
    return response.data
  },

  // Criar vendedor na organização
  async criarVendedor(orgId, vendedorData) {
    const response = await api.post(`/organizacoes/${orgId}/vendedores`, vendedorData)
    return response.data
  },

  // Atualizar vendedor
  async atualizarVendedor(orgId, vendedorId, vendedorData) {
    const response = await api.put(`/organizacoes/${orgId}/vendedores/${vendedorId}`, vendedorData)
    return response.data
  },

  // Remover vendedor
  async removerVendedor(orgId, vendedorId) {
    const response = await api.delete(`/organizacoes/${orgId}/vendedores/${vendedorId}`)
    return response.data
  }
}

export default organizacoesService



