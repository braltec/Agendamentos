import api from './api'

export const authService = {
  login: (email, password) => {
    return api.post('/auth/login', { email, password })
  },

  logout: () => {
    return api.post('/auth/logout')
  },

  refreshToken: () => {
    return api.post('/auth/refresh')
  },

  me: () => {
    return api.get('/auth/me')
  },
}








