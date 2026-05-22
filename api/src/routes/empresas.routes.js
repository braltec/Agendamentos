import express from 'express'
import {
  listarEmpresas,
  listarEmpresasPorRevenda,
  buscarEmpresa,
  criarEmpresa,
  atualizarEmpresa,
  alterarStatusEmpresa
} from '../controllers/empresas.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const router = express.Router()

// Todas as rotas requerem autenticação
router.use(authMiddleware)

// Rota especial para Super Admin ver empresas por revenda
router.get('/por-revenda', listarEmpresasPorRevenda)

// Rotas normais
router.get('/', listarEmpresas)
router.get('/:id', buscarEmpresa)
router.post('/', criarEmpresa)
router.put('/:id', atualizarEmpresa)
router.patch('/:id/status', alterarStatusEmpresa)

export default router








