import {
  useEffect,
  useState,
} from "react";

import {
  loadChecklist,
} from "../services/checklistService";

import {
  loadBudgetItems,
} from "../services/budgetService";

import { Link } from "react-router";

import "../App.css";


export default function Dashboard() {
  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [enxovalStats, setEnxovalStats] =
    useState({
      completed: 0,
      total: 0,
      percentage: 0,
    });

  const [
    casamentoStats,
    setCasamentoStats,
  ] = useState({
    completed: 0,
    total: 0,
    percentage: 0,
  });

  const [budgetStats, setBudgetStats] =
    useState({
      items: 0,
      paidPercentage: 0,
    });


  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);

        const [
          enxovalItems,
          casamentoItems,
          budgetItems,
        ] = await Promise.all([
          loadChecklist("enxoval"),
          loadChecklist("casamento"),
          loadBudgetItems(),
        ]);

        setEnxovalStats(
          calculateStats(
            enxovalItems
          )
        );

        setCasamentoStats(
          calculateStats(
            casamentoItems
          )
        );

        setBudgetStats(
          calculateBudgetStats(
            budgetItems
          )
        );

      } catch (err) {
        console.error(
          "Erro ao carregar dashboard:",
          err
        );

        setError(
          "Não foi possível carregar o painel. Verifique sua conexão."
        );

      } finally {
        setLoading(false);
      }
    }

    loadDashboard();

  }, []);


  function calculateStats(items) {
    const activeItems =
      items.filter(
        (item) =>
          item.deleted !== true
      );

    const total =
      activeItems.length;

    const completed =
      activeItems.filter(
        (item) =>
          item.checked
      ).length;

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
  }


  function calculateBudgetStats(items) {
    const actual =
      items.reduce(
        (sum, item) =>
          sum +
          Number(
            item.actual_value || 0
          ),
        0
      );

    const paid =
      items.reduce(
        (sum, item) =>
          sum +
          Number(
            item.paid_value || 0
          ),
        0
      );

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
      items: items.length,
      paidPercentage,
    };
  }


  if (loading) {
    return (
      <main className="dashboard-page">

        <div className="container">

          <div className="dashboard-loading">
            Carregando nosso painel... ❤️
          </div>

        </div>

      </main>
    );
  }


  return (
    <main className="dashboard-page">


      {/* APRESENTAÇÃO */}

      <section className="dashboard-welcome">

        <div className="container">

          <span className="checklist-label">
            💍 Nosso planejamento
          </span>


          <h1>
            Nosso Casamento
          </h1>


          <p>
            Um cantinho para organizarmos
            juntos cada detalhe da nossa
            nova vida. ❤️
          </p>

        </div>

      </section>


      {/* RESUMO */}

      <section className="dashboard-content">

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


          <h2 className="dashboard-title">
            Nosso progresso
          </h2>


          <div className="dashboard-grid">


            {/* ENXOVAL */}

            <Link
              to="/enxoval"
              className="dashboard-card"
            >

              <div className="dashboard-card-top">

                <div className="dashboard-card-icon">
                  🧺
                </div>


                <span>
                  {enxovalStats.percentage}%
                </span>

              </div>


              <h3>
                Nosso Enxoval
              </h3>


              <p>
                {enxovalStats.completed}
                {" "}de{" "}
                {enxovalStats.total}
                {" "}itens concluídos
              </p>


              <div className="dashboard-progress">

                <div
                  style={{
                    width:
                      `${enxovalStats.percentage}%`,
                  }}
                />

              </div>


              <strong className="dashboard-card-link">
                Ver enxoval →
              </strong>

            </Link>


            {/* CASAMENTO */}

            <Link
              to="/casamento"
              className="dashboard-card"
            >

              <div className="dashboard-card-top">

                <div className="dashboard-card-icon">
                  💒
                </div>


                <span>
                  {casamentoStats.percentage}%
                </span>

              </div>


              <h3>
                Nosso Casamento
              </h3>


              <p>
                {casamentoStats.completed}
                {" "}de{" "}
                {casamentoStats.total}
                {" "}itens concluídos
              </p>


              <div className="dashboard-progress">

                <div
                  style={{
                    width:
                      `${casamentoStats.percentage}%`,
                  }}
                />

              </div>


              <strong className="dashboard-card-link">
                Ver planejamento →
              </strong>

            </Link>


            {/* ORÇAMENTO */}

            <Link
              to="/orcamento"
              className="dashboard-card"
            >

              <div className="dashboard-card-top">

                <div className="dashboard-card-icon">
                  💰
                </div>

                <span>
                  {budgetStats.items} itens
                </span>

              </div>


              <h3>
                Orçamento
              </h3>


              <p>
                Controle de gastos,
                pagamentos e valores
                pendentes.
              </p>


              <div className="dashboard-progress">

                <div
                  style={{
                    width:
                      `${budgetStats.paidPercentage}%`,
                  }}
                />

              </div>


              <strong className="dashboard-card-link">
                Abrir orçamento →
              </strong>

            </Link>


          </div>

        </div>

      </section>

    </main>
  );
}
