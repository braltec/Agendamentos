import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/auth.service'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    let isMounted = true

    const carregarUsuario = async () => {
      // Verificar se há token salvo ao carregar a aplicação
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')

      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData)
          if (isMounted) setUser(parsedUser)

          const response = await authService.me()
          const syncedUser = response.data.user
          localStorage.setItem('user', JSON.stringify(syncedUser))
          if (isMounted) setUser(syncedUser)
        } catch (error) {
          console.error('Erro ao carregar dados do usuário:', error)
          const message = error.response?.data?.message || localStorage.getItem('auth_error_message') || ''
          if (message) localStorage.setItem('auth_error_message', message)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          if (isMounted) setAuthError(message)
          if (isMounted) setUser(null)
        }
      }

      if (isMounted) setLoading(false)
    }

    carregarUsuario()

    return () => {
      isMounted = false
    }
  }, [])

  const login = async (email, password) => {
    try {
      setAuthError('')
      localStorage.removeItem('auth_error_message')
      const response = await authService.login(email, password)
      const { token, user: userData } = response.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)

      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao fazer login'
      setAuthError(message)
      return {
        success: false,
        message,
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('auth_error_message')
    setAuthError('')
    setUser(null)
  }

  const updateUser = (nextUser) => {
    localStorage.setItem('user', JSON.stringify(nextUser))
    setUser(nextUser)
  }

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    authError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}













