import { logger } from '../utils/logger.js'

export function errorMiddleware(err, req, res, next) {
  logger.error('Erro não tratado', {
    error: err,
    method: req.method,
    path: req.originalUrl,
    userId: req.user?.login_id || req.user?.user_id,
    empresaId: req.user?.empresa_id,
  })

  const status = err.status || 500
  const message = status >= 500 && process.env.NODE_ENV === 'production'
    ? 'Erro interno do servidor'
    : err.message || 'Erro interno do servidor'

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}







