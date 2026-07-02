export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-[100svh] items-center justify-center px-4 py-6 sm:p-6" style={{ background: 'var(--auth-bg)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="mb-2 text-3xl font-bold text-primary sm:text-4xl">Agendamento</h1>
          <p className="text-sm text-[var(--color-text-muted)] sm:text-base">Sistema de Gestão de Agendamentos</p>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  )
}




