-- ============================================================================
-- Migration: Adicionar suporte a máquina de estados na sessão
-- Versão: 001
-- Data: 2026-04-23
-- Descrição: Adiciona colunas para controle de estado conversacional e 
--            persistência do agendamento selecionado durante reagendamento
-- ============================================================================

-- Adicionar colunas para máquina de estados
ALTER TABLE public.contexto_sessao
ADD COLUMN IF NOT EXISTS conversation_state VARCHAR(50) DEFAULT 'idle';

COMMENT ON COLUMN public.contexto_sessao.conversation_state IS 
'Estado atual da conversa: idle, awaiting_appointment_selection, awaiting_new_datetime, awaiting_confirmation';

-- Colunas para agendamento selecionado (durante reagendamento/cancelamento)
ALTER TABLE public.contexto_sessao
ADD COLUMN IF NOT EXISTS selected_protocolo VARCHAR(50) DEFAULT NULL;

ALTER TABLE public.contexto_sessao
ADD COLUMN IF NOT EXISTS selected_event_id VARCHAR(255) DEFAULT NULL;

ALTER TABLE public.contexto_sessao
ADD COLUMN IF NOT EXISTS selected_service_name VARCHAR(100) DEFAULT NULL;

ALTER TABLE public.contexto_sessao
ADD COLUMN IF NOT EXISTS selected_professional VARCHAR(100) DEFAULT NULL;

ALTER TABLE public.contexto_sessao
ADD COLUMN IF NOT EXISTS selected_date DATE DEFAULT NULL;

ALTER TABLE public.contexto_sessao
ADD COLUMN IF NOT EXISTS selected_start TIME DEFAULT NULL;

ALTER TABLE public.contexto_sessao
ADD COLUMN IF NOT EXISTS selected_duration_min INTEGER DEFAULT NULL;

COMMENT ON COLUMN public.contexto_sessao.selected_protocolo IS 
'Protocolo do agendamento selecionado para reagendamento/cancelamento';

COMMENT ON COLUMN public.contexto_sessao.selected_event_id IS 
'ID do evento no Google Calendar do agendamento selecionado';

-- Coluna para lista de agendamentos pendentes de seleção
ALTER TABLE public.contexto_sessao
ADD COLUMN IF NOT EXISTS pending_agendamentos JSONB DEFAULT NULL;

COMMENT ON COLUMN public.contexto_sessao.pending_agendamentos IS 
'Lista de agendamentos apresentados ao cliente para seleção (formato JSON array)';

-- Coluna para expiração do estado
ALTER TABLE public.contexto_sessao
ADD COLUMN IF NOT EXISTS state_expires_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.contexto_sessao.state_expires_at IS 
'Timestamp de expiração do estado atual (para evitar estados travados)';

-- Índice para consultas por estado
CREATE INDEX IF NOT EXISTS idx_contexto_sessao_conversation_state 
ON public.contexto_sessao(conversation_state);

-- Índice para limpeza de estados expirados
CREATE INDEX IF NOT EXISTS idx_contexto_sessao_state_expires 
ON public.contexto_sessao(state_expires_at) 
WHERE state_expires_at IS NOT NULL;

-- ============================================================================
-- IMPORTANTE: Adicionar placeholder no template de prompt
-- ============================================================================

-- Adicione {{ESTADO_CONTEXTO}} no seu template (tabela ai_prompt_templates)
-- O placeholder deve ficar no final do prompt, antes do CHECKLIST/FALLBACK
-- Exemplo de UPDATE (ajuste key e version conforme seu caso):

/*
UPDATE ai_prompt_templates
SET template_text = template_text || '

---

{{ESTADO_CONTEXTO}}

'
WHERE key = 'prompt_agendamento' 
  AND version = '2025-08-26-01';  -- ajuste para sua versão
*/

-- ============================================================================
-- Verificação pós-migração
-- ============================================================================
DO $$
BEGIN
    -- Verifica se todas as colunas foram criadas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'contexto_sessao' 
        AND column_name = 'conversation_state'
    ) THEN
        RAISE EXCEPTION 'Coluna conversation_state não foi criada';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'contexto_sessao' 
        AND column_name = 'selected_protocolo'
    ) THEN
        RAISE EXCEPTION 'Coluna selected_protocolo não foi criada';
    END IF;
    
    RAISE NOTICE 'Migration 001 executada com sucesso!';
END $$;

-- ============================================================================
-- Job opcional: Limpar estados expirados (executar periodicamente)
-- ============================================================================
-- CREATE OR REPLACE FUNCTION limpar_estados_expirados()
-- RETURNS INTEGER AS $$
-- DECLARE
--     linhas_afetadas INTEGER;
-- BEGIN
--     UPDATE public.contexto_sessao
--     SET 
--         conversation_state = 'idle',
--         selected_protocolo = NULL,
--         selected_event_id = NULL,
--         selected_service_name = NULL,
--         selected_professional = NULL,
--         selected_date = NULL,
--         selected_start = NULL,
--         selected_duration_min = NULL,
--         pending_agendamentos = NULL,
--         state_expires_at = NULL
--     WHERE 
--         state_expires_at IS NOT NULL 
--         AND state_expires_at < NOW()
--         AND conversation_state != 'idle';
--     
--     GET DIAGNOSTICS linhas_afetadas = ROW_COUNT;
--     RETURN linhas_afetadas;
-- END;
-- $$ LANGUAGE plpgsql;
