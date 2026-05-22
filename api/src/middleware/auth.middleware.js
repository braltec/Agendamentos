import { verifyToken } from '../config/jwt.js'

export function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({ message: 'Token não fornecido' })
    }

    const [, token] = authHeader.split(' ')

    if (!token) {
      return res.status(401).json({ message: 'Token inválido' })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return res.status(401).json({ message: 'Token inválido ou expirado' })
    }

    // Adicionar dados do usuário na requisição
    // Garantir compatibilidade: login_id é o mesmo que user_id
    req.user = {
      ...decoded,
      login_id: decoded.user_id || decoded.login_id
    }
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Erro na autenticação' })
  }
}








