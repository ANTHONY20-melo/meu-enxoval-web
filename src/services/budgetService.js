import { supabase } from "./supabase";


export async function loadBudgetItems() {
  const { data, error } = await supabase
    .from("couple_budget")
    .select("*")
    .order("created_at", {
      ascending: false,
    });


  if (error) {
    throw error;
  }


  return data || [];
}


export async function addBudgetItem(item) {
  const { data, error } = await supabase
    .from("couple_budget")
    .insert({
      title: item.title.trim(),

      category:
        item.category || "Outros",

      planned_value:
        Number(item.plannedValue) || 0,

      actual_value:
        Number(item.actualValue) || 0,

      paid_value:
        Number(item.paidValue) || 0,

      notes:
        item.notes?.trim() || "",

      updated_at:
        new Date().toISOString(),
    })
    .select()
    .single();


  if (error) {
    throw error;
  }


  return data;
}


export async function updateBudgetItem(
  id,
  item
) {
  const { data, error } = await supabase
    .from("couple_budget")
    .update({
      title: item.title.trim(),

      category:
        item.category || "Outros",

      planned_value:
        Number(item.plannedValue) || 0,

      actual_value:
        Number(item.actualValue) || 0,

      paid_value:
        Number(item.paidValue) || 0,

      notes:
        item.notes?.trim() || "",

      updated_at:
        new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();


  if (error) {
    throw error;
  }


  return data;
}


export async function deleteBudgetItem(id) {
  const { error } = await supabase
    .from("couple_budget")
    .delete()
    .eq("id", id);


  if (error) {
    throw error;
  }
}