import { supabase } from "./supabase";


/**
 * Helper: obtém o coupleId do usuário logado.
 * - Primeiro tenta o JWT claim `app_metadata.couple_id` (webhook)
 * - Fallback: RPC current_user_couple_id()
 * - Retorna null se não logado ou sem casal (app funciona offline)
 */
export async function getCoupleId() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // 1) JWT claim
  const fromJwt = user.app_metadata?.couple_id;
  if (fromJwt) return fromJwt;

  // 2) Fallback: RPC
  try {
    const { data, error } = await supabase.rpc(
      "current_user_couple_id"
    );
    if (!error && data) return data;
  } catch {
    // silencioso
  }

  return null;
}


/*
Cache em memória (TTL curto) para evitar
requisições repetidas ao navegar entre
rotas (Enxoval <-> Início <-> Casamento).

A chave inclui o casal (coupleId) para não
misturar dados entre casais na mesma sessão.
O cache é invalidado após qualquer escrita.
*/

const CACHE_TTL_MS = 10 * 1000;

const listCache = new Map();

function cacheKey(listType, coupleId) {
  return `${listType}:${coupleId || "anon"}`;
}

function getCached(listType, coupleId) {
  const entry = listCache.get(
    cacheKey(listType, coupleId)
  );

  if (
    entry &&
    Date.now() - entry.at < CACHE_TTL_MS
  ) {
    return entry.data;
  }

  return null;
}

function setCached(listType, coupleId, data) {
  listCache.set(
    cacheKey(listType, coupleId),
    {
      at: Date.now(),
      data,
    }
  );
}

export function invalidateChecklistCache(
  listType
) {
  if (listType) {
    for (const key of listCache.keys()) {
      if (key.startsWith(`${listType}:`)) {
        listCache.delete(key);
      }
    }
    return;
  }

  listCache.clear();
}


/**
 * Carrega os itens do checklist do casal.
 *
 * @param {string} listType  "enxoval" | "casamento"
 * @param {string|null} coupleId
 *   - Convidado (via slug): passa o coupleId do contexto público.
 *   - Admin: passa null → resolve do JWT/RPC.
 *
 * Quando temos coupleId (admin ou convidado), usa a RPC
 * get_public_enxoval (SECURITY DEFINER): o convidado não tem
 * RLS para a tabela, mas a RPC retorna o checklist do casal.
 */
export async function loadChecklist(listType, coupleId = null) {
  let cid = coupleId;

  if (!cid) {
    cid = await getCoupleId();
  }

  const cached = getCached(listType, cid);

  if (cached) {
    return cached;
  }

  if (cid) {
    const { data, error } = await supabase.rpc(
      "get_public_enxoval",
      { p_couple_id: cid }
    );

    if (error) {
      throw error;
    }

    const filtered = (data || []).filter(
      (item) =>
        item.list_type === listType &&
        item.deleted !== true
    );

    setCached(listType, cid, filtered);

    return filtered;
  }

  const query = supabase
    .from("couple_checklist")
    .select("*")
    .eq("list_type", listType)
    .eq("deleted", false);

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  setCached(listType, cid, data || []);

  return data || [];
}


/**
 * Salva (upsert) um item do checklist.
 * Inclui couple_id para garantir escrita no casal correto.
 */
export async function saveChecklistItem({
  listType,
  categoryId,
  item,
}) {
  const cid = await getCoupleId();

  if (!cid) {
    throw new Error("Sem casal vinculado");
  }

  const itemKey =
    `${listType}:${categoryId}:${item.id}`;

  const { data, error } = await supabase
    .from("couple_checklist")
    .upsert(
      {
        couple_id: cid,
        item_key: itemKey,
        item_id: item.id,
        list_type: listType,
        category_id: categoryId,
        item_name: item.name,
        checked: item.checked,
        is_custom: item.isCustom || false,
        deleted: false,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "couple_id,item_key",
      }
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Estado local já foi atualizado pelo hook;
  // apenas invalida o cache para a próxima leitura.
  invalidateChecklistCache(listType);

  return data;
}


/**
 * Adiciona um item customizado.
 */
export async function addChecklistItem({
  listType,
  categoryId,
  itemName,
}) {
  const cid = await getCoupleId();

  if (!cid) {
    throw new Error("Sem casal vinculado");
  }

  const itemId =
    `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const itemKey =
    `${listType}:${categoryId}:${itemId}`;

  const { data, error } = await supabase
    .from("couple_checklist")
    .insert({
      couple_id: cid,
      item_key: itemKey,
      item_id: itemId,
      list_type: listType,
      category_id: categoryId,
      item_name: itemName.trim(),
      checked: false,
      is_custom: true,
      deleted: false,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  invalidateChecklistCache(listType);

  return {
    id: data.item_id,
    name: data.item_name,
    checked: false,
    isCustom: true,
  };
}


/**
 * Remove (soft-delete) um item.
 */
export async function removeChecklistItem({
  listType,
  categoryId,
  item,
}) {
  const cid = await getCoupleId();

  if (!cid) {
    throw new Error("Sem casal vinculado");
  }

  const itemKey =
    `${listType}:${categoryId}:${item.id}`;

  const { error } = await supabase
    .from("couple_checklist")
    .upsert(
      {
        couple_id: cid,
        item_key: itemKey,
        item_id: item.id,
        list_type: listType,
        category_id: categoryId,
        item_name: item.name,
        checked: item.checked,
        is_custom: item.isCustom || false,
        deleted: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "couple_id,item_key",
      }
    );

  if (error) {
    throw error;
  }

  invalidateChecklistCache(listType);
}
