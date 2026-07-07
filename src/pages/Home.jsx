import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { checklist } from "../data/checklist";

import {
  loadChecklist,
  saveChecklistItem,
} from "../services/checklistService";

import "../App.css";


export default function Home() {
  const [categories, setCategories] =
    useState(checklist);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [savingItem, setSavingItem] =
    useState(null);

  const [error, setError] =
    useState("");


  /*
  ==========================================
  CARREGAR DADOS DO SUPABASE
  ==========================================
  */

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const savedItems =
          await loadChecklist("enxoval");

        if (
          !savedItems ||
          savedItems.length === 0
        ) {
          return;
        }

        setCategories(
          checklist.map((category) => {
            return {
              ...category,

              items: category.items.map(
                (item) => {
                  const itemKey =
                    `enxoval:${category.id}:${item.id}`;

                  const savedItem =
                    savedItems.find(
                      (databaseItem) =>
                        databaseItem.item_key ===
                        itemKey
                    );

                  if (!savedItem) {
                    return item;
                  }

                  return {
                    ...item,
                    checked:
                      savedItem.checked,
                  };
                }
              ),
            };
          })
        );
      } catch (error) {
        console.error(
          "Erro ao carregar checklist:",
          error
        );

        setError(
          "Não foi possível carregar os dados salvos."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);


  /*
  ==========================================
  MARCAR OU DESMARCAR ITEM
  ==========================================
  */

  async function toggleItem(
    categoryId,
    itemId
  ) {
    if (savingItem === itemId) {
      return;
    }

    const category =
      categories.find(
        (category) =>
          category.id === categoryId
      );

    if (!category) {
      return;
    }

    const currentItem =
      category.items.find(
        (item) => item.id === itemId
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
    Salvar no Supabase
    */

    try {
      setSavingItem(itemId);
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
      caso o Supabase falhe
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
                        ? currentItem
                        : item
                  ),
              };
            }
          )
      );
    } finally {
      setSavingItem(null);
    }
  }


  /*
  ==========================================
  ESTATÍSTICAS
  ==========================================
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
          (item) => item.checked
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
  ==========================================
  PESQUISA
  ==========================================
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
  ==========================================
  TELA DE CARREGAMENTO
  ==========================================
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
  ==========================================
  INTERFACE
  ==========================================
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


      {/* CHECKLIST */}

      <section
        className="dashboard-section"
        id="checklist"
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

                    {/* CABEÇALHO DA CATEGORIA */}

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

                    </header>


                    {/* ITENS */}

                    <div className="checklist-items">

                      {category.items.map(
                        (item) => {

                          const isSaving =
                            savingItem ===
                            item.id;

                          return (
                            <label
                              className={
                                item.checked
                                  ? "checklist-item checked"
                                  : "checklist-item"
                              }
                              key={item.id}
                            >

                              <input
                                type="checkbox"
                                checked={
                                  item.checked
                                }
                                disabled={
                                  isSaving
                                }
                                onChange={() =>
                                  toggleItem(
                                    category.id,
                                    item.id
                                  )
                                }
                              />


                              <span className="custom-checkbox">

                                {isSaving
                                  ? "..."
                                  : item.checked
                                    ? "✓"
                                    : ""}

                              </span>


                              <span className="item-name">
                                {item.name}
                              </span>

                            </label>
                          );
                        }
                      )}

                    </div>

                  </section>
                );
              }
            )}

          </div>


          {/* PESQUISA SEM RESULTADOS */}

          {filteredCategories.length === 0 && (
            <div className="empty-search">

              <p>
                Nenhum item encontrado para
                {" "}
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