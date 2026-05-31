import axios from 'axios'

const AUTH_ACCESS_BLOCK_CODES = new Set([
  'EMPRESA_INATIVA',
  'EMPRESA_INEXISTENTE',
  'USUARIO_SEM_EMPRESA',
])

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para tratar erros de resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const code = error.response?.data?.code

    if (status === 403 && AUTH_ACCESS_BLOCK_CODES.has(code)) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.setItem(
        'auth_error_message',
        error.response?.data?.message || 'Acesso bloqueado. Entre em contato com o administrador.'
      )

      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    if (status === 401) {
      // Token inválido ou expirado
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api















