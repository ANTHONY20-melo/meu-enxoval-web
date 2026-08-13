import {
  useEffect,
  useState,
} from "react";


/**
 * Modal de reserva de presente.
 *
 * Modo convidado (sem reserva): pede o nome
 * e reserva o item.
 *
 * Modo convidado (reserva É deste aparelho):
 * mostra "Você reservou" e permite desfazer
 * informando o mesmo nome (já preenchido).
 *
 * Modo convidado (reserva de outro):
 * mostra apenas "Item já reservado", sem
 * expor o nome de quem reservou.
 *
 * Modo admin: mostra quem reservou e permite
 * cancelar qualquer reserva sem digitar nome.
 */
export default function ReservationModal({
  item,
  itemKey,
  guestName,
  isMine = false,
  myName = "",
  isAdmin,
  busy,
  onReserve,
  onCancelGuest,
  onCancelAdmin,
  onClose,
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");


  useEffect(() => {
    setName(
      isMine && myName ? myName : ""
    );

    setError("");
  }, [itemKey, isMine, myName]);


  function handleReserve(event) {
    event?.preventDefault();

    const normalized = name.trim();

    if (normalized.length < 2) {
      setError(
        "Digite seu nome completo (mínimo 2 letras)."
      );

      return;
    }

    if (normalized.length > 80) {
      setError(
        "Nome muito longo."
      );

      return;
    }

    onReserve(normalized);
  }


  function handleCancelGuest(event) {
    event?.preventDefault();

    const normalized = name.trim();

    if (!normalized) {
      setError(
        "Digite seu nome para desfazer a reserva."
      );

      return;
    }

    onCancelGuest(normalized);
  }


  return (
    <div
      className="confirm-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Reservar presente"
      onClick={onClose}
    >

      <div
        className="confirm-dialog"
        onClick={(event) =>
          event.stopPropagation()
        }
      >

        <h3>
          {guestName
            ? isAdmin
              ? "Reserva existente"
              : isMine
                ? "Você reservou este item"
                : "Item já reservado"
            : "Quem vai dar este presente?"}
        </h3>

        <p>
          <strong>
            {item.name}
          </strong>
        </p>


        {/* JÁ RESERVADO */}

        {guestName && !isAdmin && (
          <div className="reservation-info">
            <span
              className={
                isMine
                  ? "reservation-badge mine"
                  : "reservation-badge plain"
              }
            >
              {isMine
                ? "✅ Você reservou este item"
                : "🎁 Este item já foi reservado"}
            </span>

            <p className="reservation-note">
              {isMine
                ? "Para desfazer sua reserva, toque no botão abaixo."
                : "Escolha outro item da lista para presentear. 😊"}
            </p>
          </div>
        )}

        {guestName && isAdmin && (
          <div className="reservation-info">
            <span className="reservation-badge">
              🎁 Reservado por{" "}
              <strong>
                {guestName}
              </strong>
            </span>
          </div>
        )}


        {/* CAMPO NOME (convidado — livre ou reserva própria) */}

        {!isAdmin && (!guestName || isMine) && (
          <form
            onSubmit={
              guestName
                ? handleCancelGuest
                : handleReserve
            }
          >

            <label className="reservation-field">
              <span>
                Seu nome
              </span>

              <input
                type="text"
                value={name}
                autoFocus
                autoComplete="name"
                placeholder="Ex: Maria Silva"
                maxLength={80}
                onChange={(event) => {
                  setName(
                    event.target.value
                  );

                  setError("");
                }}
              />
            </label>

            {error && (
              <p className="admin-error">
                {error}
              </p>
            )}

            <div className="confirm-actions">

              <button
                type="button"
                className="cancel-item-button"
                disabled={busy}
                onClick={onClose}
              >
                Fechar
              </button>

              <button
                type="submit"
                className={
                  guestName
                    ? "confirm-delete-button"
                    : "confirm-reserve-button"
                }
                disabled={busy}
              >
                {busy
                  ? "Processando..."
                  : guestName
                    ? "Desfazer minha reserva"
                    : "Reservar presente"}
              </button>

            </div>

          </form>
        )}


        {/* RESERVA DE OUTRO CONVIDADO */}

        {!isAdmin && guestName && !isMine && (
          <div className="confirm-actions">

            <button
              type="button"
              className="confirm-reserve-button"
              disabled={busy}
              onClick={onClose}
            >
              Fechar
            </button>

          </div>
        )}


        {/* AÇÕES ADMIN */}

        {isAdmin && (
          <div className="confirm-actions">

            <button
              type="button"
              className="cancel-item-button"
              disabled={busy}
              onClick={onClose}
            >
              Fechar
            </button>

            <button
              type="button"
              className="confirm-delete-button"
              disabled={busy}
              onClick={() =>
                onCancelAdmin(itemKey)
              }
            >
              {busy
                ? "Processando..."
                : "Cancelar reserva"}
            </button>

          </div>
        )}

      </div>

    </div>
  );
}
