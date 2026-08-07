import { supabase } from "./supabase";


/**
 * Serviço de reservas de presentes.
 *
 * Convidados reservam itens do enxoval
 * digitando o próprio nome. As operações
 * de escrita acontecem via funções RPC
 * (seguras), nunca via insert/delete direto.
 */


export async function loadGiftReservations() {
  const { data, error } = await supabase
    .from("gift_reservations")
    .select("*");

  if (error) {
    throw error;
  }

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

  return data === true;
}
