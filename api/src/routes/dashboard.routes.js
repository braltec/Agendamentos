import express from 'express'
import {
  getVisaoGeral,
  getGestaoAgenda,
  getClientes,
  getServicos,
  getIAAtendimento,
  getDashboardStats,
  getProximosAgendamentos,
  getProfissionaisHoje,
  getGraficoAgendamentos,
  getEstatisticasPorEmpresa
} from '../controllers/dashboard.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const router = express.Router()

// Todas as rotas requerem autenticação
router.use(authMiddleware)

// Buscar dados executivos da aba Visão Geral
router.get('/visao-geral', getVisaoGeral)

// Buscar cards operacionais da aba Gestão de Agenda
router.get('/gestao-agenda', getGestaoAgenda)

// Buscar cards da aba Clientes
router.get('/clientes', getClientes)

// Buscar cards da aba Serviços
router.get('/servicos', getServicos)

// Buscar cards da aba IA / Atendimento
router.get('/ia-atendimento', getIAAtendimento)

// Buscar estatísticas do dashboard
router.get('/stats', getDashboardStats)

// Buscar próximos agendamentos
router.get('/proximos-agendamentos', getProximosAgendamentos)

// Buscar profissionais e agendamentos de hoje
router.get('/profissionais-hoje', getProfissionaisHoje)

// Buscar dados do gráfico de agendamentos vs cancelamentos
router.get('/grafico-agendamentos', getGraficoAgendamentos)

// Buscar estatísticas por empresa (apenas Super Admin)
router.get('/estatisticas-por-empresa', getEstatisticasPorEmpresa)

export default router
