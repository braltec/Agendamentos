import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card, { CardBody } from '../components/ui/Card'
import Logo from '../components/ui/Logo'
import { LogIn } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email, password)

    if (!result.success) {
      setError(result.message)
    }

    setLoading(false)
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <Logo size="xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Entrar</h2>
            <p className="text-gray-600 mt-1">Acesse sua conta</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
          />

          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button type="submit" className="w-full" loading={loading}>
            <LogIn className="w-5 h-5" />
            Entrar
          </Button>
        </form>
      </CardBody>
    </Card>
  )
}

