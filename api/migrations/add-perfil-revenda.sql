-- ========================================
-- MIGRAÇÃO: Adicionar Perfil Revenda
-- Data: 2025-11-09
-- ========================================

BEGIN;

-- 1. Adicionar campo criado_por na tabela empresa
-- Este campo armazena quem criou/cadastrou a empresa
ALTER TABLE empresa 
ADD COLUMN IF NOT EXISTS criado_por UUID;

-- 2. Adicionar campo data_cadastro para rastreabilidade
ALTER TABLE empresa 
ADD COLUMN IF NOT EXISTS data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Adicionar comentário explicativo
COMMENT ON COLUMN empresa.criado_por IS 'UUID do usuário (login_id) que cadastrou esta empresa';
COMMENT ON COLUMN empresa.data_cadastro IS 'Data em que a empresa foi cadastrada no sistema';

-- 4. Inserir novo nível de acesso "Revenda"
-- Verificar se já existe antes de inserir
INSERT INTO nivel_acesso (nivel_acesso_id, nivel_acesso_)
VALUES ('550e8400-e29b-41d4-a716-446655440020', 'revenda')
ON CONFLICT (nivel_acesso_id) DO NOTHING;

-- 5. Comentário na tabela nivel_acesso
COMMENT ON TABLE nivel_acesso IS 'Controle de permissões - Níveis: admin (super), revenda, empresa_admin, gerente, profissional';

-- 6. Atualizar empresas existentes para ter o criado_por como NULL 
-- (empresas antigas não têm essa informação)
-- Isso é automático, mas vamos adicionar um comentário
COMMENT ON COLUMN empresa.criado_por IS 'UUID do usuário (login_id) que cadastrou esta empresa. NULL para empresas existentes antes desta migração.';

-- 7. Criar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_empresa_criado_por ON empresa(criado_por);

-- 8. Mostrar resultado
DO $$
BEGIN
  RAISE NOTICE '✅ Migração concluída com sucesso!';
  RAISE NOTICE '   - Campo criado_por adicionado à tabela empresa';
  RAISE NOTICE '   - Campo data_cadastro adicionado à tabela empresa';
  RAISE NOTICE '   - Nível de acesso "revenda" criado';
  RAISE NOTICE '   - Índice idx_empresa_criado_por criado';
END $$;

COMMIT;

-- ========================================
-- CONSULTAS ÚTEIS PÓS-MIGRAÇÃO
-- ========================================

-- Ver todos os níveis de acesso disponíveis:
-- SELECT * FROM nivel_acesso ORDER BY nivel_acesso_;

-- Ver empresas e quem as cadastrou:
-- SELECT 
--   e.empresa_nome,
--   e.criado_por,
--   l.nome as criador_nome,
--   l.email as criador_email,
--   na.nivel_acesso_ as criador_nivel,
--   e.data_cadastro
-- FROM empresa e
-- LEFT JOIN login l ON e.criado_por = l.login_id
-- LEFT JOIN nivel_acesso na ON l.nivel_acesso_id = na.nivel_acesso_id
-- ORDER BY e.data_cadastro DESC;



