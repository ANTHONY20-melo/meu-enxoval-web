import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  loadBudgetItems,
  addBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
} from "../services/budgetService";

import "../App.css";


const categories = [
  "Cerimônia",
  "Recepção",
  "Buffet",
  "Bebidas",
  "Decoração",
  "Noiva",
  "Noivo",
  "Fotografia e Vídeo",
  "Música",
  "Convites",
  "Lembrancinhas",
  "Lua de Mel",
  "Transporte",
  "Documentação",
  "Outros",
];


const initialForm = {
  title: "",
  category: "Cerimônia",
  plannedValue: "",
  actualValue: "",
  paidValue: "",
  notes: "",
};


export default function Budget() {
  const [items, setItems] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  const [form, setForm] =
    useState(initialForm);


  /*
  ========================================
  CARREGAR ORÇAMENTO
  ========================================
  */

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        setError("");


        const data =
          await loadBudgetItems();


        setItems(data);

      } catch (error) {
        console.error(
          "Erro ao carregar orçamento:",
          error
        );


        setError(
          "Não foi possível carregar o orçamento."
        );

      } finally {
        setLoading(false);
      }
    }


    loadData();

  }, []);


  /*
  ========================================
  FORMATAR MOEDA
  ========================================
  */

  function formatCurrency(value) {
    return new Intl.NumberFormat(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    ).format(Number(value) || 0);
  }


  /*
  ========================================
  RESUMO FINANCEIRO
  ========================================
  */

  const summary = useMemo(() => {
    const planned = items.reduce(
      (total, item) =>
        total +
        Number(item.planned_value || 0),
      0
    );


    const actual = items.reduce(
      (total, item) =>
        total +
        Number(item.actual_value || 0),
      0
    );


    const paid = items.reduce(
      (total, item) =>
        total +
        Number(item.paid_value || 0),
      0
    );


    const remaining =
      Math.max(actual - paid, 0);


    const paidPercentage =
      actual <= 0
        ? 0
        : Math.min(
            Math.round(
              (paid / actual) * 100
            ),
            100
          );


    return {
      planned,
      actual,
      paid,
      remaining,
      paidPercentage,
    };

  }, [items]);


  /*
  ========================================
  FILTRO
  ========================================
  */

  const filteredItems =
    useMemo(() => {

      const normalizedSearch =
        search
          .trim()
          .toLowerCase();


      if (!normalizedSearch) {
        return items;
      }


      return items.filter((item) => {
        return (
          item.title
            .toLowerCase()
            .includes(normalizedSearch) ||

          item.category
            .toLowerCase()
            .includes(normalizedSearch)
        );
      });

    }, [items, search]);


  /*
  ========================================
  ALTERAR FORMULÁRIO
  ========================================
  */

  function handleInputChange(event) {
    const {
      name,
      value,
    } = event.target;


    setForm(
      (currentForm) => ({
        ...currentForm,

        [name]: value,
      })
    );
  }


  /*
  ========================================
  ABRIR NOVA DESPESA
  ========================================
  */

  function openNewItem() {
    setEditingId(null);

    setForm(initialForm);

    setShowForm(true);

    setError("");
  }


  /*
  ========================================
  EDITAR
  ========================================
  */

  function handleEdit(item) {
    setEditingId(item.id);


    setForm({
      title:
        item.title || "",

      category:
        item.category || "Outros",

      plannedValue:
        item.planned_value ?? "",

      actualValue:
        item.actual_value ?? "",

      paidValue:
        item.paid_value ?? "",

      notes:
        item.notes || "",
    });


    setShowForm(true);

    setError("");


    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  /*
  ========================================
  CANCELAR
  ========================================
  */

  function cancelForm() {
    setShowForm(false);

    setEditingId(null);

    setForm(initialForm);
  }


  /*
  ========================================
  SALVAR
  ========================================
  */

  async function handleSubmit(event) {
    event.preventDefault();


    if (!form.title.trim()) {
      setError(
        "Digite o nome da despesa."
      );

      return;
    }


    try {
      setSaving(true);

      setError("");


      if (editingId) {
        const updatedItem =
          await updateBudgetItem(
            editingId,
            form
          );


        setItems(
          (currentItems) =>
            currentItems.map(
              (item) =>
                item.id === editingId
                  ? updatedItem
                  : item
            )
        );

      } else {
        const newItem =
          await addBudgetItem(form);


        setItems(
          (currentItems) => [
            newItem,
            ...currentItems,
          ]
        );
      }


      cancelForm();

    } catch (error) {
      console.error(
        "Erro ao salvar despesa:",
        error
      );


      setError(
        "Não foi possível salvar a despesa."
      );

    } finally {
      setSaving(false);
    }
  }


  /*
  ========================================
  EXCLUIR
  ========================================
  */

  async function handleDelete(item) {
    const confirmed =
      window.confirm(
        `Deseja remover "${item.title}" do orçamento?`
      );


    if (!confirmed) {
      return;
    }


    try {
      setError("");


      await deleteBudgetItem(
        item.id
      );


      setItems(
        (currentItems) =>
          currentItems.filter(
            (currentItem) =>
              currentItem.id !== item.id
          )
      );

    } catch (error) {
      console.error(
        "Erro ao remover despesa:",
        error
      );


      setError(
        "Não foi possível remover a despesa."
      );
    }
  }


  /*
  ========================================
  STATUS
  ========================================
  */

  function getStatus(item) {
    const actual =
      Number(item.actual_value) || 0;

    const paid =
      Number(item.paid_value) || 0;


    if (
      actual > 0 &&
      paid >= actual
    ) {
      return {
        label: "Pago",
        className: "paid",
      };
    }


    if (paid > 0) {
      return {
        label: "Parcial",
        className: "partial",
      };
    }


    return {
      label: "Pendente",
      className: "pending",
    };
  }


  /*
  ========================================
  LOADING
  ========================================
  */

  if (loading) {
    return (
      <main className="budget-page">

        <div className="container">

          <div className="dashboard-loading">
            Carregando orçamento... 💰
          </div>

        </div>

      </main>
    );
  }


  /*
  ========================================
  INTERFACE
  ========================================
  */

  return (
    <main className="budget-page">


      {/* HERO */}

      <section className="budget-hero">

        <div className="container">

          <span className="checklist-label">
            💰 Nosso planejamento financeiro
          </span>


          <h1>
            Orçamento
          </h1>


          <p>
            Controle dos gastos do nosso
            casamento em um só lugar. ❤️
          </p>

        </div>

      </section>


      <section className="budget-content">

        <div className="container">


          {/* ERRO */}

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


          {/* RESUMO */}

          <div className="budget-summary-grid">

            <div className="budget-summary-card">

              <span>
                📋 Planejado
              </span>

              <strong>
                {formatCurrency(
                  summary.planned
                )}
              </strong>

            </div>


            <div className="budget-summary-card">

              <span>
                💍 Contratado
              </span>

              <strong>
                {formatCurrency(
                  summary.actual
                )}
              </strong>

            </div>


            <div className="budget-summary-card success">

              <span>
                ✅ Pago
              </span>

              <strong>
                {formatCurrency(
                  summary.paid
                )}
              </strong>

            </div>


            <div className="budget-summary-card warning">

              <span>
                ⏳ Falta pagar
              </span>

              <strong>
                {formatCurrency(
                  summary.remaining
                )}
              </strong>

            </div>

          </div>


          {/* PROGRESSO FINANCEIRO */}

          <div className="budget-progress-card">

            <div className="budget-progress-header">

              <div>

                <span>
                  Progresso dos pagamentos
                </span>

                <strong>
                  {formatCurrency(
                    summary.paid
                  )}
                  {" "}pagos
                </strong>

              </div>


              <span className="budget-percentage">

                {summary.paidPercentage}%

              </span>

            </div>


            <div className="progress-track">

              <div
                className="progress-fill"

                style={{
                  width:
                    `${summary.paidPercentage}%`,
                }}
              />

            </div>

          </div>


          {/* AÇÕES */}

          <div className="budget-toolbar">

            <div className="search-container budget-search">

              <span>
                🔎
              </span>


              <input
                type="text"

                placeholder=
                  "Buscar despesa ou categoria..."

                value={search}

                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

            </div>


            <button
              type="button"

              className="budget-add-button"

              onClick={openNewItem}
            >
              + Nova despesa
            </button>

          </div>


          {/* FORMULÁRIO */}

          {showForm && (

            <form
              className="budget-form"

              onSubmit={handleSubmit}
            >

              <div className="budget-form-header">

                <div>

                  <span>
                    {editingId
                      ? "✏️ Editando"
                      : "➕ Nova despesa"}
                  </span>


                  <h2>
                    {editingId
                      ? "Editar despesa"
                      : "Adicionar ao orçamento"}
                  </h2>

                </div>


                <button
                  type="button"

                  className="budget-close-button"

                  onClick={cancelForm}
                >
                  ×
                </button>

              </div>


              <div className="budget-form-grid">


                <label className="budget-field budget-field-large">

                  <span>
                    Nome da despesa
                  </span>


                  <input
                    type="text"

                    name="title"

                    placeholder=
                      "Ex: Fotógrafo"

                    value={form.title}

                    onChange={
                      handleInputChange
                    }

                    autoFocus
                  />

                </label>


                <label className="budget-field">

                  <span>
                    Categoria
                  </span>


                  <select
                    name="category"

                    value={
                      form.category
                    }

                    onChange={
                      handleInputChange
                    }
                  >

                    {categories.map(
                      (category) => (

                        <option
                          key={category}

                          value={category}
                        >
                          {category}
                        </option>

                      )
                    )}

                  </select>

                </label>


                <label className="budget-field">

                  <span>
                    Valor planejado
                  </span>


                  <input
                    type="number"

                    name="plannedValue"

                    min="0"

                    step="0.01"

                    placeholder="0,00"

                    value={
                      form.plannedValue
                    }

                    onChange={
                      handleInputChange
                    }
                  />

                </label>


                <label className="budget-field">

                  <span>
                    Valor contratado
                  </span>


                  <input
                    type="number"

                    name="actualValue"

                    min="0"

                    step="0.01"

                    placeholder="0,00"

                    value={
                      form.actualValue
                    }

                    onChange={
                      handleInputChange
                    }
                  />

                </label>


                <label className="budget-field">

                  <span>
                    Valor já pago
                  </span>


                  <input
                    type="number"

                    name="paidValue"

                    min="0"

                    step="0.01"

                    placeholder="0,00"

                    value={
                      form.paidValue
                    }

                    onChange={
                      handleInputChange
                    }
                  />

                </label>


                <label className="budget-field budget-field-full">

                  <span>
                    Observações
                  </span>


                  <textarea
                    name="notes"

                    rows="3"

                    placeholder=
                      "Ex: Segunda parcela vence em setembro..."

                    value={
                      form.notes
                    }

                    onChange={
                      handleInputChange
                    }
                  />

                </label>

              </div>


              <div className="budget-form-actions">

                <button
                  type="button"

                  className="cancel-item-button"

                  onClick={cancelForm}

                  disabled={saving}
                >
                  Cancelar
                </button>


                <button
                  type="submit"

                  className="save-item-button"

                  disabled={saving}
                >
                  {saving
                    ? "Salvando..."
                    : editingId
                      ? "Salvar alterações"
                      : "Adicionar despesa"}
                </button>

              </div>

            </form>

          )}


          {/* LISTA */}

          <div className="budget-list">

            {filteredItems.map(
              (item) => {

                const status =
                  getStatus(item);


                const actual =
                  Number(
                    item.actual_value
                  ) || 0;


                const paid =
                  Number(
                    item.paid_value
                  ) || 0;


                const remaining =
                  Math.max(
                    actual - paid,
                    0
                  );


                return (

                  <article
                    className="budget-item-card"

                    key={item.id}
                  >

                    <div className="budget-item-main">

                      <div className="budget-item-title">

                        <div>

                          <span className="budget-category">

                            {item.category}

                          </span>


                          <h3>
                            {item.title}
                          </h3>

                        </div>


                        <span
                          className={
                            `budget-status ${status.className}`
                          }
                        >
                          {status.label}
                        </span>

                      </div>


                      <div className="budget-values">

                        <div>

                          <span>
                            Planejado
                          </span>

                          <strong>
                            {formatCurrency(
                              item.planned_value
                            )}
                          </strong>

                        </div>


                        <div>

                          <span>
                            Contratado
                          </span>

                          <strong>
                            {formatCurrency(
                              item.actual_value
                            )}
                          </strong>

                        </div>


                        <div>

                          <span>
                            Pago
                          </span>

                          <strong className="budget-value-paid">

                            {formatCurrency(
                              item.paid_value
                            )}

                          </strong>

                        </div>


                        <div>

                          <span>
                            Falta
                          </span>

                          <strong>
                            {formatCurrency(
                              remaining
                            )}
                          </strong>

                        </div>

                      </div>


                      {item.notes && (

                        <p className="budget-notes">

                          📝 {item.notes}

                        </p>

                      )}

                    </div>


                    <div className="budget-item-actions">

                      <button
                        type="button"

                        className="budget-edit-button"

                        onClick={() =>
                          handleEdit(item)
                        }
                      >
                        ✏️ Editar
                      </button>


                      <button
                        type="button"

                        className="budget-delete-button"

                        onClick={() =>
                          handleDelete(item)
                        }
                      >
                        🗑️
                      </button>

                    </div>

                  </article>

                );
              }
            )}

          </div>


          {/* LISTA VAZIA */}

          {filteredItems.length === 0 && (

            <div className="budget-empty">

              <span>
                💰
              </span>


              <h3>
                {search
                  ? "Nenhuma despesa encontrada"
                  : "Seu orçamento está vazio"}
              </h3>


              <p>
                {search
                  ? "Tente buscar por outro nome ou categoria."
                  : "Adicione a primeira despesa para começar o planejamento financeiro."}
              </p>


              {!search && (

                <button
                  type="button"

                  className="budget-add-button"

                  onClick={openNewItem}
                >
                  + Adicionar primeira despesa
                </button>

              )}

            </div>

          )}

        </div>

      </section>

    </main>
  );
}