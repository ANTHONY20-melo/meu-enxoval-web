import { supabase } from "./supabase";


export async function loadChecklist(listType) {
  const { data, error } = await supabase
    .from("couple_checklist")
    .select("*")
    .eq("list_type", listType);

  if (error) {
    throw error;
  }

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
}