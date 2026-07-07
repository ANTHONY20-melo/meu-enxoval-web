import { supabase } from "./supabase";

export async function loadChecklist(
  listType
) {
  const { data, error } = await supabase
    .from("couple_checklist")
    .select("*")
    .eq("list_type", listType);

  if (error) {
    throw error;
  }

  return data;
}

export async function saveChecklistItem({
  listType,
  categoryId,
  item,
}) {
  const itemKey =
    `${listType}:${categoryId}:${item.id}`;

  const { error } = await supabase
    .from("couple_checklist")
    .upsert({
      item_key: itemKey,
      list_type: listType,
      category_id: categoryId,
      item_name: item.name,
      checked: item.checked,
      updated_at:
        new Date().toISOString(),
    });

  if (error) {
    throw error;
  }
}