-- ============================================================
-- MEU ENXOVAL — MIGRATION CONSOLIDADA v2 (reconcilia web + mobile)
-- Cole este arquivo INTEIRO no SQL Editor do Supabase
-- (Dashboard → SQL Editor) e execute.
-- É idempotente (IF NOT EXISTS / DROP IF EXISTS / DO com checagem):
-- pode rodar de novo sem erro.
--
-- O QUE FAZ:
-- 1. Reconcilia a tabela `couples` (criada pelo app mobile com
--    id/code/created_at) adicionando as colunas web: slug,
--    couple_names, wedding_date, pix_key, settings, owner_user_id.
-- 2. Adiciona couple_id em couple_checklist / couple_budget /
--    gift_reservations + backfill para o casal principal.
-- 3. Cria os índices únicos (couple_id, item_key) para o
--    ON CONFLICT do reserve_gift e o upsert do checklist.
-- 4. Cria as RPCs: current_user_couple_id, get_couple_by_slug,
--    create_couple_from_template (gera code + vincula profile),
--    reserve_gift / cancel_gift / cancel_gift_admin (multi-casal),
--    get_public_enxoval e get_gift_reservations_public (convidado).
-- 5. Habilita RLS nas tabelas de conteúdo com policies por casal.
-- ============================================================

-- ------------------------------------------------------------
-- 1. COUPLES — adiciona colunas web à tabela existente
-- ------------------------------------------------------------
ALTER TABLE public.couples
  ADD COLUMN IF NOT EXISTS slug varchar(100),
  ADD COLUMN IF NOT EXISTS couple_names jsonb,
  ADD COLUMN IF NOT EXISTS wedding_date date,
  ADD COLUMN IF NOT EXISTS pix_key varchar(200),
  ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{"theme":"default","animations_enabled":true,"photos":{"hero":null,"profile":null,"gallery":[]},"template_version":1}'::jsonb,
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Índices
CREATE INDEX IF NOT EXISTS idx_couples_owner ON public.couples(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_couples_slug ON public.couples(slug);
CREATE UNIQUE INDEX IF NOT EXISTS couples_slug_key ON public.couples(slug);
CREATE UNIQUE INDEX IF NOT EXISTS couples_owner_key ON public.couples(owner_user_id);

-- Trigger updated_at automático
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS couples_updated_at ON public.couples;
CREATE TRIGGER couples_updated_at
  BEFORE UPDATE ON public.couples
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------
-- 2. couple_id nas tabelas de conteúdo
-- ------------------------------------------------------------
ALTER TABLE public.couple_checklist
  ADD COLUMN IF NOT EXISTS couple_id uuid REFERENCES public.couples(id) ON DELETE CASCADE;
ALTER TABLE public.couple_budget
  ADD COLUMN IF NOT EXISTS couple_id uuid REFERENCES public.couples(id) ON DELETE CASCADE;
ALTER TABLE public.gift_reservations
  ADD COLUMN IF NOT EXISTS couple_id uuid REFERENCES public.couples(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_checklist_couple ON public.couple_checklist(couple_id);
CREATE INDEX IF NOT EXISTS idx_budget_couple ON public.couple_budget(couple_id);
CREATE INDEX IF NOT EXISTS idx_gift_reservations_couple ON public.gift_reservations(couple_id);

-- Único (couple_id, item_key) para ON CONFLICT multi-casal
CREATE UNIQUE INDEX IF NOT EXISTS gift_reservations_couple_item_key
  ON public.gift_reservations(couple_id, item_key);

-- couple_checklist: troca PK antiga (item_key, de quando o checklist era
-- global) por PK multi-casal (couple_id, item_key). Seguro: se a PK já
-- inclui couple_id, não faz nada.
DO $$
DECLARE
  v_conname text;
  v_has_couple int;
BEGIN
  SELECT count(*) INTO v_has_couple
  FROM pg_constraint c
  WHERE c.conrelid = 'public.couple_checklist'::regclass
    AND c.contype = 'p'
    AND EXISTS (
      SELECT 1 FROM pg_attribute a
      WHERE a.attrelid = c.conrelid
        AND a.attnum = ANY(c.conkey)
        AND a.attname = 'couple_id'
    );

  IF v_has_couple = 0 THEN
    SELECT conname INTO v_conname
    FROM pg_constraint
    WHERE conrelid = 'public.couple_checklist'::regclass
      AND contype = 'p'
    LIMIT 1;

    IF v_conname IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.couple_checklist DROP CONSTRAINT %I', v_conname);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.couple_checklist'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE public.couple_checklist
      ADD CONSTRAINT couple_checklist_pkey PRIMARY KEY (couple_id, item_key);
  END IF;
END $$;

-- ------------------------------------------------------------
-- 3. Backfill do casal principal (Anthony) e NOT NULL
-- ------------------------------------------------------------
DO $$
DECLARE
  anthony_uid uuid;
  main_id uuid;
BEGIN
  SELECT id INTO anthony_uid
  FROM auth.users
  WHERE email = 'anthonybelmon6@gmail.com';

  -- Casal principal: prioriza a linha criada pelo app mobile (code 3QTHMT),
  -- senão a mais antiga, senão cria uma.
  SELECT id INTO main_id FROM public.couples WHERE code = '3QTHMT' LIMIT 1;
  IF main_id IS NULL THEN
    SELECT id INTO main_id FROM public.couples ORDER BY created_at LIMIT 1;
  END IF;
  IF main_id IS NULL THEN
    INSERT INTO public.couples (code) VALUES ('3QTHMT') RETURNING id INTO main_id;
  END IF;

  -- Preenche colunas web do casal principal (se ainda não preenchidas)
  UPDATE public.couples SET
    slug = COALESCE(slug, 'anthony-e-noiva'),
    couple_names = COALESCE(couple_names, '{"noiva": "Noiva", "noivo": "Anthony"}'::jsonb),
    wedding_date = COALESCE(wedding_date, '2026-12-12'::date),
    owner_user_id = COALESCE(owner_user_id, anthony_uid)
  WHERE id = main_id;

  -- Vincula o perfil do Anthony ao casal principal (mobile + web)
  IF anthony_uid IS NOT NULL THEN
    UPDATE public.profiles SET couple_id = main_id
    WHERE id = anthony_uid AND couple_id IS NULL;
  END IF;

  -- Backfill nas tabelas de conteúdo
  UPDATE public.couple_checklist SET couple_id = main_id WHERE couple_id IS NULL;
  UPDATE public.couple_budget SET couple_id = main_id WHERE couple_id IS NULL;
  UPDATE public.gift_reservations SET couple_id = main_id WHERE couple_id IS NULL;

  -- Todas as linhas têm couple_id agora → NOT NULL
  ALTER TABLE public.couple_checklist ALTER COLUMN couple_id SET NOT NULL;
  ALTER TABLE public.couple_budget ALTER COLUMN couple_id SET NOT NULL;
  ALTER TABLE public.gift_reservations ALTER COLUMN couple_id SET NOT NULL;
END $$;

-- ------------------------------------------------------------
-- 4. RPCs — identidade e público
-- ------------------------------------------------------------

-- Casal do usuário atual (reconcilia web owner + mobile profiles)
CREATE OR REPLACE FUNCTION public.current_user_couple_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT id FROM public.couples WHERE owner_user_id = auth.uid() LIMIT 1),
    (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
  );
$$;

-- Busca casal por slug (público — sem owner_user_id)
CREATE OR REPLACE FUNCTION public.get_couple_by_slug(p_slug varchar)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', id,
    'slug', slug,
    'couple_names', couple_names,
    'wedding_date', wedding_date,
    'pix_key', pix_key,
    'settings', settings,
    'created_at', created_at,
    'updated_at', updated_at
  )
  FROM public.couples
  WHERE slug = p_slug;
$$;

-- Cria casal a partir do template (clona checklist + budget do casal
-- principal). Gera code de 6 chars (compatível com o app mobile) e
-- vincula o profile do dono.
CREATE OR REPLACE FUNCTION public.create_couple_from_template(
  p_slug varchar,
  p_couple_names jsonb,
  p_wedding_date date,
  p_pix_key varchar DEFAULT NULL,
  p_owner_user_id uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_couple_id uuid;
  v_code text;
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_owner uuid := COALESCE(p_owner_user_id, auth.uid());
  v_template uuid;
BEGIN
  IF p_slug IS NULL OR trim(p_slug) = '' THEN
    RAISE EXCEPTION 'slug inválido';
  END IF;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'usuário não autenticado';
  END IF;

  -- Gera código único (loop até não colidir)
  LOOP
    v_code := (
      SELECT string_agg(substr(v_alphabet, floor(random() * length(v_alphabet))::int + 1, 1), '')
      FROM generate_series(1, 6)
    );
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.couples WHERE code = v_code);
  END LOOP;

  INSERT INTO public.couples (slug, couple_names, wedding_date, pix_key, owner_user_id, code)
  VALUES (p_slug, p_couple_names, p_wedding_date, p_pix_key, v_owner, v_code)
  RETURNING id INTO new_couple_id;

  -- Template: casal principal = o que tem mais itens não deletados
  SELECT couple_id INTO v_template
  FROM public.couple_checklist
  WHERE deleted = false
  GROUP BY couple_id
  ORDER BY count(*) DESC
  LIMIT 1;

  IF v_template IS NOT NULL THEN
    -- Clona checklist (enxoval + casamento), resetando checked
    INSERT INTO public.couple_checklist
      (couple_id, list_type, category_id, item_key, item_id, item_name,
       checked, is_custom, deleted, updated_at)
    SELECT
      new_couple_id, list_type, category_id, item_key, item_id, item_name,
      false, is_custom, deleted, now()
    FROM public.couple_checklist
    WHERE couple_id = v_template AND deleted = false;

    -- Clona budget com valores zerados
    INSERT INTO public.couple_budget
      (couple_id, title, category, planned_value, actual_value,
       paid_value, notes, updated_at)
    SELECT
      new_couple_id, title, category, 0, 0, 0, notes, now()
    FROM public.couple_budget
    WHERE couple_id = v_template;
  END IF;

  -- Vincula profile do dono (mobile usa profiles.couple_id)
  INSERT INTO public.profiles (id, couple_id)
  VALUES (v_owner, new_couple_id)
  ON CONFLICT (id) DO UPDATE SET couple_id = EXCLUDED.couple_id;

  RETURN new_couple_id;
END;
$$;

-- ------------------------------------------------------------
-- 5. RPCs de presente (multi-casal) + públicas
-- ------------------------------------------------------------

-- Remove assinaturas antigas (não usadas pelo web) para não conflitar
DROP FUNCTION IF EXISTS public.reserve_gift(text, text);
DROP FUNCTION IF EXISTS public.cancel_gift(text, text);
DROP FUNCTION IF EXISTS public.cancel_gift_admin(text);

-- Reserva (convidado anônimo) — validação zero-trust
CREATE OR REPLACE FUNCTION public.reserve_gift(
  p_item_key text,
  p_guest_name text,
  p_couple_id uuid DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_couple_id IS NULL OR p_item_key IS NULL OR p_item_key = '' THEN
    RETURN false;
  END IF;

  p_guest_name := trim(p_guest_name);

  IF p_guest_name IS NULL
     OR length(p_guest_name) < 2
     OR length(p_guest_name) > 80 THEN
    RETURN false;
  END IF;

  INSERT INTO public.gift_reservations (item_key, guest_name, couple_id)
  VALUES (p_item_key, p_guest_name, p_couple_id)
  ON CONFLICT (couple_id, item_key) DO NOTHING;

  RETURN found;
END;
$$;

-- Cancela a própria reserva (convidado)
CREATE OR REPLACE FUNCTION public.cancel_gift(
  p_item_key text,
  p_guest_name text,
  p_couple_id uuid DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_couple_id IS NULL THEN
    RETURN false;
  END IF;

  DELETE FROM public.gift_reservations
  WHERE item_key = p_item_key
    AND couple_id = p_couple_id
    AND lower(guest_name) = lower(trim(p_guest_name));

  RETURN found;
END;
$$;

-- Cancela reserva como admin
CREATE OR REPLACE FUNCTION public.cancel_gift_admin(
  p_item_key text,
  p_couple_id uuid DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_couple_id IS NULL THEN
    RETURN false;
  END IF;

  IF NOT public.is_admin() THEN
    RETURN false;
  END IF;

  DELETE FROM public.gift_reservations
  WHERE item_key = p_item_key AND couple_id = p_couple_id;

  RETURN found;
END;
$$;

-- Checklist público do casal (convidado pelo link do slug)
CREATE OR REPLACE FUNCTION public.get_public_enxoval(p_couple_id uuid)
RETURNS SETOF public.couple_checklist LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.couple_checklist
  WHERE couple_id = p_couple_id AND deleted = false;
$$;

-- Reservas públicas (só item_key + guest_name — o convidado vê o que
-- já foi reservado e pode cancelar a própria pelo nome)
CREATE OR REPLACE FUNCTION public.get_gift_reservations_public(p_couple_id uuid)
RETURNS TABLE(item_key text, guest_name text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gr.item_key, gr.guest_name
  FROM public.gift_reservations gr
  WHERE gr.couple_id = p_couple_id;
$$;

-- ------------------------------------------------------------
-- 6. RLS
-- ------------------------------------------------------------
ALTER TABLE public.couple_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_reservations ENABLE ROW LEVEL SECURITY;

-- couples: dono pode tudo (select público via RPC get_couple_by_slug)
DROP POLICY IF EXISTS "owner_all" ON public.couples;
CREATE POLICY "owner_all" ON public.couples
  FOR ALL USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- couple_checklist: dono do casal vê/tudo
DROP POLICY IF EXISTS "checklist_owner_all" ON public.couple_checklist;
CREATE POLICY "checklist_owner_all" ON public.couple_checklist
  FOR ALL USING (couple_id = public.current_user_couple_id())
  WITH CHECK (couple_id = public.current_user_couple_id());

-- gift_reservations: dono vê/tudo; convidado usa RPCs (reserve/cancel)
DROP POLICY IF EXISTS "gifts_owner_all" ON public.gift_reservations;
CREATE POLICY "gifts_owner_all" ON public.gift_reservations
  FOR ALL USING (couple_id = public.current_user_couple_id())
  WITH CHECK (couple_id = public.current_user_couple_id());

-- couple_budget: dono vê/tudo
DROP POLICY IF EXISTS "budget_owner_all" ON public.couple_budget;
CREATE POLICY "budget_owner_all" ON public.couple_budget
  FOR ALL USING (couple_id = public.current_user_couple_id());

-- ------------------------------------------------------------
-- 7. Grants
-- ------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.current_user_couple_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_couple_by_slug(varchar) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_couple_from_template(varchar, jsonb, date, varchar, uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_gift(text, text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_gift(text, text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_gift_admin(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_enxoval(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_gift_reservations_public(uuid) TO anon, authenticated;
