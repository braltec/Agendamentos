export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--auth-bg)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Agendamento</h1>
          <p className="text-[var(--color-text-muted)]">Sistema de Gestão de Agendamentos</p>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  )
}






