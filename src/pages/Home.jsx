import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { checklist } from "../data/checklist";

import {
  loadChecklist,
  saveChecklistItem,
  addChecklistItem,
  removeChecklistItem,
} from "../services/checklistService";

import "../App.css";


export default function Home() {
  const [categories, setCategories] =
    useState(checklist);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [addingCategory, setAddingCategory] =
    useState(null);

  const [newItemName, setNewItemName] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [removingItem, setRemovingItem] =
    useState(null);


  /*
  ========================================
  CARREGAR CHECKLIST
  ========================================
  */

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const databaseItems =
          await loadChecklist("enxoval");


        const updatedCategories =
          checklist.map((category) => {

            /*
            ==================================
            ITENS PADRÃO
            ==================================

            Os itens marcados como deleted
            no banco não serão carregados.
            */

            const defaultItems =
              category.items
                .filter((item) => {
                  const itemKey =
                    `enxoval:${category.id}:${item.id}`;

                  const databaseItem =
                    databaseItems.find(
                      (dbItem) =>
                        dbItem.item_key ===
                        itemKey
                    );

                  return (
                    databaseItem?.deleted !== true
                  );
                })
                .map((item) => {
                  const itemKey =
                    `enxoval:${category.id}:${item.id}`;

                  const savedItem =
                    databaseItems.find(
                      (databaseItem) =>
                        databaseItem.item_key ===
                        itemKey
                    );

                  return {
                    ...item,

                    checked:
                      savedItem
                        ? savedItem.checked
                        : item.checked,

                    isCustom: false,
                  };
                });


            /*
            ==================================
            ITENS PERSONALIZADOS
            ==================================
            */

            const customItems =
              databaseItems
                .filter(
                  (databaseItem) =>
                    databaseItem.category_id ===
                      category.id &&
                    databaseItem.is_custom ===
                      true &&
                    databaseItem.deleted !==
                      true
                )
                .map((databaseItem) => ({
                  id:
                    databaseItem.item_id,

                  name:
                    databaseItem.item_name,

                  checked:
                    databaseItem.checked,

                  isCustom: true,
                }));


            return {
              ...category,

              items: [
                ...defaultItems,
                ...customItems,
              ],
            };
          });


        setCategories(
          updatedCategories
        );

      } catch (error) {
        console.error(
          "Erro ao carregar checklist:",
          error
        );

        setError(
          "Não foi possível carregar o checklist."
        );

      } finally {
        setLoading(false);
      }
    }


    loadData();

  }, []);


  /*
  ========================================
  MARCAR OU DESMARCAR ITEM
  ========================================
  */

  async function toggleItem(
    categoryId,
    itemId
  ) {
    const category =
      categories.find(
        (category) =>
          category.id === categoryId
      );


    const currentItem =
      category?.items.find(
        (item) =>
          item.id === itemId
      );


    if (!currentItem) {
      return;
    }


    const updatedItem = {
      ...currentItem,

      checked:
        !currentItem.checked,
    };


    /*
    Atualização visual imediata
    */

    setCategories(
      (currentCategories) =>
        currentCategories.map(
          (category) => {

            if (
              category.id !== categoryId
            ) {
              return category;
            }


            return {
              ...category,

              items:
                category.items.map(
                  (item) =>
                    item.id === itemId
                      ? updatedItem
                      : item
                ),
            };
          }
        )
    );


    /*
    Salvar no banco
    */

    try {
      setError("");


      await saveChecklistItem({
        listType: "enxoval",

        categoryId,

        item: updatedItem,
      });

    } catch (error) {
      console.error(
        "Erro ao salvar item:",
        error
      );


      setError(
        "Não foi possível salvar a alteração."
      );


      /*
      Reverter alteração visual
      */

      setCategories(
        (currentCategories) =>
          currentCategories.map(
            (category) => {

              if (
                category.id !==
                categoryId
              ) {
                return category;
              }


              return {
                ...category,

                items:
                  category.items.map(
                    (item) =>
                      item.id === itemId
                        ? currentItem
                        : item
                  ),
              };
            }
          )
      );
    }
  }


  /*
  ========================================
  ABRIR FORMULÁRIO DE NOVO ITEM
  ========================================
  */

  function openAddItem(categoryId) {
    setAddingCategory(
      categoryId
    );

    setNewItemName("");

    setError("");
  }


  /*
  ========================================
  CANCELAR NOVO ITEM
  ========================================
  */

  function cancelAddItem() {
    setAddingCategory(null);

    setNewItemName("");
  }


  /*
  ========================================
  ADICIONAR NOVO ITEM
  ========================================
  */

  async function handleAddItem(
    categoryId
  ) {
    const name =
      newItemName.trim();


    if (!name) {
      setError(
        "Digite o nome do novo item."
      );

      return;
    }


    if (saving) {
      return;
    }


    try {
      setSaving(true);

      setError("");


      const newItem =
        await addChecklistItem({
          listType: "enxoval",

          categoryId,

          itemName: name,
        });


      setCategories(
        (currentCategories) =>
          currentCategories.map(
            (category) => {

              if (
                category.id !==
                categoryId
              ) {
                return category;
              }


              return {
                ...category,

                items: [
                  ...category.items,
                  newItem,
                ],
              };
            }
          )
      );


      setNewItemName("");

      setAddingCategory(null);

    } catch (error) {
      console.error(
        "Erro ao adicionar item:",
        error
      );


      setError(
        "Não foi possível adicionar o item."
      );

    } finally {
      setSaving(false);
    }
  }


  /*
  ========================================
  REMOVER QUALQUER ITEM
  ========================================
  */

  async function handleRemoveItem(
    categoryId,
    item
  ) {
    const confirmed =
      window.confirm(
        `Deseja remover "${item.name}" da lista?`
      );


    if (!confirmed) {
      return;
    }


    const removeKey =
      `${categoryId}:${item.id}`;


    try {
      setRemovingItem(
        removeKey
      );

      setError("");


      await removeChecklistItem({
        listType: "enxoval",

        categoryId,

        item,
      });


      /*
      Remove da interface
      */

      setCategories(
        (currentCategories) =>
          currentCategories.map(
            (category) => {

              if (
                category.id !==
                categoryId
              ) {
                return category;
              }


              return {
                ...category,

                items:
                  category.items.filter(
                    (currentItem) =>
                      currentItem.id !==
                      item.id
                  ),
              };
            }
          )
      );

    } catch (error) {
      console.error(
        "Erro ao remover item:",
        error
      );


      setError(
        "Não foi possível remover o item."
      );

    } finally {
      setRemovingItem(null);
    }
  }


  /*
  ========================================
  ESTATÍSTICAS
  ========================================
  */

  const statistics =
    useMemo(() => {

      const allItems =
        categories.flatMap(
          (category) =>
            category.items
        );


      const completed =
        allItems.filter(
          (item) =>
            item.checked
        ).length;


      const total =
        allItems.length;


      const percentage =
        total === 0
          ? 0
          : Math.round(
              (completed / total) *
                100
            );


      return {
        completed,
        total,
        percentage,
      };

    }, [categories]);


  /*
  ========================================
  PESQUISA
  ========================================
  */

  const filteredCategories =
    useMemo(() => {

      const normalizedSearch =
        search
          .trim()
          .toLowerCase();


      if (!normalizedSearch) {
        return categories;
      }


      return categories
        .map((category) => ({
          ...category,

          items:
            category.items.filter(
              (item) =>
                item.name
                  .toLowerCase()
                  .includes(
                    normalizedSearch
                  )
            ),
        }))
        .filter(
          (category) =>
            category.items.length > 0
        );

    }, [categories, search]);


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
              💍 Nosso casamento
            </span>

            <h1>
              Nosso Enxoval
            </h1>

            <p>
              Carregando nosso checklist...
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
            💍 Nosso casamento
          </span>

          <h1>
            Nosso Enxoval
          </h1>

          <p>
            Cada item marcado representa
            mais um passo para construirmos
            nosso lar juntos. ❤️
          </p>

        </div>

      </section>


      {/* DASHBOARD */}

      <section
        className="dashboard-section"
        id="checklist"
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
                  Progresso geral
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

            <span>
              🔎
            </span>

            <input
              type="text"

              placeholder="Buscar item do enxoval..."

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

                          placeholder="Ex: Lamparina"

                          value={
                            newItemName
                          }

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


                              {/* REMOVER QUALQUER ITEM */}

                              <button
                                type="button"

                                className="delete-item-button"

                                title={
                                  `Remover ${item.name}`
                                }

                                aria-label={
                                  `Remover ${item.name}`
                                }

                                disabled={
                                  isRemoving
                                }

                                onClick={() =>
                                  handleRemoveItem(
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

    </main>
  );
}