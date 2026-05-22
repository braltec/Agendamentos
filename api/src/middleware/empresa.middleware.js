// Middleware para garantir isolamento multi-tenant
export function empresaMiddleware(req, res, next) {
  try {
    const empresaId = req.user?.empresa_id

    if (!empresaId) {
      return res.status(403).json({ message: 'Empresa não identificada' })
    }

    // Adicionar empresa_id na requisição para uso nos controllers
    req.empresaId = empresaId
    next()
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao validar empresa' })
  }
}








