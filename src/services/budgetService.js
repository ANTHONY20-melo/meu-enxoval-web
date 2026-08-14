import { supabase } from "./supabase";


export async function getCoupleId() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const fromJwt = user.app_metadata?.couple_id;
  if (fromJwt) return fromJwt;

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


export async function loadBudgetItems() {
  const cid = await getCoupleId();

  const query = supabase
    .from("couple_budget")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (cid) {
    query.eq("couple_id", cid);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}


export async function addBudgetItem(item) {
  const cid = await getCoupleId();

  const { data, error } = await supabase
    .from("couple_budget")
    .insert({
      couple_id: cid,
      title: item.title.trim(),
      category: item.category || "Outros",
      planned_value: Number(item.plannedValue) || 0,
      actual_value: Number(item.actualValue) || 0,
      paid_value: Number(item.paidValue) || 0,
      notes: item.notes?.trim() || "",
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}


export async function updateBudgetItem(id, item) {
  const cid = await getCoupleId();

  const { data, error } = await supabase
    .from("couple_budget")
    .update({
      title: item.title.trim(),
      category: item.category || "Outros",
      planned_value: Number(item.plannedValue) || 0,
      actual_value: Number(item.actualValue) || 0,
      paid_value: Number(item.paidValue) || 0,
      notes: item.notes?.trim() || "",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("couple_id", cid ?? "")
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}


export async function deleteBudgetItem(id) {
  const cid = await getCoupleId();

  const { error } = await supabase
    .from("couple_budget")
    .delete()
    .eq("id", id)
    .eq("couple_id", cid ?? "");

  if (error) {
    throw error;
  }
}
