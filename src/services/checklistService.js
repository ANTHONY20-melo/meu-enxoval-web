import { supabase } from "./supabase";


export async function loadChecklist(listType) {
  const { data, error } = await supabase
    .from("couple_checklist")
    .select("*")
    .eq("list_type", listType)
    .order("item_name", {
      ascending: true,
    });

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

  const newItem = {
    item_key: itemKey,

    item_id: itemId,

    list_type: listType,

    category_id: categoryId,

    item_name: itemName.trim(),

    checked: false,

    is_custom: true,

    updated_at:
      new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("couple_checklist")
    .insert(newItem)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.item_id,
    name: data.item_name,
    checked: data.checked,
    isCustom: true,
  };
}


export async function deleteChecklistItem({
  listType,
  categoryId,
  itemId,
}) {
  const itemKey =
    `${listType}:${categoryId}:${itemId}`;

  const { error } = await supabase
    .from("couple_checklist")
    .delete()
    .eq("item_key", itemKey);

  if (error) {
    throw error;
  }
}