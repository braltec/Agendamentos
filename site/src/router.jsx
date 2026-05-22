import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

// Layouts
import MainLayout from './components/layout/MainLayout'
import AuthLayout from './components/layout/AuthLayout'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AgendamentosPage from './pages/Agendamentos'
import ProfissionaisPage from './pages/Profissionais'
import ClientesPage from './pages/Clientes'
import ServicosPage from './pages/Servicos'
import EmpresasPage from './pages/Empresas'
import ConfiguracoesPage from './pages/Configuracoes'
import Wizard from './pages/Wizard'
import OrganizacoesPage from './pages/Organizacoes'
import VendedoresPage from './pages/Vendedores'

// Componente de rota protegida
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Componente de rota pública (redireciona se já estiver logado)
function PublicRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return children
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthLayout>
              <Login />
            </AuthLayout>
          </PublicRoute>
        }
      />

      {/* Wizard (sem layout) */}
      <Route
        path="/wizard"
        element={
          <ProtectedRoute>
            <Wizard />
          </ProtectedRoute>
        }
      />

      {/* Rotas Protegidas */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="agendamentos" element={<AgendamentosPage />} />
        <Route path="profissionais" element={<ProfissionaisPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="servicos" element={<ServicosPage />} />
        <Route path="empresas" element={<EmpresasPage />} />
        <Route path="organizacoes" element={<OrganizacoesPage />} />
        <Route path="vendedores" element={<VendedoresPage />} />
        <Route path="configuracoes" element={<ConfiguracoesPage />} />
        <Route path="configuracoes/:empresaId" element={<ConfiguracoesPage />} />
      </Route>

      {/* Rota 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

