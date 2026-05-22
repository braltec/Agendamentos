import express from 'express'
import {
  checkWizardStatus,
  getEmpresaCompleta,
  getEmpresaCompletaPorId,
  saveConfiguracoes,
  saveHorarios,
  createProfissional,
  createServico,
  vincularServico,
  vincularHorario,
  updateInstancia,
  updateEmpresa,
  updateServico,
  updateProfissional,
  updateHorarios,
  deleteServico,
  deleteProfissional,
  completeWizard,
  getAllPrompts,
  getPromptVersions,
  updateEmpresaPrompt,
  getUsuarios,
  getNiveisAcesso,
  createUsuario,
  updateUsuario,
  updateSenhaUsuario,
  deleteUsuario
} from '../controllers/wizard.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const router = express.Router()

// Todas as rotas requerem autenticação
router.use(authMiddleware)

// Verificar status do wizard
router.get('/status', checkWizardStatus)

// Buscar dados completos de uma empresa específica (Super Admin)
// IMPORTANTE: Esta rota deve vir ANTES da rota genérica /dados-completos
router.get('/dados-completos/:empresaId', getEmpresaCompletaPorId)

// Buscar todos os dados da empresa
router.get('/dados-completos', getEmpresaCompleta)

// Etapa 1: Configurações de agendamento
router.post('/configuracoes', saveConfiguracoes)

// Etapa 2: Horários de funcionamento
router.post('/horarios', saveHorarios)

// Etapa 3: Profissionais
router.post('/profissionais', createProfissional)

// Etapa 4: Serviços
router.post('/servicos', createServico)

// Etapa 5: Vincular serviços aos profissionais
router.post('/vincular-servico', vincularServico)

// Vincular horário ao profissional
router.post('/vincular-horario', vincularHorario)

// Etapa 6: Instância WhatsApp
router.post('/instancia', updateInstancia)

// Etapa 7: Concluir wizard
router.post('/complete', completeWizard)

// Atualizar dados da empresa
router.put('/empresa', updateEmpresa)

// Atualizar serviço
router.put('/servicos/:servicoId', updateServico)

// Atualizar profissional
router.put('/profissionais/:profissionalId', updateProfissional)

// Atualizar horários
router.put('/horarios', updateHorarios)

// Excluir serviço (soft delete)
router.delete('/servicos/:servicoId', deleteServico)

// Excluir profissional (soft delete)
router.delete('/profissionais/:profissionalId', deleteProfissional)

// Buscar todos os prompts disponíveis
router.get('/prompts', getAllPrompts)

// Buscar versões de um prompt específico
router.get('/prompts/:promptKey/versions', getPromptVersions)

// Atualizar prompt e versão da empresa
router.put('/empresa/prompt', updateEmpresaPrompt)

// Gerenciamento de usuários
router.get('/usuarios/:empresaId', getUsuarios)
router.get('/niveis-acesso', getNiveisAcesso)
router.post('/usuarios', createUsuario)
router.put('/usuarios/:loginId', updateUsuario)
router.put('/usuarios/:loginId/senha', updateSenhaUsuario)
router.delete('/usuarios/:loginId', deleteUsuario)

export default router

