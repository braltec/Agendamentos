import { Bell, LogOut, Monitor, Moon, Sun, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import Button from '../ui/Button'

export default function Header() {
  const { user, logout } = useAuth()
  const { themePreference, setTheme } = useTheme()

  const themeOptions = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Escuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor },
  ]

  return (
    <header className="h-16 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          Bem-vindo, {user?.nome || 'Usuário'}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-1 sm:flex">
          {themeOptions.map((option) => {
            const Icon = option.icon
            const isActive = themePreference === option.value

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'
                }`}
                title={`Tema ${option.label}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {option.label}
              </button>
            )
          })}
        </div>

        <label className="sr-only" htmlFor="theme-preference">
          Aparência
        </label>
        <select
          id="theme-preference"
          value={themePreference}
          onChange={(event) => setTheme(event.target.value)}
          className="sm:hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-sm text-[var(--color-text)]"
        >
          {themeOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        {/* Notificações */}
        <button className="p-2 hover:bg-[var(--color-surface-muted)] rounded-lg transition-colors relative">
          <Bell className="w-5 h-5 text-[var(--color-text-muted)]" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
        </button>

        {/* Perfil */}
        <div className="flex items-center gap-3 pl-4 border-l border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-[var(--color-text-muted)]">{user?.nome}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-[var(--color-text-muted)]"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}







