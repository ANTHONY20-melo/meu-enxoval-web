import { supabase } from "./supabase";
import { getCoupleId as getCoupleIdFromChecklist } from "./checklistService";

// Re-exporta para não duplicar a lógica
export { getCoupleIdFromChecklist as getCoupleId };


/*
Cache em memória (TTL curto) para evitar
requisições repetidas entre rotas. A chave
inclui o casal para não misturar reservas
de casais diferentes na mesma sessão.
*/

const CACHE_TTL_MS = 10 * 1000;

let reservationsCache = null;

function cacheKey(coupleId) {
  return coupleId || "anon";
}

function getCached(coupleId) {
  if (
    reservationsCache &&
    reservationsCache.key ===
      cacheKey(coupleId) &&
    Date.now() - reservationsCache.at <
      CACHE_TTL_MS
  ) {
    return reservationsCache.data;
  }

  return null;
}

function setCached(coupleId, data) {
  reservationsCache = {
    key: cacheKey(coupleId),
    at: Date.now(),
    data,
  };
}

export function invalidateReservationsCache() {
  reservationsCache = null;
}


/**
 * Carrega as reservas de presentes.
 *
 * - Convidado (público via slug, sem sessão): usa a RPC
 *   get_gift_reservations_public (SECURITY DEFINER), que retorna
 *   apenas item_key + guest_name — sem RLS direto na tabela.
 * - Usuário logado: filtra pelo seu couple_id (policy RLS).
 * - Sem casal identificado: lê as reservas visíveis (fallback).
 */
export async function loadGiftReservations(coupleId = null) {
  let cid = coupleId;

  if (!cid) {
    cid = await getCoupleIdFromChecklist();
  }

  const cached = getCached(cid);

  if (cached) {
    return cached;
  }

  if (cid) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Convidado anônimo → RPC pública limitada
      const { data, error } = await supabase.rpc(
        "get_gift_reservations_public",
        { p_couple_id: cid }
      );

      if (error) {
        throw error;
      }

      setCached(cid, data || []);

      return data || [];
    }

    const { data, error } = await supabase
      .from("gift_reservations")
      .select("*")
      .eq("couple_id", cid);

    if (error) {
      throw error;
    }

    setCached(cid, data || []);

    return data || [];
  }

  const { data, error } = await supabase
    .from("gift_reservations")
    .select("item_key,guest_name");

  if (error) {
    throw error;
  }

  setCached(cid, data || []);

  return data || [];
}


/**
 * Reserva um presente.
 * O couple_id pode vir do caller (via slug) ou
 * é resolvido via JWT claim / RPC.
 */
export async function reserveGift({
  itemKey,
  guestName,
  coupleId = null,
}) {
  if (!coupleId) {
    coupleId = await getCoupleIdFromChecklist();
  }

  const { data, error } = await supabase.rpc(
    "reserve_gift",
    {
      p_item_key: itemKey,
      p_guest_name: guestName,
      p_couple_id: coupleId,
    }
  );

  if (error) {
    throw error;
  }

  invalidateReservationsCache();

  return data === true;
}


/**
 * Cancela uma reserva (convidado).
 */
export async function cancelGiftReservation({
  itemKey,
  guestName,
  coupleId = null,
}) {
  if (!coupleId) {
    coupleId = await getCoupleIdFromChecklist();
  }

  const { data, error } = await supabase.rpc(
    "cancel_gift",
    {
      p_item_key: itemKey,
      p_guest_name: guestName,
      p_couple_id: coupleId,
    }
  );

  if (error) {
    throw error;
  }

  invalidateReservationsCache();

  return data === true;
}


/**
 * Cancela uma reserva como admin.
 */
export async function cancelGiftReservationAsAdmin(
  itemKey,
  coupleId = null
) {
  if (!coupleId) {
    coupleId = await getCoupleIdFromChecklist();
  }

  const { data, error } = await supabase.rpc(
    "cancel_gift_admin",
    {
      p_item_key: itemKey,
      p_couple_id: coupleId,
    }
  );

  if (error) {
    throw error;
  }

  invalidateReservationsCache();

  return data === true;
}
