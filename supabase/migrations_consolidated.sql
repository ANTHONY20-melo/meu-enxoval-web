-- ============================================================
-- MEU ENXOVAL — MIGRATION CONSOLIDADA v3 (reconcilia web + mobile)
-- Cole este arquivo INTEIRO no SQL Editor do Supabase
-- (Dashboard → SQL Editor) e execute.
-- É idempotente (IF NOT EXISTS / DROP IF EXISTS / DO com checagem):
-- pode rodar de novo sem erro.
--
-- O QUE FAZ:
-- 1. Reconcilia `couples` (criada pelo app mobile com id/code/created_at)
--    adicionando as colunas web: slug, couple_names, wedding_date,
--    pix_key, settings, owner_user_id, updated_at.
-- 2. Adiciona couple_id em couple_checklist / couple_budget /
--    gift_reservations.
-- 3. BACKFILL (ANTES da PK): preenche couple_id de todas as linhas
--    com o casal principal + NOT NULL. Ordem corrigida: a PK só é
--    criada DEPOIS, quando não há mais NULLs.
-- 4. Cria a PK (couple_id, item_key) e os índices únicos.
-- 5. MODELO DE ADMIN (controlado pelo dono da plataforma):
--    - admin_emails = SOMENTE o super admin (Anthony). Sem
--      auto-promoção: claim_admin é removido.
--    - is_super_admin(): e-mail cadastrado em admin_emails.
--    - is_admin(): super admin OU dono de um casal (owner_user_id).
--    - set_couple_owner(user_id, couple_id): o super admin concede/
--      revoga a permissão de admin de um casal.
--    - list_platform_users(): super admin vê quem acessa o site.
--    - create_couple_from_template exige super admin (só o dono da
--      plataforma cria sites).
-- 6. RPCs públicas de presente/checklist (convidado sem login).
-- 7. RLS por casal. 8. Grants.
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
-- 2. couple_id nas tabelas de conteúdo (SEM PK ainda)
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

-- ------------------------------------------------------------
-- 3. BACKFILL do casal principal (Anthony) e NOT NULL
--    ⚠️ ANTES da PK: preenche TODOS os NULLs de couple_id
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
    INSERT INTO public.profiles (id, couple_id)
    VALUES (anthony_uid, main_id)
    ON CONFLICT (id) DO UPDATE SET couple_id = EXCLUDED.couple_id;
  END IF;

  -- Backfill nas tabelas de conteúdo (preenche TODOS os NULLs)
  UPDATE public.couple_checklist SET couple_id = main_id WHERE couple_id IS NULL;
  UPDATE public.couple_budget SET couple_id = main_id WHERE couple_id IS NULL;
  UPDATE public.gift_reservations SET couple_id = main_id WHERE couple_id IS NULL;

  -- Todas as linhas têm couple_id agora → NOT NULL
  ALTER TABLE public.couple_checklist ALTER COLUMN couple_id SET NOT NULL;
  ALTER TABLE public.couple_budget ALTER COLUMN couple_id SET NOT NULL;
  ALTER TABLE public.gift_reservations ALTER COLUMN couple_id SET NOT NULL;
END $$;

-- ------------------------------------------------------------
-- 4. PK multi-casal + índices únicos (agora SEM NULLs)
-- ------------------------------------------------------------

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

-- Único (couple_id, item_key) para ON CONFLICT multi-casal
CREATE UNIQUE INDEX IF NOT EXISTS gift_reservations_couple_item_key
  ON public.gift_reservations(couple_id, item_key);

-- ------------------------------------------------------------
-- 5. MODELO DE ADMIN — só o dono da plataforma concede
-- ------------------------------------------------------------

-- Tabela de super admins (garantida; seed = Anthony)
CREATE TABLE IF NOT EXISTS public.admin_emails (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.admin_emails (email)
VALUES ('anthonybelmon6@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- É o super admin (dono da plataforma)?
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_emails
    WHERE email = lower(auth.jwt()->>'email')
  );
$$;

-- É admin? Super admin (controla tudo) OU dono de um casal
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.couples
      WHERE owner_user_id = auth.uid()
    );
$$;

-- Remove a auto-promoção antiga (qualquer um virava admin)
DROP FUNCTION IF EXISTS public.claim_admin();

-- Concede/revoga a permissão de admin de um casal (só super admin)
CREATE OR REPLACE FUNCTION public.set_couple_owner(
  p_user_id uuid,
  p_couple_id uuid
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RETURN false;
  END IF;

  IF p_couple_id IS NULL THEN
    RETURN false;
  END IF;

  IF p_user_id IS NULL THEN
    -- Revoga o dono (ninguém administra o casal)
    UPDATE public.couples SET owner_user_id = NULL WHERE id = p_couple_id;
    RETURN true;
  END IF;

  -- Um usuário é dono de no máximo 1 casal (couples_owner_key)
  UPDATE public.couples SET owner_user_id = NULL WHERE owner_user_id = p_user_id;

  UPDATE public.couples
  SET owner_user_id = p_user_id
  WHERE id = p_couple_id;

  -- Vincula o perfil do usuário ao casal (mobile usa profiles.couple_id)
  INSERT INTO public.profiles (id, couple_id)
  VALUES (p_user_id, p_couple_id)
  ON CONFLICT (id) DO UPDATE SET couple_id = EXCLUDED.couple_id;

  RETURN true;
END;
$$;

-- Lista quem acessa o site (só super admin) — para o painel de gestão
-- DROP antes do CREATE: o CREATE OR REPLACE NÃO altera a assinatura de
-- retorno de função existente (erro 42804 "structure of query does not
-- match function result type" ao trocar o tipo de uma coluna).
DROP FUNCTION IF EXISTS public.list_platform_users();
CREATE OR REPLACE FUNCTION public.list_platform_users()
RETURNS TABLE(
  user_id uuid,
  email text,
  full_name text,
  couple_id uuid,
  couple_slug text,
  couple_names jsonb,
  is_owner boolean,
  created_at timestamptz
) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'sem permissão';
  END IF;

  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.email::text AS email,
    -- O nome do usuário vive em raw_user_meta_data (auth.users),
    -- não na tabela public.profiles (que só tem id + couple_id).
    u.raw_user_meta_data->>'full_name' AS full_name,
    p.couple_id AS couple_id,
    -- Cast explícito: a coluna slug da tabela couples é varchar(100) e o
    -- RETURNS TABLE declara text — Postgres exige tipo exato (42804).
    c.slug::text AS couple_slug,
    c.couple_names AS couple_names,
    EXISTS (
      SELECT 1 FROM public.couples c2
      WHERE c2.owner_user_id = u.id
    ) AS is_owner,
    u.created_at AS created_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.couples c ON c.id = p.couple_id
  ORDER BY u.created_at DESC;
END;
$$;

-- ------------------------------------------------------------
-- 6. RPCs — identidade e público
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
-- principal). SELF-SERVICE: qualquer usuário autenticado cria o PRÓPRIO
-- site (p_owner_user_id omisso ou igual a auth.uid()). O super admin
-- (dono da plataforma) pode criar o site DE OUTRO usuário. Gera code de
-- 6 chars (compatível com o app mobile) e vincula o profile do dono.
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
  -- Para SI mesmo: qualquer autenticado. Para OUTRO usuário: só super admin.
  IF p_owner_user_id IS NOT NULL
     AND p_owner_user_id <> auth.uid()
     AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'sem permissão: apenas o administrador cria sites para outros usuários';
  END IF;

  IF p_slug IS NULL OR trim(p_slug) = '' THEN
    RAISE EXCEPTION 'slug inválido';
  END IF;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'informe o usuário dono do site';
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
-- 7. RPCs de presente (multi-casal) + públicas
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

-- Cancela reserva como admin (super admin ou dono do casal)
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
-- DROP antes do CREATE: evita 42804 se a assinatura antiga diferir.
DROP FUNCTION IF EXISTS public.get_gift_reservations_public(uuid);
CREATE OR REPLACE FUNCTION public.get_gift_reservations_public(p_couple_id uuid)
RETURNS TABLE(item_key text, guest_name text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gr.item_key::text, gr.guest_name::text
  FROM public.gift_reservations gr
  WHERE gr.couple_id = p_couple_id;
$$;

-- ------------------------------------------------------------
-- 8. RLS
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
-- 9. Grants
-- ------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.current_user_couple_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_couple_by_slug(varchar) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_couple_from_template(varchar, jsonb, date, varchar, uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_couple_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_platform_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_gift(text, text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_gift(text, text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_gift_admin(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_enxoval(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_gift_reservations_public(uuid) TO anon, authenticated;
