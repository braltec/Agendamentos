import express from 'express'
import {
  listarOrganizacoes,
  buscarOrganizacao,
  criarOrganizacao,
  atualizarOrganizacao,
  alterarStatusOrganizacao,
  listarUsuariosOrganizacao,
  listarEmpresasOrganizacao,
  criarVendedor,
  atualizarVendedor,
  removerVendedor
} from '../controllers/organizacao-revenda.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const router = express.Router()

// Todas as rotas requerem autenticação
router.use(authMiddleware)

// Rotas de organizações (apenas Super Admin)
router.get('/', listarOrganizacoes)
router.get('/:id', buscarOrganizacao)
router.post('/', criarOrganizacao)
router.put('/:id', atualizarOrganizacao)
router.patch('/:id/status', alterarStatusOrganizacao)

// Rotas de usuários e empresas da organização
router.get('/:id/usuarios', listarUsuariosOrganizacao)
router.get('/:id/empresas', listarEmpresasOrganizacao)

// Rotas de gestão de vendedores (Gestor ou Super Admin)
router.post('/:id/vendedores', criarVendedor)
router.put('/:id/vendedores/:vendedorId', atualizarVendedor)
router.delete('/:id/vendedores/:vendedorId', removerVendedor)

export default router



