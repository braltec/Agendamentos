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
} from 'lucide-react'
import { clsx } from 'clsx'
import Logo from '../ui/Logo'
import { useAuth } from '../../contexts/AuthContext'

const SUPER_ADMIN_ID = '550e8400-e29b-41d4-a716-446655440012'
const REVENDA_ID = '550e8400-e29b-41d4-a716-446655440020'

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/agendamentos', label: 'Agendamentos', icon: Calendar },
  { path: '/profissionais', label: 'Profissionais', icon: Users },
  { path: '/clientes', label: 'Clientes', icon: UserCircle },
  { path: '/servicos', label: 'Serviços', icon: Briefcase },
  { path: '/empresas', label: 'Empresas', icon: Building2 },
  { path: '/organizacoes', label: 'Organizações', icon: Network, onlySuperAdmin: true },
  { path: '/vendedores', label: 'Vendedores', icon: UsersRound, onlyGestorRevenda: true },
  { path: '/configuracoes', label: 'Configurações', icon: Settings, hideForRevenda: true },
]

export default function Sidebar() {
  const { user } = useAuth()
  const isRevenda = user?.nivel_acesso_id === REVENDA_ID
  const isSuperAdmin = user?.nivel_acesso_id === SUPER_ADMIN_ID
  const isGestorRevenda = user?.is_gestor_revenda
  
  return (
    <aside className="w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-[var(--color-border)]">
        <Logo size="sm" />
      </div>

      {/* Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
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
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  'hover:bg-[var(--color-surface-muted)]',
                  isActive
                    ? 'bg-primary text-white hover:bg-primary-dark'
                    : 'text-[var(--color-text-muted)]'
                )
              }
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
