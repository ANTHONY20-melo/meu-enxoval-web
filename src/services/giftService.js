import { supabase } from "./supabase";


/**
 * Serviço de reservas de presentes.
 *
 * Convidados reservam itens do enxoval
 * digitando o próprio nome. As operações
 * de escrita acontecem via funções RPC
 * (seguras), nunca via insert/delete direto.
 *
 * As reservas são públicas (leitura para
 * todos) e ficam em cache curto para evitar
 * requisições repetidas entre rotas.
 */

const CACHE_TTL_MS = 10 * 1000;

let reservationsCache = null;

function getCached() {
  if (
    reservationsCache &&
    Date.now() - reservationsCache.at <
      CACHE_TTL_MS
  ) {
    return reservationsCache.data;
  }

  return null;
}

function setCached(data) {
  reservationsCache = {
    at: Date.now(),
    data,
  };
}

export function invalidateReservationsCache() {
  reservationsCache = null;
}


export async function loadGiftReservations() {
  const cached = getCached();

  if (cached) {
    return cached;
  }

  const { data, error } = await supabase
    .from("gift_reservations")
    .select("item_key,guest_name");

  if (error) {
    throw error;
  }

  setCached(data || []);

  return data || [];
}


export async function reserveGift({
  itemKey,
  guestName,
}) {
  const { data, error } = await supabase.rpc(
    "reserve_gift",
    {
      p_item_key: itemKey,
      p_guest_name: guestName,
    }
  );

  if (error) {
    throw error;
  }

  invalidateReservationsCache();

  return data === true;
}


export async function cancelGiftReservation({
  itemKey,
  guestName,
}) {
  const { data, error } = await supabase.rpc(
    "cancel_gift",
    {
      p_item_key: itemKey,
      p_guest_name: guestName,
    }
  );

  if (error) {
    throw error;
  }

  invalidateReservationsCache();

  return data === true;
}


export async function cancelGiftReservationAsAdmin(
  itemKey
) {
  const { data, error } = await supabase.rpc(
    "cancel_gift_admin",
    {
      p_item_key: itemKey,
    }
  );

  if (error) {
    throw error;
  }

  invalidateReservationsCache();

  return data === true;
}
