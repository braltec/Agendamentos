-- ============================================
-- Migration: Adicionar Sistema de Organizações de Revenda
-- Data: 2025-11-09
-- Descrição: Permite que revendas tenham múltiplos vendedores
--            organizados em uma estrutura hierárquica
-- ============================================

BEGIN;

-- 1. Criar tabela de organizações de revenda
CREATE TABLE IF NOT EXISTS public.organizacao_revenda (
    org_revenda_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_nome VARCHAR(100) NOT NULL,
    org_razao_social VARCHAR(150),
    org_cnpj VARCHAR(20),
    org_contato VARCHAR(50),
    org_email VARCHAR(100),
    org_endereco TEXT,
    org_status VARCHAR(20) NOT NULL DEFAULT 'ativa',
    org_observacoes TEXT,
    org_criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    org_atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_org_status CHECK (org_status IN ('ativa', 'inativa', 'suspensa'))
);

COMMENT ON TABLE public.organizacao_revenda IS 'Organizações de revenda com múltiplos vendedores';
COMMENT ON COLUMN public.organizacao_revenda.org_revenda_id IS 'ID único da organização';
COMMENT ON COLUMN public.organizacao_revenda.org_nome IS 'Nome fantasia da organização';
COMMENT ON COLUMN public.organizacao_revenda.org_razao_social IS 'Razão social da empresa';
COMMENT ON COLUMN public.organizacao_revenda.org_cnpj IS 'CNPJ da organização';
COMMENT ON COLUMN public.organizacao_revenda.org_status IS 'Status: ativa, inativa, suspensa';

-- 2. Adicionar colunas na tabela login
ALTER TABLE public.login
ADD COLUMN IF NOT EXISTS org_revenda_id UUID,
ADD COLUMN IF NOT EXISTS is_gestor_revenda BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.login.org_revenda_id IS 'ID da organização de revenda à qual o usuário pertence';
COMMENT ON COLUMN public.login.is_gestor_revenda IS 'Se TRUE, usuário é gestor da organização e pode gerenciar vendedores';

-- 3. Criar foreign key
ALTER TABLE public.login
ADD CONSTRAINT fk_login_organizacao_revenda
FOREIGN KEY (org_revenda_id) REFERENCES public.organizacao_revenda(org_revenda_id)
ON DELETE SET NULL;

-- 4. Criar índices para otimização
CREATE INDEX IF NOT EXISTS idx_login_org_revenda_id ON public.login(org_revenda_id);
CREATE INDEX IF NOT EXISTS idx_login_is_gestor_revenda ON public.login(is_gestor_revenda);
CREATE INDEX IF NOT EXISTS idx_organizacao_revenda_status ON public.organizacao_revenda(org_status);

-- 5. Criar função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_organizacao_revenda_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.org_atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar trigger para atualizar timestamp automaticamente
DROP TRIGGER IF EXISTS trg_update_organizacao_revenda_timestamp ON public.organizacao_revenda;
CREATE TRIGGER trg_update_organizacao_revenda_timestamp
    BEFORE UPDATE ON public.organizacao_revenda
    FOR EACH ROW
    EXECUTE FUNCTION update_organizacao_revenda_timestamp();

-- 7. Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Tabela organizacao_revenda criada com sucesso!';
    RAISE NOTICE '✅ Colunas org_revenda_id e is_gestor_revenda adicionadas na tabela login!';
    RAISE NOTICE '✅ Índices e triggers criados!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Próximos passos:';
    RAISE NOTICE '   1. Migrar usuários revenda existentes (se necessário)';
    RAISE NOTICE '   2. Criar organizações de teste';
    RAISE NOTICE '   3. Atualizar backend para usar nova estrutura';
END $$;

COMMIT;



