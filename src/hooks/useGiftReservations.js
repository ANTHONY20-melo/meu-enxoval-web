import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  loadGiftReservations,
  reserveGift,
  cancelGiftReservation,
  cancelGiftReservationAsAdmin,
} from "../services/giftService";


/**
 * Hook de reservas de presentes.
 *
 * Carrega as reservas do enxoval e
 * expõe ações seguras (RPC):
 * - reserve(itemKey, guestName)
 * - cancel(itemKey, guestName)
 * - cancelAsAdmin(itemKey)
 *
 * A reserva fica disponível como um mapa
 * itemKey -> guestName.
 */
export function useGiftReservations(
  enabled = true
) {
  const [reservations, setReservations] =
    useState([]);

  const [loading, setLoading] =
    useState(enabled);

  const [error, setError] =
    useState("");

  const [busyItemKey, setBusyItemKey] =
    useState(null);


  async function load() {
    try {
      setLoading(true);
      setError("");

      const data =
        await loadGiftReservations();

      setReservations(data);
    } catch (err) {
      console.error(
        "Erro ao carregar reservas:",
        err
      );

      setError(
        "Não foi possível carregar as reservas."
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);


  const reservationMap = useMemo(
    () =>
      reservations.reduce(
        (map, reservation) => {
          map[reservation.item_key] =
            reservation.guest_name;

          return map;
        },
        {}
      ),
    [reservations]
  );


  async function reserve(
    itemKey,
    guestName
  ) {
    try {
      setBusyItemKey(itemKey);
      setError("");

      const ok = await reserveGift({
        itemKey,
        guestName,
      });

      if (ok) {
        await load();
      }

      return ok;
    } catch (err) {
      console.error(
        "Erro ao reservar:",
        err
      );

      setError(
        "Não foi possível reservar o item."
      );

      return false;
    } finally {
      setBusyItemKey(null);
    }
  }


  async function cancel(
    itemKey,
    guestName
  ) {
    try {
      setBusyItemKey(itemKey);
      setError("");

      const ok = await cancelGiftReservation({
        itemKey,
        guestName,
      });

      if (ok) {
        await load();
      }

      return ok;
    } catch (err) {
      console.error(
        "Erro ao cancelar reserva:",
        err
      );

      setError(
        "Não foi possível cancelar a reserva."
      );

      return false;
    } finally {
      setBusyItemKey(null);
    }
  }


  async function cancelAsAdmin(itemKey) {
    try {
      setBusyItemKey(itemKey);
      setError("");

      const ok =
        await cancelGiftReservationAsAdmin(
          itemKey
        );

      if (ok) {
        await load();
      }

      return ok;
    } catch (err) {
      console.error(
        "Erro ao cancelar reserva (admin):",
        err
      );

      setError(
        "Não foi possível cancelar a reserva."
      );

      return false;
    } finally {
      setBusyItemKey(null);
    }
  }


  return {
    reservations,
    reservationMap,
    loading,
    error,
    setError,
    busyItemKey,
    reserve,
    cancel,
    cancelAsAdmin,
  };
}
