import { supabase } from "./supabase";


/*
Cache em memória (TTL curto) para evitar
requisições repetidas ao navegar entre
rotas (Enxoval <-> Início <-> Casamento).

O cache é invalidado automaticamente após
qualquer escrita (marcar, adicionar, remover).
*/

const CACHE_TTL_MS = 10 * 1000;

const listCache = new Map();

function getCached(listType) {
  const entry = listCache.get(listType);

  if (
    entry &&
    Date.now() - entry.at < CACHE_TTL_MS
  ) {
    return entry.data;
  }

  return null;
}

function setCached(listType, data) {
  listCache.set(listType, {
    at: Date.now(),
    data,
  });
}

export function invalidateChecklistCache(
  listType
) {
  if (listType) {
    listCache.delete(listType);
    return;
  }

  listCache.clear();
}


// Colunas realmente usadas pela interface.
// Evita trafegar metadados desnecessários.

const CHECKLIST_COLUMNS =
  "item_key,item_id,list_type,category_id,item_name,checked,is_custom,deleted";


export async function loadChecklist(listType) {
  const cached = getCached(listType);

  if (cached) {
    return cached;
  }

  const { data, error } = await supabase
    .from("couple_checklist")
    .select(CHECKLIST_COLUMNS)
    .eq("list_type", listType);

  if (error) {
    throw error;
  }

  setCached(listType, data || []);

  return data || [];
}


export async function saveChecklistItem({
  listType,
  categoryId,
  item,
}) {
  const itemKey =
    `${listType}:${categoryId}:${item.id}`;

  const { data, error } = await supabase
    .from("couple_checklist")
    .upsert(
      {
        item_key: itemKey,
        item_id: item.id,

        list_type: listType,
        category_id: categoryId,

        item_name: item.name,

        checked: item.checked,

        is_custom:
          item.isCustom || false,

        deleted: false,

        updated_at:
          new Date().toISOString(),
      },
      {
        onConflict: "item_key",
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


export async function addChecklistItem({
  listType,
  categoryId,
  itemName,
}) {
  const itemId =
    `custom-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

  const itemKey =
    `${listType}:${categoryId}:${itemId}`;

  const { data, error } = await supabase
    .from("couple_checklist")
    .insert({
      item_key: itemKey,
      item_id: itemId,

      list_type: listType,
      category_id: categoryId,

      item_name: itemName.trim(),

      checked: false,
      is_custom: true,
      deleted: false,

      updated_at:
        new Date().toISOString(),
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


export async function removeChecklistItem({
  listType,
  categoryId,
  item,
}) {
  const itemKey =
    `${listType}:${categoryId}:${item.id}`;

  const { error } = await supabase
    .from("couple_checklist")
    .upsert(
      {
        item_key: itemKey,
        item_id: item.id,

        list_type: listType,
        category_id: categoryId,

        item_name: item.name,

        checked: item.checked,

        is_custom:
          item.isCustom || false,

        deleted: true,

        updated_at:
          new Date().toISOString(),
      },
      {
        onConflict: "item_key",
      }
    );

  if (error) {
    throw error;
  }

  invalidateChecklistCache(listType);
}
