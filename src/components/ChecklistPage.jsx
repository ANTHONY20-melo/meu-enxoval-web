import {
  useState,
  useEffect,
} from "react";

import {
  useChecklist
} from "../hooks/useChecklist";

import {
  useGiftReservations
} from "../hooks/useGiftReservations";

import { useAuth }
  from "../context/AuthContext";

import ReservationModal
  from "./ReservationModal";

import {
  loadMyGuestNames,
  rememberGuestName,
  forgetGuestName,
  pruneMyGuestNames,
} from "../services/localGuestNames";


/**
 * Página genérica de checklist.
 *
 * Usada pelas rotas /enxoval e /casamento
 * com configurações diferentes.
 *
 * Para visitantes no enxoval (guestReservations),
 * o checkbox é substituído pela reserva de
 * presentes com nome do convidado.
 *
 * @param {object} config
 */
export default function ChecklistPage({
  config
}) {
  const {
    isAdmin,
  } = useAuth();

  const guestMode =
    config.guestReservations === true &&
    !isAdmin;

  const checklist =
    useChecklist(
      config.listType,
      config.initialData
    );

  const reservations =
    useGiftReservations(
      config.guestReservations === true
    );

  const {
    statistics,
    filteredCategories,
    loading,
    error,
    setError,
    search,
    setSearch,
    addingCategory,
    newItemName,
    setNewItemName,
    saving,
    removingItem,
    confirmRemove,
    setConfirmRemove,
    toggleItem,
    openAddItem,
    cancelAddItem,
    handleAddItem,
    askRemoveItem,
    handleRemoveItem,
  } = checklist;

  const {
    reservationMap,
    busyItemKey,
    reserve,
    cancel,
    cancelAsAdmin,
    loading: reservationsLoading,
  } = reservations;

  const [reservingItem, setReservingItem] =
    useState(null);

  const [myNames, setMyNames] =
    useState({});


  // Lê no início os nomes já usados neste
  // dispositivo.
  useEffect(() => {
    setMyNames(
      loadMyGuestNames()
    );
  }, []);


  // Remove nomes locais de itens que não
  // têm mais reserva ativa (cancelados em
  // outro aparelho).
  useEffect(() => {
    if (reservationsLoading) {
      return;
    }

    const active = new Set(
      Object.keys(reservationMap)
    );

    pruneMyGuestNames(active);

    setMyNames((previous) => {
      const next = {};

      for (const [key, value] of Object.entries(
        previous
      )) {
        if (active.has(key)) {
          next[key] = value;
        }
      }

      return next;
    });
  }, [reservationMap, reservationsLoading]);


  function openReservation(categoryId, item) {
    const itemKey =
      `${config.listType}:${categoryId}:${item.id}`;

    setReservingItem({
      categoryId,
      item,
      itemKey,
    });
  }


  function closeReservation() {
    setReservingItem(null);
  }


  async function handleReserve(guestName) {
    if (!reservingItem) {
      return;
    }

    const ok = await reserve(
      reservingItem.itemKey,
      guestName
    );

    if (ok) {
      rememberGuestName(
        reservingItem.itemKey,
        guestName
      );

      setMyNames(
        loadMyGuestNames()
      );

      closeReservation();
    }
  }


  async function handleCancelGuest(guestName) {
    if (!reservingItem) {
      return;
    }

    const ok = await cancel(
      reservingItem.itemKey,
      guestName
    );

    if (ok) {
      forgetGuestName(
        reservingItem.itemKey
      );

      setMyNames(
        loadMyGuestNames()
      );

      closeReservation();
    }
  }


  async function handleCancelAdmin(itemKey) {
    const ok = await cancelAsAdmin(itemKey);

    if (ok) {
      closeReservation();
    }
  }


  const reservedCount =
    filteredCategories.reduce(
      (total, category) =>
        total +
        category.items.filter(
          (item) => {
            const itemKey =
              `${config.listType}:${category.id}:${item.id}`;

            return Boolean(
              reservationMap[itemKey]
            );
          }
        ).length,
      0
    );

  // Itens reservados por este dispositivo
  // ("Você reservou").
  const myCount =
    filteredCategories.reduce(
      (total, category) =>
        total +
        category.items.filter(
          (item) => {
            const itemKey =
              `${config.listType}:${category.id}:${item.id}`;

            return Boolean(
              reservationMap[itemKey] &&
                myNames[itemKey]
            );
          }
        ).length,
      0
    );


  /*
  ========================================
  LOADING
  ========================================
  */

  if (loading) {
    return (
      <main className="checklist-page">
        <section className="checklist-hero">
          <div className="container">
            <span className="checklist-label">
              {config.label}
            </span>

            <h1>
              {config.title}
            </h1>

            <p>
              Carregando...
            </p>
          </div>
        </section>
      </main>
    );
  }


  /*
  ========================================
  INTERFACE
  ========================================
  */

  return (
    <main className="checklist-page">

      {/* HERO */}

      <section className="checklist-hero">
        <div className="container">
          <span className="checklist-label">
            {config.label}
          </span>

          <h1>
            {config.title}
          </h1>

          <p>
            {guestMode
              ? "Escolha um presente e escreva seu nome para reservá-lo. Cada item pode ser reservado uma única vez. 💝"
              : config.subtitle}
          </p>
        </div>
      </section>


      {/* DASHBOARD */}

      <section
        className="dashboard-section"
        id={config.sectionId || "checklist"}
      >

        <div className="container">

          {/* MENSAGEM DE ERRO */}

          {error && (
            <div className="checklist-error">
              <span>
                {error}
              </span>

              <button
                type="button"
                aria-label="Fechar mensagem de erro"
                onClick={() =>
                  setError("")
                }
              >
                ×
              </button>
            </div>
          )}


          {/* PROGRESSO */}

          {!guestMode && (
            <div className="progress-card">
              <div className="progress-header">
                <div>
                  <span>
                    {config.progressLabel}
                  </span>

                  <strong>
                    {statistics.completed}
                    {" "}de{" "}
                    {statistics.total}
                    {" "}itens
                  </strong>
                </div>

                <div className="progress-percentage">
                  {statistics.percentage}%
                </div>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width:
                      `${statistics.percentage}%`,
                  }}
                />
              </div>
            </div>
          )}


          {/* PESQUISA */}

          <div className="search-container">
            <span aria-hidden="true">
              🔎
            </span>

            <input
              type="text"
              placeholder={
                config.searchPlaceholder
              }
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>


          {/* CATEGORIAS */}

          <div className="categories-grid">

            {filteredCategories.map(
              (category) => {

                const completed =
                  category.items.filter(
                    (item) =>
                      item.checked
                  ).length;

                const reserved =
                  category.items.filter(
                    (item) => {
                      const itemKey =
                        `${config.listType}:${category.id}:${item.id}`;

                      return Boolean(
                        reservationMap[itemKey]
                      );
                    }
                  ).length;

                return (
                  <section
                    className="category-card"
                    key={category.id}
                  >

                    {/* CABEÇALHO */}

                    <header className="category-header">

                      <div className="category-title">

                        <span className="category-icon">
                          {category.icon}
                        </span>

                        <div>
                          <h2>
                            {category.title}
                          </h2>

                          <span>
                            {guestMode
                              ? `${reserved} de ${category.items.length} reservados`
                              : `${completed} de ${category.items.length} concluídos`}
                          </span>
                        </div>

                      </div>

                      {!guestMode && (
                        <button
                          type="button"
                          className="add-item-button"
                          onClick={() =>
                            openAddItem(
                              category.id
                            )
                          }
                        >
                          + Adicionar
                        </button>
                      )}

                    </header>


                    {/* FORMULÁRIO DE ADIÇÃO */}

                    {addingCategory ===
                      category.id && (
                      <div className="add-item-form">

                        <input
                          type="text"
                          placeholder={
                            config.itemPlaceholder
                          }
                          value={newItemName}
                          autoFocus
                          onChange={(event) =>
                            setNewItemName(
                              event.target.value
                            )
                          }
                          onKeyDown={(event) => {
                            if (
                              event.key ===
                                "Enter" &&
                              !saving
                            ) {
                              handleAddItem(
                                category.id
                              );
                            }

                            if (
                              event.key ===
                              "Escape"
                            ) {
                              cancelAddItem();
                            }
                          }}
                        />

                        <button
                          type="button"
                          className="save-item-button"
                          disabled={saving}
                          onClick={() =>
                            handleAddItem(
                              category.id
                            )
                          }
                        >
                          {saving
                            ? "Salvando..."
                            : "Adicionar"}
                        </button>

                        <button
                          type="button"
                          className="cancel-item-button"
                          disabled={saving}
                          onClick={
                            cancelAddItem
                          }
                        >
                          Cancelar
                        </button>

                      </div>
                    )}


                    {/* LISTA DE ITENS */}

                    <div className="checklist-items">

                      {category.items.map(
                        (item) => {

                          const removeKey =
                            `${category.id}:${item.id}`;

                          const itemKey =
                            `${config.listType}:${category.id}:${item.id}`;

                          const isRemoving =
                            removingItem ===
                            removeKey;

                          const guestName =
                            reservationMap[itemKey];

                          // Reservado por este
                          // dispositivo?
                          const isMine =
                            Boolean(
                              guestName &&
                                myNames[itemKey]
                            );

                          const isBusy =
                            busyItemKey ===
                            itemKey;

                          if (guestMode) {
                            return (
                              <button
                                type="button"
                                className={
                                  guestName
                                    ? "checklist-item-row guest reserved"
                                    : "checklist-item-row guest"
                                }
                                key={item.id}
                                disabled={isBusy}
                                onClick={() =>
                                  openReservation(
                                    category.id,
                                    item
                                  )
                                }
                              >

                                <span className="guest-gift-icon">
                                  {guestName
                                    ? "🎁"
                                    : "➕"}
                                </span>

                                <span className="item-name">
                                  {item.name}
                                </span>

                                {guestName && (
                                  <span
                                    className={
                                      isMine
                                        ? "reservation-badge mine"
                                        : "reservation-badge plain"
                                    }
                                  >
                                    {isMine
                                      ? "✅ Você reservou"
                                      : "Reservado"}
                                  </span>
                                )}

                                {isBusy && (
                                  <span className="item-busy">
                                    ...
                                  </span>
                                )}

                              </button>
                            );
                          }


                          return (
                            <div
                              className="checklist-item-row"
                              key={item.id}
                            >

                              {/* CHECKBOX */}

                              <label
                                className={
                                  item.checked
                                    ? "checklist-item checked"
                                    : "checklist-item"
                                }
                              >

                                <input
                                  type="checkbox"
                                  checked={
                                    item.checked
                                  }
                                  disabled={
                                    isRemoving
                                  }
                                  onChange={() =>
                                    toggleItem(
                                      category.id,
                                      item.id
                                    )
                                  }
                                />

                                <span className="custom-checkbox">
                                  {item.checked
                                    ? "✓"
                                    : ""}
                                </span>

                                <span className="item-name">
                                  {item.name}
                                </span>

                              </label>


                              {/* RESERVA (admin vê badge) */}

                              {guestName && (
                                <button
                                  type="button"
                                  className="reservation-badge clickable"
                                  title={`Reservado por ${guestName} — clique para cancelar`}
                                  onClick={() =>
                                    openReservation(
                                      category.id,
                                      item
                                    )
                                  }
                                >
                                  🎁 {guestName}
                                </button>
                              )}


                              {/* REMOVER ITEM */}

                              <button
                                type="button"
                                className="delete-item-button"
                                title={`Remover ${item.name}`}
                                aria-label={`Remover ${item.name}`}
                                disabled={
                                  isRemoving
                                }
                                onClick={() =>
                                  askRemoveItem(
                                    category.id,
                                    item
                                  )
                                }
                              >
                                {isRemoving
                                  ? "..."
                                  : "🗑️"}
                              </button>

                            </div>
                          );
                        }
                      )}

                    </div>


                    {/* CATEGORIA VAZIA */}

                    {category.items.length ===
                      0 && (
                      <div className="empty-category">
                        <p>
                          Nenhum item nesta categoria.
                        </p>

                        {!guestMode && (
                          <button
                            type="button"
                            onClick={() =>
                              openAddItem(
                                category.id
                              )
                            }
                          >
                            + Adicionar primeiro item
                          </button>
                        )}
                      </div>
                    )}

                  </section>
                );
              }
            )}

          </div>


          {/* BUSCA SEM RESULTADO */}

          {filteredCategories.length ===
            0 && (

            <div className="empty-search">
              <p>
                Nenhum item encontrado para{" "}
                <strong>
                  "{search}"
                </strong>.
              </p>
            </div>

          )}


          {/* RODAPÉ PARA CONVIDADOS */}

          {guestMode && (
            <div className="guest-resume">
              {myCount > 0 ? (
                <>
                  🎁 Você reservou{" "}
                  <strong>
                    {myCount}
                  </strong>{" "}
                  {myCount === 1
                    ? "item"
                    : "itens"}{" "}
                  até agora! Toque no item
                  para desfazer.
                </>
              ) : reservedCount > 0 ? (
                <>
                  🎁{" "}
                  <strong>
                    {reservedCount}
                  </strong>{" "}
                  {reservedCount === 1
                    ? "item já foi reservado"
                    : "itens já foram reservados"}
                  . Escolha os seus!
                </>
              ) : (
                <>
                  ✨ Todos os itens estão
                  disponíveis. Escolha os
                  seus!
                </>
              )}
            </div>
          )}

        </div>

      </section>


      {/* CONFIRMAÇÃO DE REMOÇÃO */}

      {confirmRemove && (
        <div
          className="confirm-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar remoção"
        >

          <div className="confirm-dialog">

            <h3>
              Remover item?
            </h3>

            <p>
              Deseja remover{" "}
              <strong>
                "{confirmRemove.item.name}"
              </strong>{" "}
              da lista?
            </p>

            <div className="confirm-actions">

              <button
                type="button"
                className="cancel-item-button"
                disabled={saving}
                onClick={() =>
                  setConfirmRemove(null)
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="confirm-delete-button"
                disabled={saving}
                onClick={handleRemoveItem}
              >
                {saving
                  ? "Removendo..."
                  : "Remover"}
              </button>

            </div>

          </div>

        </div>
      )}


      {/* MODAL DE RESERVA */}

      {reservingItem && (
        <ReservationModal
          item={reservingItem.item}
          itemKey={reservingItem.itemKey}
          guestName={
            reservationMap[
              reservingItem.itemKey
            ]
          }
          isMine={Boolean(
            reservationMap[
              reservingItem.itemKey
            ] &&
              myNames[
                reservingItem.itemKey
              ]
          )}
          myName={
            myNames[
              reservingItem.itemKey
            ] || ""
          }
          isAdmin={isAdmin}
          busy={
            busyItemKey ===
            reservingItem.itemKey
          }
          onReserve={handleReserve}
          onCancelGuest={handleCancelGuest}
          onCancelAdmin={handleCancelAdmin}
          onClose={closeReservation}
        />
      )}

    </main>
  );
}
