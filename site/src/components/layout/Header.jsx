import { Bell, LogOut, Menu, Monitor, Moon, Sun, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import Button from '../ui/Button'

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth()
  const { themePreference, setTheme } = useTheme()

  const themeOptions = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Escuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor },
  ]

  return (
    <header className="flex min-h-16 items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 sm:px-5 lg:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <button
          type="button"
          className="icon-action shrink-0 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] xl:hidden"
          onClick={onMenuClick}
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="truncate text-sm font-semibold text-[var(--color-text)] sm:text-lg">
          Bem-vindo, {user?.nome || 'Usuário'}
        </h2>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        <div className="hidden items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-1 md:flex">
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
          className="hidden min-h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-sm text-[var(--color-text)] sm:block md:hidden"
        >
          {themeOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        {/* Notificações */}
        <button className="icon-action relative hover:bg-[var(--color-surface-muted)]">
          <Bell className="h-5 w-5 text-[var(--color-text-muted)]" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger"></span>
        </button>

        {/* Perfil */}
        <div className="flex items-center gap-2 border-l border-[var(--color-border)] pl-2 sm:gap-3 sm:pl-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
              <User className="h-5 w-5 text-white" />
            </div>
            <span className="hidden max-w-36 truncate text-sm font-medium text-[var(--color-text-muted)] lg:inline">
              {user?.nome}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-[var(--color-text-muted)]"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}






