import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/auth.service'
import { useAuth } from './AuthContext'

const THEME_STORAGE_KEY = 'tema_preferido'
const VALID_THEMES = new Set(['light', 'dark', 'system'])

const ThemeContext = createContext(null)

function getStoredThemePreference() {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
  return VALID_THEMES.has(storedTheme) ? storedTheme : 'light'
}

function getSystemTheme() {
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }

  return 'light'
}

function resolveTheme(themePreference) {
  return themePreference === 'system' ? getSystemTheme() : themePreference
}

function applyTheme(themePreference) {
  const resolvedTheme = resolveTheme(themePreference)
  const root = document.documentElement

  root.classList.remove('light', 'dark')
  root.classList.add(resolvedTheme)
  root.dataset.themePreference = themePreference
  root.style.colorScheme = resolvedTheme

  return resolvedTheme
}

export function ThemeProvider({ children }) {
  const { user, updateUser } = useAuth()
  const [themePreference, setThemePreference] = useState(getStoredThemePreference)
  const [resolvedTheme, setResolvedTheme] = useState(() => applyTheme(getStoredThemePreference()))

  const syncThemePreference = useCallback((nextThemePreference) => {
    if (!VALID_THEMES.has(nextThemePreference)) return

    localStorage.setItem(THEME_STORAGE_KEY, nextThemePreference)
    setThemePreference(nextThemePreference)
    setResolvedTheme(applyTheme(nextThemePreference))
  }, [])

  useEffect(() => {
    const userThemePreference = user?.tema_preferido

    if (VALID_THEMES.has(userThemePreference)) {
      syncThemePreference(userThemePreference)
    }
  }, [syncThemePreference, user?.tema_preferido])

  useEffect(() => {
    if (themePreference !== 'system') return undefined

    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mediaQuery) return undefined

    const handleSystemThemeChange = () => {
      setResolvedTheme(applyTheme('system'))
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }, [themePreference])

  const setTheme = useCallback(async (nextThemePreference) => {
    if (!VALID_THEMES.has(nextThemePreference)) return { success: false }

    const previousThemePreference = themePreference
    syncThemePreference(nextThemePreference)

    if (!user) return { success: true }

    try {
      const response = await authService.updateThemePreference(nextThemePreference)
      const savedThemePreference = response.data.tema_preferido || nextThemePreference

      if (VALID_THEMES.has(savedThemePreference) && savedThemePreference !== nextThemePreference) {
        syncThemePreference(savedThemePreference)
      }

      updateUser?.({
        ...user,
        tema_preferido: savedThemePreference,
      })

      return { success: true }
    } catch (error) {
      console.error('Erro ao salvar preferência visual:', error)
      syncThemePreference(previousThemePreference)
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao salvar preferência visual',
      }
    }
  }, [syncThemePreference, themePreference, updateUser, user])

  const value = useMemo(() => ({
    themePreference,
    resolvedTheme,
    setTheme,
  }), [resolvedTheme, setTheme, themePreference])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider')
  }
  return context
}
