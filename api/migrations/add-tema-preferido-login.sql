-- ========================================
-- MIGRACAO: Preferencia visual do usuario
-- Data: 2026-05-31
-- ========================================

BEGIN;

ALTER TABLE public.login
ADD COLUMN IF NOT EXISTS tema_preferido text NOT NULL DEFAULT 'light';

ALTER TABLE public.login
ALTER COLUMN tema_preferido SET DEFAULT 'light';

UPDATE public.login
SET tema_preferido = 'light'
WHERE tema_preferido IS NULL
  OR tema_preferido NOT IN ('light', 'dark', 'system');

ALTER TABLE public.login
ALTER COLUMN tema_preferido SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_login_tema_preferido'
      AND conrelid = 'public.login'::regclass
  ) THEN
    ALTER TABLE public.login
    ADD CONSTRAINT chk_login_tema_preferido
    CHECK (tema_preferido IN ('light', 'dark', 'system'));
  END IF;
END $$;

COMMENT ON COLUMN public.login.tema_preferido
IS 'Preferência visual do usuário: light, dark ou system.';

COMMIT;
