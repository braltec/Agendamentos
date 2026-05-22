export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Agendamento</h1>
          <p className="text-gray-600">Sistema de Gestão de Agendamentos</p>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  )
}








