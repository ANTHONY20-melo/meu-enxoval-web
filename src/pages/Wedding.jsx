import { useMemo, useState } from "react";
import { weddingChecklist } from "../data/weddingChecklist";

export default function Wedding() {
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem(
      "checklist-casamento-evento"
    );

    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return weddingChecklist;
      }
    }

    return weddingChecklist;
  });

  const [search, setSearch] = useState("");

  function saveChecklist(updatedCategories) {
    setCategories(updatedCategories);

    localStorage.setItem(
      "checklist-casamento-evento",
      JSON.stringify(updatedCategories)
    );
  }

  function toggleItem(categoryId, itemId) {
    const updatedCategories = categories.map(
      (category) => {
        if (category.id !== categoryId) {
          return category;
        }

        return {
          ...category,

          items: category.items.map((item) => {
            if (item.id !== itemId) {
              return item;
            }

            return {
              ...item,
              checked: !item.checked,
            };
          }),
        };
      }
    );

    saveChecklist(updatedCategories);
  }

  const statistics = useMemo(() => {
    const allItems = categories.flatMap(
      (category) => category.items
    );

    const completed = allItems.filter(
      (item) => item.checked
    ).length;

    const total = allItems.length;

    const percentage =
      total === 0
        ? 0
        : Math.round(
            (completed / total) * 100
          );

    return {
      completed,
      total,
      percentage,
    };
  }, [categories]);

  const filteredCategories = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    if (!normalizedSearch) {
      return categories;
    }

    return categories
      .map((category) => ({
        ...category,

        items: category.items.filter((item) =>
          item.name
            .toLowerCase()
            .includes(normalizedSearch)
        ),
      }))
      .filter(
        (category) =>
          category.items.length > 0
      );
  }, [categories, search]);

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
            Todos os detalhes do nosso casamento
            organizados em um só lugar. ❤️
          </p>
        </div>
      </section>

      <section
        className="dashboard-section"
        id="checklist-casamento"
      >
        <div className="container">
          <div className="progress-card">
            <div className="progress-header">
              <div>
                <span>
                  Progresso do casamento
                </span>

                <strong>
                  {statistics.completed} de{" "}
                  {statistics.total} itens
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

          <div className="search-container">
            <span>🔎</span>

            <input
              type="text"
              placeholder="Buscar item do casamento..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="categories-grid">
            {filteredCategories.map(
              (category) => {
                const completed =
                  category.items.filter(
                    (item) => item.checked
                  ).length;

                return (
                  <section
                    className="category-card"
                    key={category.id}
                  >
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
                            {completed} de{" "}
                            {category.items.length}{" "}
                            concluídos
                          </span>
                        </div>
                      </div>
                    </header>

                    <div className="checklist-items">
                      {category.items.map(
                        (item) => (
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
                        )
                      )}
                    </div>
                  </section>
                );
              }
            )}
          </div>

          {filteredCategories.length === 0 && (
            <div className="empty-search">
              <p>
                Nenhum item encontrado para
                "{search}".
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}