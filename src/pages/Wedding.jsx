import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  weddingChecklist,
} from "../data/weddingChecklist";

import {
  loadChecklist,
  saveChecklistItem,
  addChecklistItem,
  deleteChecklistItem,
} from "../services/checklistService";

import "../App.css";


export default function Wedding() {
  const [categories, setCategories] =
    useState(weddingChecklist);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    addingCategory,
    setAddingCategory,
  ] = useState(null);

  const [
    newItemName,
    setNewItemName,
  ] = useState("");

  const [saving, setSaving] =
    useState(false);


  /*
  ========================================
  CARREGAR DADOS DO SUPABASE
  ========================================
  */

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const databaseItems =
          await loadChecklist(
            "casamento"
          );


        const updatedCategories =
          weddingChecklist.map(
            (category) => {

              /*
              ITENS PADRÃO
              */

              const defaultItems =
                category.items.map(
                  (item) => {

                    const itemKey =
                      `casamento:${category.id}:${item.id}`;

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
                  }
                );


              /*
              ITENS PERSONALIZADOS
              */

              const customItems =
                databaseItems
                  .filter(
                    (databaseItem) =>
                      databaseItem.category_id ===
                        category.id &&
                      databaseItem.is_custom ===
                        true
                  )
                  .map(
                    (databaseItem) => ({
                      id:
                        databaseItem.item_id,

                      name:
                        databaseItem.item_name,

                      checked:
                        databaseItem.checked,

                      isCustom: true,
                    })
                  );


              return {
                ...category,

                items: [
                  ...defaultItems,
                  ...customItems,
                ],
              };
            }
          );


        setCategories(
          updatedCategories
        );

      } catch (error) {
        console.error(
          "Erro carregando casamento:",
          error
        );

        setError(
          "Não foi possível carregar o checklist do casamento."
        );

      } finally {
        setLoading(false);
      }
    }


    loadData();

  }, []);


  /*
  ========================================
  MARCAR / DESMARCAR ITEM
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
    SALVAR NO SUPABASE
    */

    try {
      setError("");


      await saveChecklistItem({
        listType: "casamento",

        categoryId,

        item: updatedItem,
      });

    } catch (error) {
      console.error(
        "Erro salvando item:",
        error
      );


      setError(
        "Não foi possível salvar a alteração."
      );


      /*
      REVERTER SE HOUVER ERRO
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
  ABRIR FORMULÁRIO
  ========================================
  */

  function openAddItem(
    categoryId
  ) {
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
  ADICIONAR ITEM PERSONALIZADO
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


    try {
      setSaving(true);

      setError("");


      const newItem =
        await addChecklistItem({
          listType:
            "casamento",

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
        "Erro adicionando item:",
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
  EXCLUIR ITEM PERSONALIZADO
  ========================================
  */

  async function handleDeleteItem(
    categoryId,
    itemId
  ) {
    const confirmed =
      window.confirm(
        "Deseja realmente excluir este item?"
      );


    if (!confirmed) {
      return;
    }


    try {
      setError("");


      await deleteChecklistItem({
        listType:
          "casamento",

        categoryId,

        itemId,
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

                items:
                  category.items.filter(
                    (item) =>
                      item.id !==
                      itemId
                  ),
              };
            }
          )
      );

    } catch (error) {
      console.error(
        "Erro excluindo item:",
        error
      );


      setError(
        "Não foi possível excluir o item."
      );
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
  FILTRO DE PESQUISA
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
        .map(
          (category) => ({
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
          })
        )
        .filter(
          (category) =>
            category.items.length >
            0
        );

    }, [categories, search]);


  /*
  ========================================
  CARREGAMENTO
  ========================================
  */

  if (loading) {
    return (
      <main className="checklist-page">

        <section className="checklist-hero">

          <div className="container">

            <span className="checklist-label">
              💒 Nosso grande dia
            </span>


            <h1>
              Nosso Casamento
            </h1>


            <p>
              Carregando nosso planejamento...
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
            💒 Nosso grande dia
          </span>


          <h1>
            Nosso Casamento
          </h1>


          <p>
            Todos os detalhes do nosso
            casamento organizados em um só
            lugar. ❤️
          </p>

        </div>

      </section>


      {/* DASHBOARD */}

      <section
        className="dashboard-section"
        id="checklist-casamento"
      >

        <div className="container">


          {/* ERRO */}

          {error && (
            <div className="checklist-error">
              {error}
            </div>
          )}


          {/* PROGRESSO */}

          <div className="progress-card">

            <div className="progress-header">

              <div>

                <span>
                  Progresso do casamento
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

              placeholder=
                "Buscar item do casamento..."

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


                      {/* BOTÃO ADICIONAR */}

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


                    {/* FORMULÁRIO NOVO ITEM */}

                    {addingCategory ===
                      category.id && (

                      <div className="add-item-form">

                        <input
                          type="text"

                          placeholder=
                            "Digite o novo item..."

                          value={
                            newItemName
                          }

                          autoFocus

                          onChange={(
                            event
                          ) =>
                            setNewItemName(
                              event
                                .target
                                .value
                            )
                          }

                          onKeyDown={(
                            event
                          ) => {

                            if (
                              event.key ===
                              "Enter"
                            ) {
                              handleAddItem(
                                category.id
                              );
                            }

                          }}
                        />


                        <button
                          type="button"

                          className=
                            "save-item-button"

                          disabled={
                            saving
                          }

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

                          className=
                            "cancel-item-button"

                          onClick={
                            cancelAddItem
                          }
                        >

                          Cancelar

                        </button>

                      </div>

                    )}


                    {/* LISTA */}

                    <div className="checklist-items">

                      {category.items.map(
                        (item) => (

                          <div
                            className=
                              "checklist-item-row"

                            key={
                              item.id
                            }
                          >


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


                            {/* EXCLUI APENAS PERSONALIZADOS */}

                            {item.isCustom && (

                              <button
                                type="button"

                                className=
                                  "delete-item-button"

                                title=
                                  "Excluir item"

                                onClick={() =>
                                  handleDeleteItem(
                                    category.id,
                                    item.id
                                  )
                                }
                              >

                                ×

                              </button>

                            )}

                          </div>

                        )
                      )}

                    </div>

                  </section>
                );
              }
            )}

          </div>


          {/* SEM RESULTADOS */}

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