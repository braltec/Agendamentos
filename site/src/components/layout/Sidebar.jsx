import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCircle,
  Briefcase,
  Building2,
  Settings,
  Network,
  UsersRound,
  X,
} from 'lucide-react'
import { clsx } from 'clsx'
import Logo from '../ui/Logo'
import { useAuth } from '../../contexts/AuthContext'

const SUPER_ADMIN_ID = '550e8400-e29b-41d4-a716-446655440012'
const REVENDA_ID = '550e8400-e29b-41d4-a716-446655440020'

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/agendamentos', label: 'Agendamentos', icon: Calendar, hidden: true },
  { path: '/profissionais', label: 'Profissionais', icon: Users, hidden: true },
  { path: '/clientes', label: 'Clientes', icon: UserCircle, hidden: true },
  { path: '/servicos', label: 'Serviços', icon: Briefcase, hidden: true },
  { path: '/empresas', label: 'Empresas', icon: Building2 },
  { path: '/organizacoes', label: 'Organizações', icon: Network, onlySuperAdmin: true },
  { path: '/vendedores', label: 'Vendedores', icon: UsersRound, onlyGestorRevenda: true },
  { path: '/configuracoes', label: 'Configurações', icon: Settings, hideForRevenda: true },
]

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const { user } = useAuth()
  const isRevenda = user?.nivel_acesso_id === REVENDA_ID
  const isSuperAdmin = user?.nivel_acesso_id === SUPER_ADMIN_ID
  const isGestorRevenda = user?.is_gestor_revenda
  
  return (
    <>
      <button
        type="button"
        aria-label="Fechar menu"
        className={clsx(
          'fixed inset-0 z-40 bg-black/40 transition-opacity xl:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
      />

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-transform duration-200 ease-out',
          'xl:static xl:z-auto xl:w-64 xl:max-w-none xl:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex min-h-16 items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 sm:px-6">
          <Logo size="sm" />
          <button
            type="button"
            aria-label="Fechar menu"
            className="icon-action text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] xl:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5 custom-scrollbar sm:px-4 sm:py-6">
          {menuItems.map((item) => {
            if (item.hidden) {
              return null
            }

            // Ocultar "Configurações" para Revenda
            if (item.hideForRevenda && isRevenda) {
              return null
            }

            // Mostrar "Organizações" apenas para Super Admin
            if (item.onlySuperAdmin && !isSuperAdmin) {
              return null
            }

            // Mostrar "Vendedores" apenas para Gestor de Revenda
            if (item.onlyGestorRevenda && (!isRevenda || !isGestorRevenda)) {
              return null
            }

            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  clsx(
                    'flex min-h-11 items-center gap-3 rounded-lg px-4 py-3 transition-colors',
                    'hover:bg-[var(--color-surface-muted)]',
                    isActive
                      ? 'bg-primary text-white hover:bg-primary-dark'
                      : 'text-[var(--color-text-muted)]'
                  )
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
