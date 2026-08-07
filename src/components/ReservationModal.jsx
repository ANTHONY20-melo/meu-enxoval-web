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
 * Modo convidado (já reservado): mostra quem
 * reservou e permite desfazer informando o
 * mesmo nome.
 *
 * Modo admin: permite cancelar qualquer
 * reserva sem digitar nome.
 */
export default function ReservationModal({
  item,
  itemKey,
  guestName,
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
    setName("");
    setError("");
  }, [itemKey]);


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
            <span className="reservation-badge">
              🎁 Reservado por{" "}
              <strong>
                {guestName}
              </strong>
            </span>

            <p className="reservation-note">
              Se você fez essa reserva e quer
              desfazê-la, digite seu nome
              abaixo.
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


        {/* CAMPO NOME (convidado) */}

        {!isAdmin && (
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
