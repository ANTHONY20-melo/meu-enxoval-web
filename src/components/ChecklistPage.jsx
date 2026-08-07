import {
  useChecklist
} from "../hooks/useChecklist";


/**
 * Página genérica de checklist.
 *
 * Usada pelas rotas /enxoval e /casamento
 * com configurações diferentes, eliminando
 * a duplicação que existia entre Home.jsx
 * e Wedding.jsx.
 *
 * @param {object} config
 * @param {string} config.listType  "enxoval" | "casamento"
 * @param {string} config.label     Texto pequeno acima do título
 * @param {string} config.title     Título da página
 * @param {string} config.subtitle  Frase de apoio
 * @param {string} config.progressLabel  Rótulo do progresso
 * @param {string} config.searchPlaceholder
 * @param {string} config.itemPlaceholder Placeholder do novo item
 * @param {Array}  config.initialData  Categorias padrão
 */
export default function ChecklistPage({
  config
}) {
  const checklist =
    useChecklist(
      config.listType,
      config.initialData
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
            {config.subtitle}
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
                            {completed}
                            {" "}de{" "}
                            {
                              category
                                .items
                                .length
                            }
                            {" "}concluídos
                          </span>
                        </div>

                      </div>

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

                          const isRemoving =
                            removingItem ===
                            removeKey;

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

    </main>
  );
}
